import {cameraErrorMessage} from '../tracking/utils.js';
import {createCameraPreferences, defaultCameraPreferences} from './cameraPreferences.js';

// One owner of capture. Tracking remains owned by the existing mode hooks.
// Media/permission operations cannot be aborted: generations reject stale results
// and the transport promise serializes requests even after a local timeout.
export function createCameraController({
  getVideo, media = globalThis.navigator?.mediaDevices,
  permissions = globalThis.navigator?.permissions,
  storage, now = () => performance.now(), visible = () => !document.hidden,
  secure = () => globalThis.isSecureContext,
  setTimer = (fn, ms) => setTimeout(fn, ms), clearTimer = id => clearTimeout(id),
} = {}) {
  const saved = createCameraPreferences(storage);
  let prefs = saved.read();
  let verifiedSelection = {deviceId:prefs.deviceId, facingMode:prefs.facingMode};
  const restoring = prefs.remember && prefs.autoReconnect && prefs.startupConfirmed && visible();
  let snapshot = {status:restoring ? 'loading' : 'idle', error:'', detail:restoring ? 'Checking camera permission' : 'Camera off', prefs, devices:[], permission:'unknown', storageAvailable:saved.available,
    metrics:{attempts:0, activeStreams:0, maxActiveStreams:0, lastStartMs:null, recoveryMs:null}};
  const listeners = new Set();
  let stream = null, generation = 0, initialized = false, suppressed = false;
  let permissionStatus = null, transport = null, task = null, cancelWait = null, taskAutomatic = false;
  let recoveryUsed = false, recoveryStarted = null, lastSettings = null, enumerateGeneration = 0, selectionGeneration = 0;
  const publish = patch => {
    snapshot = {...snapshot, ...patch};
    for (const fn of listeners) fn();
  };
  const metrics = patch => ({...snapshot.metrics, ...patch});
  const persist = () => { saved.write({...prefs, ...verifiedSelection}); publish({prefs, storageAvailable:saved.available}); };
  const stopStream = value => value?.getTracks().forEach(track => { track.onended = null; track.stop(); });
  const release = () => {
    generation++;
    cancelWait?.(); cancelWait = null; task = null;
    stopStream(stream); stream = null;
    const video = getVideo?.();
    if (video) { video.pause(); video.srcObject = null; }
    publish({metrics:metrics({activeStreams:0})});
  };

  async function refreshDevices() {
    const token = ++enumerateGeneration;
    if (!media?.enumerateDevices) return [];
    try {
      const all = await media.enumerateDevices();
      const devices = all.filter(d => d.kind === 'videoinput').map((d, i) => ({deviceId:d.deviceId, label:d.label || `Camera ${i + 1}`}));
      if (initialized && token === enumerateGeneration) publish({devices});
      return devices;
    } catch { return null; }
  }

  async function queryPermission(token) {
    try {
      const result = await permissions?.query({name:'camera'});
      if (token !== generation || !initialized) return 'unknown';
      if (permissionStatus !== result) {
        permissionStatus?.removeEventListener?.('change', permissionChanged);
        permissionStatus = result;
        permissionStatus?.addEventListener?.('change', permissionChanged);
      }
      const permission = ['granted','prompt','denied'].includes(result?.state) ? result.state : 'unknown';
      publish({permission});
      return permission;
    } catch { if (token === generation && initialized) publish({permission:'unknown'}); return 'unknown'; }
  }

  function permissionChanged() {
    if (!initialized) return;
    const permission = permissionStatus?.state || 'unknown';
    publish({permission});
    if (permission === 'denied' || permission === 'prompt') {
      release();
      publish({status:'error', error:'Camera permission was revoked or blocked. Allow access in browser settings, then reconnect.', detail:'Camera permission needed'});
    }
    // Granting permission alone is not a user request to restart capture.
  }

  async function unexpectedEnd() {
    if (!initialized) return;
    release();
    publish({status:'error', error:'Camera disconnected. Reconnect it and try again.', detail:'Camera disconnected'});
    if (suppressed || recoveryUsed || !prefs.remember || !prefs.autoReconnect || !visible()) return;
    recoveryUsed = true; recoveryStarted = now();
    await start({automatic:true, recovering:true});
  }

  function start({automatic = false, recovering = false} = {}) {
    if (!initialized) return Promise.resolve();
    if (automatic && (suppressed || !prefs.remember || !prefs.autoReconnect || !prefs.startupConfirmed || !visible())) return Promise.resolve();
    if (!automatic) { suppressed = false; recoveryUsed = false; }
    if (stream?.getVideoTracks().some(t => t.readyState === 'live')) return Promise.resolve();
    if (task) return task;
    taskAutomatic = automatic;
    const token = generation, started = now();
    publish({status:'loading', error:'', detail:automatic ? 'Checking camera permission' : 'Starting camera'});
    // Defer so task is assigned before the first asynchronous continuation.
    const operation = Promise.resolve().then(async () => {
      let timer;
      let cancelled = false;
      const interruption = new Promise((_, reject) => {
        cancelWait = () => { cancelled = true; reject({cancelled:true}); };
        timer = setTimer(() => reject({timeout:true}), 15000);
      });
      const valid = () => initialized && token === generation && !cancelled;
      const automaticBlocked = () => {
        if (!automatic || (visible() && !suppressed && prefs.remember && prefs.autoReconnect && prefs.startupConfirmed && permissionStatus?.state === 'granted')) return false;
        release();
        publish({status:'idle', detail:'Automatic reconnection paused. Reconnect camera when ready.'});
        return true;
      };
      const work = async () => {
        if (automatic) {
          const permission = await queryPermission(token);
          if (!valid()) return;
          if (permission !== 'granted') {
            publish({status:'idle', detail:permission === 'denied' ? 'Camera permission blocked. Reconnect after allowing access in browser settings.' : 'Reconnect camera to continue. Your browser may require permission or interaction.'});
            return;
          }
        }
        if (!valid()) return;
        if (!secure() || !media?.getUserMedia) throw {name:'SecurityError'};
        // Wait for any stale browser request before starting a replacement.
        if (transport) await transport.catch(() => {});
        if (!valid()) return;
        if (prefs.deviceId && media.enumerateDevices) {
          const devices = await refreshDevices();
          if (!valid()) return;
          if (devices && !devices.some(d => d.deviceId === prefs.deviceId) && (automatic || devices.some(d => d.deviceId))) {
            throw {savedMissing:true};
          }
        }
        if (!valid()) return;
        if (automaticBlocked()) return;
        const videoConstraints = {width:{ideal:640}, height:{ideal:480}, frameRate:{ideal:30}, ...(prefs.deviceId ? {deviceId:{exact:prefs.deviceId}} : {facingMode:prefs.facingMode})};
        publish({detail:recovering ? 'Recovering camera' : 'Starting camera', metrics:metrics({attempts:snapshot.metrics.attempts + 1})});
        const request = Promise.resolve().then(() => media.getUserMedia({video:videoConstraints, audio:false}));
        // Cleanup lives on the transport, not the raced operation, so late results
        // are released even if capture never settled before timeout/disposal.
        const ownedRequest = request.then(value => { if (!valid()) { stopStream(value); return null; } return value; });
        transport = ownedRequest;
        ownedRequest.finally(() => { if (transport === ownedRequest) transport = null; }).catch(() => {});
        const acquired = await ownedRequest;
        if (!valid() || !acquired) return;
        if (automaticBlocked()) { stopStream(acquired); return; }
        stream = acquired;
        publish({metrics:metrics({activeStreams:1, maxActiveStreams:Math.max(1,snapshot.metrics.maxActiveStreams)})});
        stream.getVideoTracks().forEach(track => { track.onended = unexpectedEnd; });
        const video = getVideo?.();
        if (!video) throw Error('Video unavailable');
        video.srcObject = stream;
        await video.play();
        if (!valid()) return;
        if (automaticBlocked()) return;
        lastSettings = stream.getVideoTracks()[0]?.getSettings?.() || {};
        prefs = {...prefs, startupConfirmed:prefs.remember, deviceId:lastSettings.deviceId || prefs.deviceId, facingMode:['user','environment'].includes(lastSettings.facingMode) ? lastSettings.facingMode : prefs.facingMode};
        verifiedSelection = {deviceId:prefs.deviceId, facingMode:prefs.facingMode};
        if (prefs.remember) persist();
        publish({status:'ready', detail:'Camera live · tracking initializes in the selected experience', prefs,
          metrics:metrics({lastStartMs:now()-started, ...(recovering && recoveryStarted !== null ? {recoveryMs:now()-recoveryStarted} : {})})});
        // Device labels are optional UI metadata; do not keep the startup
        // deadline running after the camera has successfully begun playback.
        void refreshDevices();
      };
      try { await Promise.race([work(), interruption]); }
      catch (error) {
        if (token !== generation || !initialized || error?.cancelled) return;
        release();
        const message = error?.savedMissing ? 'Your saved camera is unavailable. Change camera to choose another device.' : error?.timeout ? 'Camera connection is taking longer than expected. Retry camera, or choose alternate controls.' : cameraErrorMessage(error);
        publish({status:'error', error:message, detail:'Camera unavailable'});
      } finally {
        clearTimer(timer);
        if (token === generation) { cancelWait = null; task = null; }
      }
    });
    task = operation;
    return operation;
  }

  function setPreferences(change) {
    const remember = typeof change.remember === 'boolean' ? change.remember : prefs.remember;
    prefs = {...prefs, remember, startupConfirmed:remember && (prefs.startupConfirmed || snapshot.status === 'ready' && !!stream), autoReconnect:remember && (typeof change.autoReconnect === 'boolean' ? change.autoReconnect : prefs.autoReconnect)};
    if (remember && !prefs.deviceId && stream) {
      lastSettings = stream.getVideoTracks()[0]?.getSettings?.() || {};
      prefs = {...prefs, deviceId:lastSettings.deviceId || '', facingMode:lastSettings.facingMode === 'environment' ? 'environment' : 'user'};
      verifiedSelection = {deviceId:prefs.deviceId, facingMode:prefs.facingMode};
    }
    if (!prefs.autoReconnect && taskAutomatic && snapshot.status === 'loading') { release(); publish({status:'idle', detail:'Camera off'}); }
    persist();
  }

  async function selectCamera(deviceId, facingMode = prefs.facingMode) {
    if (typeof deviceId !== 'string' || deviceId.length > 512) return;
    const selection = ++selectionGeneration;
    release();
    prefs = {...prefs, deviceId, facingMode:facingMode === 'environment' ? 'environment' : 'user'};
    publish({prefs});
    await start();
    if (selection === selectionGeneration && snapshot.status !== 'ready') { prefs = {...prefs, ...verifiedSelection}; publish({prefs}); }
  }

  return {
    getSnapshot:() => snapshot,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    async initialize() {
      if (initialized) return task;
      initialized = true;
      media?.addEventListener?.('devicechange', refreshDevices);
      const token = generation;
      if (prefs.remember && prefs.autoReconnect && prefs.startupConfirmed && !suppressed) return start({automatic:true});
      await queryPermission(token);
      if (token === generation && initialized) await refreshDevices();
    },
    start, refreshDevices, setPreferences, selectCamera,
    stop() { suppressed = true; selectionGeneration++; release(); publish({status:'idle', error:'', detail:'Camera disconnected by you. Reconnect when ready.'}); },
    forget() {
      selectionGeneration++;
      prefs = {...defaultCameraPreferences(), remember:false, autoReconnect:false}; lastSettings = null;
      verifiedSelection = {deviceId:'', facingMode:'user'};
      if (snapshot.status === 'loading') { release(); publish({status:'idle', error:'', detail:'Camera off'}); }
      persist();
    },
    dispose() {
      initialized = false; enumerateGeneration++; selectionGeneration++;
      media?.removeEventListener?.('devicechange', refreshDevices);
      permissionStatus?.removeEventListener?.('change', permissionChanged); permissionStatus = null;
      release(); publish({status:'idle', error:'', detail:'Camera off'});
    },
  };
}
