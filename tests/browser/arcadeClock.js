// Keep simulated input time independent of Playwright/host scheduling latency.
// Native RAF still runs the real renderer; every pointer sample gets a frame.
export async function installArcadeClock(page){
 await page.addInitScript(()=>{
  const nativeNow=performance.now.bind(performance),raf=requestAnimationFrame.bind(window);
  let offset=0,held=null;
  const now=()=>held??nativeNow()+offset;
  performance.now=now;window.requestAnimationFrame=fn=>raf(()=>fn(now()));
  window.arcadeClock={advance(seconds){if(held===null)offset+=seconds*1000;else held+=seconds*1000;},hold(){held=now();},release(){if(held!==null){offset=held-nativeNow();held=null;}}};
  window.advance=window.arcadeAdvance=seconds=>window.arcadeClock.advance(seconds);
 });
}
export async function slashPointerStep(page,x,y,{driverDelay=0}={}){
 if(driverDelay)await page.waitForTimeout(driverDelay);
 await page.evaluate(()=>window.arcadeClock.advance(1/60));
 await page.mouse.move(x,y);
 await page.evaluate(()=>new Promise(requestAnimationFrame));
}
