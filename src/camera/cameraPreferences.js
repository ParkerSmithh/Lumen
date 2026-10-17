const KEY = 'lumen.camera.v1';
export const defaultCameraPreferences = () => ({version:1, remember:true, autoReconnect:true, deviceId:'', facingMode:'user', startupConfirmed:false});

export function sanitizeCameraPreferences(value) {
  if (!value || value.version !== 1 || typeof value.remember !== 'boolean' || typeof value.autoReconnect !== 'boolean') return defaultCameraPreferences();
  const remember = value.remember;
  return {
    version:1, remember, autoReconnect:remember && value.autoReconnect,
    deviceId:remember && typeof value.deviceId === 'string' && value.deviceId.length <= 512 ? value.deviceId : '',
    facingMode:remember && value.facingMode === 'environment' ? 'environment' : 'user',
    // Legacy v1 records were explicitly opted in. Fresh defaults require a
    // disclosed successful manual connection before automatic startup.
    startupConfirmed:remember && (value.startupConfirmed === undefined || value.startupConfirmed === true),
  };
}

export function createCameraPreferences(provider = () => globalThis.localStorage) {
  let available = true;
  return {
    get available() { return available; },
    read() {
      try {
        const storage = provider();
        if (!storage) throw Error('Storage unavailable');
        const raw = storage.getItem(KEY);
        return sanitizeCameraPreferences(raw && raw.length <= 2048 ? JSON.parse(raw) : null);
      } catch { available = false; return defaultCameraPreferences(); }
    },
    write(value) {
      try {
        const storage = provider();
        if (!storage) throw Error('Storage unavailable');
        // Anonymous OFF flags preserve an opt-out despite the new ON defaults.
        storage.setItem(KEY, JSON.stringify(sanitizeCameraPreferences(value)));
        available = true;
      } catch { available = false; }
    },
  };
}
