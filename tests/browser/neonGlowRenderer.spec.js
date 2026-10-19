import {enterArtwork} from './enterArtwork.js';
import {test,expect} from '@playwright/test';
for(const fallback of [false,true])test(`neon cache, fade, quality and lifecycle (${fallback?'Canvas':'WebGL'})`,async({page})=>{
 await page.goto('/');await enterArtwork(page);const result=await page.evaluate(async fallback=>{
  const {createGlowRenderer}=await import('/src/effects/glowRenderer.js');const {neonGlowScene}=await import('/tests/fixtures/neonGlowScene.js');const scene=neonGlowScene();const c=document.createElement('canvas');if(fallback)c.getContext('2d');const r=createGlowRenderer(c);r.resize(320,240);
  const read=document.createElement('canvas');read.width=320;read.height=240;const x=read.getContext('2d');
  const sample=opts=>{r.draw({video:scene.camera,mask:scene.mask,color:'#ff354e',opacity:1,time:100,...opts});x.drawImage(c,0,0);return [...x.getImageData(204,150,1,1).data];};
  const red=sample({}),before=r.diagnostics(),blue=sample({color:'#4d9fff'}),faded=sample({opacity:0}),soft=sample({intensity:'SOFT'}),nova=sample({intensity:'SUPERNOVA'}),low=sample({quality:'low'}),after=r.diagnostics();
  r.resize(240,320);sample({});r.resize(320,240);sample({});const allocated=r.diagnostics();for(let i=0;i<50;i++){r.resize(320,240);sample({});}const plateau=r.diagnostics();r.dispose();r.dispose();const disposed=r.diagnostics();return {red,blue,faded,soft,nova,low,before,after,allocated,plateau,disposed};
 },fallback);
 expect(result.red[0]).toBeGreaterThan(200);expect(result.red[0]).toBeGreaterThan(result.red[2]);expect(result.blue[2]).toBeGreaterThan(result.blue[0]);expect(result.faded[0]).toBeLessThan(result.red[0]);expect(result.nova[0]).toBeGreaterThanOrEqual(result.soft[0]);expect(result.low[0]).toBeGreaterThanOrEqual(result.red[0]-13);
 expect(result.plateau.targetBytes).toBe(result.allocated.targetBytes);expect(result.disposed.targetBytes).toBe(0);expect(result.disposed.visualBytes).toBe(0);
 if(!fallback){expect(result.before.textures).toBe(9);expect(result.before.framebuffers).toBe(7);expect(result.plateau.textureAllocations).toBe(9);expect(result.disposed.textures).toBe(0);}
});
test('recommended intensity controls persist and coexist with instructions',async({page})=>{
 await page.goto('/');await enterArtwork(page);await page.getByRole('button',{name:'Preview light'}).click();const controls=page.getByRole('group',{name:'Glow intensity'});await expect(controls.getByRole('button',{name:/NEON/})).toHaveAttribute('aria-pressed','true');
 await controls.getByRole('button',{name:'SUPERNOVA',exact:true}).click();await page.getByRole('button',{name:'FLOW',exact:true}).click();await page.getByRole('button',{name:'GLOW',exact:true}).click();await page.getByRole('button',{name:'Preview light'}).click();await expect(page.getByRole('button',{name:'SUPERNOVA',exact:true})).toHaveAttribute('aria-pressed','true');
});
for(const [width,height] of [[390,844],[375,667],[390,736],[844,390],[667,375]])test(`glow intensity stays clear of play and palette at ${width}x${height}`,async({page})=>{
 await page.setViewportSize({width,height});await page.goto('/');await enterArtwork(page);await page.getByRole('button',{name:'Preview light'}).click();
 const a=await page.locator('.glow-intensity').boundingBox(),b=await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).boundingBox(),palette=await page.locator('.color-picker').boundingBox();
 const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;expect(overlaps(a,b)).toBe(false);expect(overlaps(a,palette)).toBe(false);await page.screenshot({path:`.test-artifacts/neon-controls-${width}x${height}.png`});
});
for(const fallback of [false,true])test(`difficult masks, preview loss and reduced motion (${fallback?'Canvas':'WebGL'})`,async({page})=>{
 await page.goto('/');await enterArtwork(page);const result=await page.evaluate(async fallback=>{
  const {createGlowRenderer}=await import('/src/effects/glowRenderer.js'),{neonGlowScene}=await import('/tests/fixtures/neonGlowScene.js');const c=document.createElement('canvas');if(fallback)c.getContext('2d');const r=createGlowRenderer(c);r.resize(320,240);const read=document.createElement('canvas');read.width=320;read.height=240;const ctx=read.getContext('2d');
  const snapshot=opts=>{r.draw({color:'#ff354e',opacity:1,time:100,reducedMotion:true,...opts});ctx.drawImage(c,0,0);return [...ctx.getImageData(0,0,320,240).data];};
  const scene=neonGlowScene(),a=snapshot({mask:scene.mask}),b=snapshot({mask:scene.mask,time:2000}),fade=snapshot({mask:scene.mask,opacity:0}),lost=snapshot({mask:null});
  const max=arr=>arr.reduce((m,v,i)=>i%4===3?m:Math.max(m,v),0);
  document.body.replaceChildren();document.body.style.cssText='background:#090b10;color:white;font:14px sans-serif;margin:0';
  const cases=[];let time=3000;for(const options of [{},{bright:true},{light:true},{arms:false},{partial:true},{offset:50},{offset:-50,noise:.2}]){
   const s=neonGlowScene(options),pixels=snapshot({video:s.camera,mask:{...s.mask,timestamp:time},time}),offset=options.offset||0;
   const luma=(p)=>p[0]*.2126+p[1]*.7152+p[2]*.0722,at=(x,y)=>pixels.slice((y*320+x)*4,(y*320+x)*4+3),src=(x,y)=>s.camera.getContext('2d').getImageData(319-x,y,1,1).data;
   const detail=luma(at(159-offset,68))-luma(at(170-offset,60)),sourceDetail=luma(src(159-offset,68))-luma(src(170-offset,60));
   const row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:10px;height:260px';const label=document.createElement('span');label.style.width='150px';label.textContent=JSON.stringify(options);const copy=document.createElement('canvas');copy.width=320;copy.height=240;copy.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(pixels),320,240),0,0);row.append(label,s.camera,copy);document.body.append(row);
   time+=66;cases.push({detail,sourceDetail,rim:Math.max(...at(115-offset,150)),...r.diagnostics()});
  }
  snapshot({mask:{width:2,height:2,values:new Float32Array([NaN,Infinity,-1,2])},time});r.resetVisual();snapshot({mask:scene.mask,time:time+66});r.dispose();return {same:JSON.stringify(a)===JSON.stringify(b),maxFade:max(fade),maxLost:max(lost),cases};
 },fallback);await page.setViewportSize({width:850,height:1900});await page.screenshot({path:`.test-artifacts/neon-difficult-${fallback?'canvas':'webgl'}.png`,fullPage:true});expect(result.same).toBe(true);expect(result.maxFade).toBeLessThan(8);expect(result.maxLost).toBeLessThan(8);expect(result.cases).toHaveLength(7);for(const c of result.cases){expect(c.detail).toBeGreaterThan(c.sourceDetail*.7);expect(c.rim).toBeGreaterThan(200);}
});
test('mounted context loss recovers through Canvas without another renderer loop',async({page})=>{
 await page.goto('/');await enterArtwork(page);await page.getByRole('button',{name:'Preview light'}).click();const before=await page.locator('.glow-artwork canvas').count();
 const supported=await page.evaluate(()=>{const c=document.querySelector('.glow-artwork canvas'),gl=c.getContext('webgl'),ext=gl?.getExtension('WEBGL_lose_context');if(!ext)return false;ext.loseContext();return true;});
 test.skip(!supported,'Context loss extension unavailable');await expect.poll(()=>page.evaluate(()=>!!document.querySelector('.glow-artwork canvas').getContext('2d'))).toBe(true);await expect(page.locator('.glow-artwork canvas')).toHaveCount(before);
});
test('Canvas uncertain confidence does not become a hot solid interior',async({page})=>{
 await page.goto('/');await enterArtwork(page);const red=await page.evaluate(async()=>{const {createGlowRenderer}=await import('/src/effects/glowRenderer.js');const video=document.createElement('canvas');video.width=video.height=64;const v=video.getContext('2d');v.fillStyle='#606060';v.fillRect(0,0,64,64);const c=document.createElement('canvas');c.getContext('2d');const r=createGlowRenderer(c);r.resize(64,64);r.draw({video,mask:{width:5,height:5,values:new Float32Array(25).fill(.5)},color:'#ff354e',intensity:'SUPERNOVA',opacity:1,time:100});const value=c.getContext('2d').getImageData(32,32,1,1).data[0];r.dispose();return value;});expect(red).toBeLessThan(220);
});
