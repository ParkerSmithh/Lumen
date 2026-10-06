export function fitContain(sw, sh, width, height) {
  const aspect = sw / sh;
  const fittedWidth = width / height > aspect ? height * aspect : width;
  const fittedHeight = width / height > aspect ? height : width / aspect;
  return { x: (width - fittedWidth) / 2, y: (height - fittedHeight) / 2, width: fittedWidth, height: fittedHeight };
}
export function mapPoint(x, y, rect, mirror = true) {
  return { x: rect.x + (mirror ? 1 - x : x) * rect.width, y: rect.y + y * rect.height };
}
export function toMaskRGBA(data) {
  const rgba = new Uint8ClampedArray(data.length * 4);
  for (let i = 0; i < data.length; i++) {
    rgba.set([255, 255, 255, Math.max(0, Math.min(1, (data[i] - .25) / .5)) * 255], i * 4);
  }
  return rgba;
}
export function cameraErrorMessage(error) {
  const messages = {
    NotAllowedError: 'Camera permission was denied. Allow camera access in your browser, then try again.',
    NotFoundError: 'No camera was found. Connect a webcam, then try again.',
    NotReadableError: 'The camera may be in use by another app. Close it, then try again.',
    SecurityError: 'Camera access requires localhost or HTTPS.',
    OverconstrainedError: 'This camera cannot provide the requested video. Try another camera.',
  };
  return messages[error?.name] || 'The camera could not start. Check its connection and try again.';
}
