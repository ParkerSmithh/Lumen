import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import './cameraSettings.css';

export function CameraSettings({camera, tracking, gate}) {
  const dialog = useRef(null), trigger = useRef(null);
  const [open, setOpen] = useState(false);
  const connected = camera.status === 'ready', busy = camera.status === 'loading';
  const close = () => { dialog.current?.close(); gate?.set(false, 'camera-settings'); setOpen(false); trigger.current?.focus({preventScroll:true}); };
  useEffect(() => { if (open) { dialog.current?.showModal(); camera.refreshDevices(); } }, [open]);
  useEffect(() => () => gate?.set(false, 'camera-settings'), [gate]);
  const input = connected ? tracking === 'loading' ? 'Camera live · preparing tracking' : tracking === 'error' ? 'Camera live · tracking unavailable. Retry tracking in the experience.' : ['tracking','drawing'].includes(tracking) ? 'Camera live · tracking active' : 'Camera live · move into view to begin tracking' : camera.error || camera.detail;
  return <>
    <button ref={trigger} className="camera-settings-open" aria-label="Camera settings" title="Camera settings" onClick={() => {gate?.set(true, 'camera-settings');setOpen(true);}}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/></svg>
    </button>
    {open && createPortal(<dialog ref={dialog} className="camera-settings" aria-labelledby="camera-settings-title" onCancel={event => {event.preventDefault();close();}} onClose={() => {gate?.set(false, 'camera-settings');setOpen(false);trigger.current?.focus({preventScroll:true});}}>
      <div className="camera-settings-heading"><h2 id="camera-settings-title">Camera settings</h2><button aria-label="Close camera settings" onClick={close}>×</button></div>
      <p className="camera-settings-status" role="status" aria-live="polite">{input}</p>
      {connected && !camera.prefs.remember && <p className="camera-settings-note">For quicker return visits, enable Remember My Camera and Auto-Reconnect below.</p>}
      <label className="camera-settings-field">Change Camera <span>Preferred webcam</span>
        <select aria-label="Preferred webcam" value={camera.prefs.deviceId} onChange={event => camera.selectCamera(event.target.value)}>
          <option value="">Browser default / facing preference</option>
          {camera.prefs.deviceId && !camera.devices.some(d => d.deviceId === camera.prefs.deviceId) && <option value={camera.prefs.deviceId}>Saved camera · unavailable or not yet visible</option>}
          {camera.devices.filter(d=>d.deviceId).map(device => <option key={device.deviceId} value={device.deviceId}>{device.label}</option>)}
        </select>
      </label>
      <label className="camera-settings-field">Mobile camera facing
        <select aria-label="Mobile camera facing" value={camera.prefs.facingMode} onChange={event => camera.selectCamera('', event.target.value)}><option value="user">Front / selfie</option><option value="environment">Rear / environment</option></select>
      </label>
      <label className="camera-settings-check"><input aria-label="Remember My Camera" aria-describedby="remember-camera-description" type="checkbox" checked={camera.prefs.remember} onChange={event => camera.setPreferences({remember:event.target.checked})}/><span>Remember My Camera<small id="remember-camera-description">Keep this camera choice on this browser and device.</small></span></label>
      <label className="camera-settings-check"><input aria-label="Auto-Reconnect" aria-describedby="auto-camera-description" type="checkbox" checked={camera.prefs.autoReconnect} disabled={!camera.prefs.remember} onChange={event => camera.setPreferences({autoReconnect:event.target.checked})}/><span>Auto-Reconnect<small id="auto-camera-description">Start your remembered camera on future visits when permission is already granted.</small></span></label>
      <p className="camera-settings-note">Camera permission stays under your browser’s control. If automatic startup is restricted, choose Reconnect Camera. Video is processed on your device and is never saved or uploaded by LUMEN.</p>
      {!camera.storageAvailable && <p className="camera-settings-storage" role="note">Storage is unavailable. Changes work for this session only. Previously saved choices may remain; clear this site’s data in browser settings to remove them if saving or forgetting fails.</p>}
      <div className="camera-settings-actions">
        {connected || busy ? <button onClick={camera.stop}>Disconnect Camera</button> : <button onClick={() => camera.start()}>{camera.prefs.remember || camera.metrics.attempts > 0 ? 'Reconnect Camera' : 'Connect Camera'}</button>}
        <button onClick={camera.forget}>Forget Preference</button>
      </div>
      <p className="camera-settings-note">Disconnect keeps the camera off for this session until you reconnect. Forget removes your saved choice and automatic-start preference; use Disconnect to stop the current camera.</p>
    </dialog>, document.body)}
  </>;
}
