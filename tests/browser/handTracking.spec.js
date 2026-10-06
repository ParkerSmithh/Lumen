import { test,expect } from '@playwright/test';

async function syntheticCamera(page) {
  await page.addInitScript(()=>{
    window.cameraCalls=0;window.liveWorkers=0;window.glResources=0;
    const NativeWorker=window.Worker;
    window.Worker=class extends NativeWorker{
      constructor(...args){super(...args);window.liveWorkers++;this.counted=true;}
      terminate(){if(this.counted){window.liveWorkers--;this.counted=false;}return super.terminate();}
    };
    const original=HTMLCanvasElement.prototype.getContext,seen=new WeakSet();
    HTMLCanvasElement.prototype.getContext=function(type,...args){
      const ctx=original.call(this,type,...args);
      if(ctx&&type.includes('webgl')&&!seen.has(ctx)){
        seen.add(ctx);
        for(const kind of ['Texture','Framebuffer','Program','Shader','Buffer']){
          const objects=new Set(),create=ctx['create'+kind].bind(ctx),remove=ctx['delete'+kind].bind(ctx);
          ctx['create'+kind]=(...params)=>{const resource=create(...params);if(resource){objects.add(resource);window.glResources++;}return resource;};
          ctx['delete'+kind]=resource=>{if(objects.delete(resource))window.glResources--;remove(resource);};
        }
      }
      return ctx;
    };
    navigator.mediaDevices.getUserMedia=async()=>{
      window.cameraCalls++;
      const canvas=document.createElement('canvas');canvas.width=320;canvas.height=240;
      const ctx=canvas.getContext('2d');ctx.fillStyle='black';ctx.fillRect(0,0,320,240);
      const stream=canvas.captureStream(20);window.cameraTrack=stream.getVideoTracks()[0];
      return stream;
    };
  });
}

test('hand model infers no hand; mode switching keeps one camera and releases resources',async({page})=>{
  await syntheticCamera(page);
  await page.goto('/');await page.getByRole('button',{name:'Enter with camera',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Step into view');
  const glowResources=await page.evaluate(()=>window.glResources);
  for(let i=0;i<3;i++){
    await page.getByRole('button',{name:'FLOW',exact:true}).click();
    await expect(page.getByRole('status')).toContainText('Raise your index finger');
    await expect.poll(()=>page.evaluate(()=>window.liveWorkers)).toBe(1);
    await page.getByRole('button',{name:'GLOW',exact:true}).click();
    await expect(page.getByRole('status')).toContainText('Step into view');
    await expect.poll(()=>page.evaluate(()=>window.glResources)).toBe(glowResources);
  }
  expect(await page.evaluate(()=>window.cameraCalls)).toBe(1);
  await page.getByRole('button',{name:'Stop camera'}).click();
  await expect.poll(()=>page.evaluate(()=>window.cameraTrack.readyState)).toBe('ended');
  await expect.poll(()=>page.evaluate(()=>window.liveWorkers)).toBe(0);
});

test('missing hand model offers retry and GLOW still runs',async({page})=>{
  await syntheticCamera(page);
  await page.route('**/models/hand_landmarker.task',route=>route.fulfill({status:404,body:'Missing model'}));
  await page.goto('/');await page.getByRole('button',{name:'FLOW',exact:true}).click();
  await page.getByRole('button',{name:'Enter with camera',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Hand tracking is unavailable');
  await expect(page.getByRole('button',{name:'Retry hand tracking'})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.liveWorkers)).toBe(0);
  await page.getByRole('button',{name:'GLOW',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Step into view');
  expect(await page.evaluate(()=>window.cameraCalls)).toBe(1);
  await page.getByRole('button',{name:'Stop camera'}).click();
});
