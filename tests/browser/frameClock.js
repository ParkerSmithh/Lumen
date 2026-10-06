// Gesture fixtures describe render/landmark cadence, not a software GPU's wall time.
// This keeps timestamps coherent without changing production tracking or timeouts.
export async function installFrameClock(page) {
  await page.addInitScript(() => {
    const nativeRAF = requestAnimationFrame.bind(window);
    let frameTime = performance.now(), lastFrame = null;
    performance.now = () => frameTime;
    window.requestAnimationFrame = callback => nativeRAF(time => {
      if (time !== lastFrame) { frameTime += 1000 / 60; lastFrame = time; }
      callback(frameTime);
    });
  });
}
