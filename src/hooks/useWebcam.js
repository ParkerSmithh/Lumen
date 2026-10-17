import {useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {createCameraController} from '../camera/cameraController.js';

export function useWebcam() {
  const videoRef = useRef(null);
  const [controller] = useState(() => createCameraController({getVideo:() => videoRef.current}));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  useEffect(() => { controller.initialize(); return () => controller.dispose(); }, [controller]);
  return {...state, videoRef, start:controller.start, stop:controller.stop,
    selectCamera:controller.selectCamera, setPreferences:controller.setPreferences,
    forget:controller.forget, refreshDevices:controller.refreshDevices};
}
