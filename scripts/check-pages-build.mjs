import { chromium } from '@playwright/test';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:4173/Lumen/');
  await page.getByRole('button',{name:'FLOW',exact:true}).click();
  await page.getByRole('button',{name:'Use mouse / touch'}).click();
  await page.mouse.move(250,300);await page.mouse.move(650,420,{steps:15});
  const result=await page.evaluate(async()=>{
    const worker=new Worker(new URL('hand-tracking.worker.js',location.href));
    return await new Promise(resolve=>{
      const timer=setTimeout(()=>{worker.terminate();resolve({error:'timeout'});},30000);
      worker.onerror=event=>{clearTimeout(timer);worker.terminate();resolve({error:event.message});};
      worker.onmessage=({data})=>{
        if(data.type==='ready'){
          const canvas=new OffscreenCanvas(320,240);canvas.getContext('2d').fillRect(0,0,320,240);
          const frame=canvas.transferToImageBitmap();worker.postMessage({type:'frame',frame,timestamp:1},[frame]);
        }else{clearTimeout(timer);worker.terminate();resolve({type:data.type,error:data.message,handDetected:!!data.landmarks});}
      };
      worker.postMessage({type:'init',assetBase:new URL('./',location.href).href});
    });
  });
  if(result.error||result.type!=='hand')throw new Error(JSON.stringify(result));
  await page.getByRole('button',{name:'SLASH',exact:true}).click();
  await page.getByRole('button',{name:'Mouse fallback'}).click();
  await page.waitForTimeout(1300);
  const size=page.viewportSize();
  await page.mouse.move(size.width*.3,size.height*.535);await page.mouse.down();
  for(let x=size.width*.32;x<size.width*.7;x+=size.width*.025){await page.mouse.move(x,size.height*.535);await page.waitForTimeout(16);}
  await page.mouse.up();
  if(!(await page.getByRole('status').innerText()).includes('Cut registered'))throw new Error('Production SLASH collision check failed');
  console.log('Production /Lumen/ path: FLOW renders; hand worker/model/WASM load; SLASH collision registers.');
}finally{await browser.close();}
