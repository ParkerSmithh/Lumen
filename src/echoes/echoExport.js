import { drawEchoComposition } from './echoComposition.js';

export const ECHO_EXPORT_SIZE = 2048;

/** A dedicated canvas ensures the downloaded image contains artwork only. */
export async function exportEchoPng(records, options = {}) {
  if (!records.length) throw new Error('Create an echo before saving an image.');
  const doc = options.document ?? globalThis.document;
  const urls = options.URL ?? globalThis.URL;
  const draw = options.draw ?? drawEchoComposition;
  let canvas;
  let link;
  let url;
  try {
    canvas = doc.createElement('canvas');
    canvas.width = ECHO_EXPORT_SIZE;
    canvas.height = ECHO_EXPORT_SIZE;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Image canvas unavailable.');
    draw(context, records, ECHO_EXPORT_SIZE, ECHO_EXPORT_SIZE);
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG creation failed.')), 'image/png');
    });
    if (options.isCurrent && !options.isCurrent()) return false;
    url = urls.createObjectURL(blob);
    link = doc.createElement('a');
    link.href = url;
    link.download = 'lumen-echoes.png';
    doc.body.appendChild(link);
    link.click();
    return true;
  } finally {
    link?.remove();
    // Defer successful URL disposal until the browser has consumed the click.
    if (url) {
      const revoke = () => urls.revokeObjectURL(url);
      try { (options.schedule ?? (fn => setTimeout(fn, 1000)))(revoke); } catch { revoke(); }
    }
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }
}

