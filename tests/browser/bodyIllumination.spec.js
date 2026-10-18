import {test,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';

test('body brightness defaults to RADIANT and stays independent across modes',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Preview light'}).click();const body=page.getByRole('group',{name:'Body brightness'}),glow=page.getByRole('group',{name:'Glow intensity'});
 await expect(body.getByRole('button',{name:/RADIANT/})).toHaveAttribute('aria-pressed','true');await body.getByRole('button',{name:'BLAZING',exact:true}).click();await expect(glow.getByRole('button',{name:/NEON/})).toHaveAttribute('aria-pressed','true');
 await glow.getByRole('button',{name:'SOFT',exact:true}).click();await expect(body.getByRole('button',{name:'BLAZING',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'FLOW',exact:true}).click();await page.getByRole('button',{name:'GLOW',exact:true}).click();await page.getByRole('button',{name:'Preview light'}).click();await expect(body.getByRole('button',{name:'BLAZING',exact:true})).toHaveAttribute('aria-pressed','true');
});

for(const fallback of [false,true])test(`interior responds every draw without mask refresh or exposure pumping ${fallback?'Canvas':'WebGL'}`,async({page})=>{
 await page.goto('/');const result=await page.evaluate(async fallback=>{
  const {createGlowRenderer}=await import('/src/effects/glowRenderer.js'),{neonGlowScene}=await import('/tests/fixtures/neonGlowScene.js');const scene=neonGlowScene(),c=document.createElement('canvas');if(fallback)c.getContext('2d');const r=createGlowRenderer(c);r.resize(320,240);const read=document.createElement('canvas');read.width=320;read.height=240;const x=read.getContext('2d');let time=100;
  const sample=opts=>{r.draw({video:scene.camera,mask:scene.mask,color:'#4d9fff',opacity:1,time:time++,...opts});x.drawImage(c,0,0);return Array.from(x.getImageData(160,150,1,1).data).slice(0,3).reduce((a,v)=>a+v,0);};
  scene.camera.getContext('2d').fillStyle='#404040';scene.camera.getContext('2d').fillRect(130,140,60,30);const a=sample({}),updates=r.diagnostics().updates;scene.camera.getContext('2d').fillStyle='#505050';scene.camera.getContext('2d').fillRect(130,140,60,30);const b=sample({}),steps=[];
  for(let i=0;i<8;i++){scene.camera.getContext('2d').fillStyle=`rgb(${80+i},${80+i},${80+i})`;scene.camera.getContext('2d').fillRect(130,140,60,30);steps.push(sample({}));}
  const before=sample({});const v=scene.camera.getContext('2d');v.fillStyle='white';v.fillRect(0,130,80,70);v.fillRect(240,130,80,70);let after;for(let i=0;i<20;i++){time+=200;after=sample({});}
  const natural=sample({bodyBrightness:'NATURAL'}),blazing=sample({bodyBrightness:'BLAZING'}),fade=sample({opacity:0}),quality=sample({quality:'low'}),end=r.diagnostics();r.resetVisual();sample({});r.dispose();return {a,b,steps,before,after,natural,blazing,fade,quality,updates,end,disposed:r.diagnostics()};
 },fallback);
 expect(result.b).toBeGreaterThan(result.a);expect(result.end.updates).toBeGreaterThanOrEqual(result.updates);for(let i=1;i<result.steps.length;i++){expect(result.steps[i]).toBeGreaterThanOrEqual(result.steps[i-1]-2);expect(result.steps[i]-result.steps[i-1]).toBeLessThan(10);}expect(Math.abs(result.before-result.after)).toBeLessThanOrEqual(3);expect(result.blazing).toBeGreaterThan(result.natural);expect(result.fade).toBeLessThan(result.natural);expect(Math.abs(result.quality-result.steps.at(-1))).toBeLessThan(15);
});

for(const [width,height] of [[390,844],[375,667],[844,390],[667,375]])test(`both visual control groups remain reachable at ${width}x${height}`,async({page})=>{
 await page.setViewportSize({width,height});await page.goto('/');await page.getByRole('button',{name:'Preview light'}).click();const settings=await page.locator('.glow-settings').boundingBox(),play=await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).boundingBox(),palette=await page.locator('.color-picker').boundingBox();
 const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;expect(settings.x).toBeGreaterThanOrEqual(0);expect(settings.y).toBeGreaterThanOrEqual(0);expect(settings.x+settings.width).toBeLessThanOrEqual(width);expect(settings.y+settings.height).toBeLessThanOrEqual(height);expect(overlap(settings,play)).toBe(false);expect(overlap(settings,palette)).toBe(false);await page.getByRole('group',{name:'Body brightness'}).getByRole('button',{name:'BLAZING',exact:true}).click();
});

test('GPU detail scale follows camera pixels across output resolutions',async({page})=>{
 await page.goto('/');const error=await page.evaluate(async()=>{
  const {createGlowRenderer}=await import('/src/effects/glowRenderer.js'),{neonGlowScene}=await import('/tests/fixtures/neonGlowScene.js');const scene=neonGlowScene(),source=scene.camera.getContext('2d'),images=[];
  for(let y=110;y<180;y++)for(let x=120;x<200;x++){const v=40+(x*31+y*17)%73;source.fillStyle='rgb('+v+','+v+','+v+')';source.fillRect(x,y,1,1);}
  for(const scale of [1,3]){const c=document.createElement('canvas'),r=createGlowRenderer(c);r.resize(320*scale,240*scale);r.draw({video:scene.camera,mask:scene.mask,color:'#ff354e',opacity:1,time:100});const read=document.createElement('canvas');read.width=320;read.height=240;const x=read.getContext('2d');x.drawImage(c,0,0,320,240);images.push(x.getImageData(140,135,40,30).data);r.dispose();}
  let error=0,n=0;for(let i=0;i<images[0].length;i++)if(i%4!==3){error+=Math.abs(images[0][i]-images[1][i]);n++;}return error/n;
 });expect(error).toBeLessThan(1.5);
});

for(const fallback of [false,true])test(`outside background cannot modulate fully covered inner edge ${fallback?'Canvas':'WebGL'}`,async({page})=>{
 await page.goto('/');const values=await page.evaluate(async fallback=>{const {createGlowRenderer}=await import('/src/effects/glowRenderer.js');const video=document.createElement('canvas');video.width=160;video.height=120;const v=video.getContext('2d'),c=document.createElement('canvas');if(fallback)c.getContext('2d');const r=createGlowRenderer(c);r.resize(160,120);const values=new Float32Array(160*120);for(let y=0;y<120;y++)for(let x=0;x<80;x++)values[y*160+x]=1;const mask={width:160,height:120,values};const read=document.createElement('canvas');read.width=160;read.height=120;const ctx=read.getContext('2d'),out=[];
  for(const background of ['#111111','#ffffff']){v.fillStyle=background;v.fillRect(0,0,160,120);v.fillStyle='#303030';v.fillRect(0,0,80,120);r.draw({video,mask,color:'#ff354e',opacity:1,time:100});ctx.drawImage(c,0,0);out.push(Array.from(ctx.getImageData(82,60,1,1).data).slice(0,3));}r.dispose();return out;
 },fallback);for(let i=0;i<3;i++)expect(Math.abs(values[0][i]-values[1][i])).toBeLessThanOrEqual(2);
});

for(const [width,height] of [[667,375],[844,390]])test(`compact ENERGY RUSH reserves the HUD at ${width}x${height}`,async({page})=>{
 await page.setViewportSize({width,height});await page.goto('/');await page.getByRole('button',{name:'Preview light'}).click();await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();await expect(page.locator('.glow-settings')).toBeHidden();await expect(page.locator('.energy-top')).toBeVisible();
});

for(const fallback of [false,true])test(`near-white subject texture survives highlight rolloff ${fallback?'Canvas':'WebGL'}`,async({page})=>{
 await page.goto('/');const rows=await page.evaluate(async fallback=>{const {createGlowRenderer}=await import('/src/effects/glowRenderer.js'),{neonGlowScene}=await import('/tests/fixtures/neonGlowScene.js');const {colors}=await import('/src/colors.js'),out=[];
  for(const [name,color] of colors)for(const bodyBrightness of ['NATURAL','RADIANT','BLAZING']){const scene=neonGlowScene(),v=scene.camera.getContext('2d');v.fillStyle='#ebebeb';v.fillRect(125,115,70,70);for(let y=115;y<185;y+=5){v.fillStyle='#fafafa';v.fillRect(125,y,70,2);}const c=document.createElement('canvas');if(fallback)c.getContext('2d');const r=createGlowRenderer(c);r.resize(320,240);r.draw({video:scene.camera,mask:scene.mask,color,bodyBrightness,opacity:1,time:100});const read=document.createElement('canvas');read.width=320;read.height=240;const x=read.getContext('2d');x.drawImage(c,0,0);const l=y=>Array.from(x.getImageData(160,y,1,1).data).slice(0,3).reduce((n,v)=>n+v,0)/3;out.push({name,bodyBrightness,contrast:Math.abs(l(120)-l(122)),bright:l(120),dark:l(122)});r.dispose();}return out;
 },fallback);writeFileSync(`.test-artifacts/body-highlights-${fallback?'canvas':'webgl'}.json`,JSON.stringify(rows,null,2));for(const row of rows){expect(row.contrast,JSON.stringify(row)).toBeGreaterThanOrEqual(15*.7);expect(row.bright).toBeLessThan(254);}
});

test('Canvas filter DOM and owned buffers stay bounded across 50 lifecycles',async({page})=>{
 await page.goto('/');const report=await page.evaluate(async()=>{const {createCanvasRenderer}=await import('/src/effects/glowCanvasRenderer.js'),{neonGlowScene}=await import('/tests/fixtures/neonGlowScene.js');const scene=neonGlowScene(),canvas=document.createElement('canvas'),cycles=[];const count=()=>document.querySelectorAll('filter[id^="lumen-body-"]').length,baseline=count();
  for(let i=0;i<50;i++){const r=createCanvasRenderer(canvas);r.resize(640,480);let peak=0;for(let j=0;j<6;j++){r.draw({video:scene.camera,mask:scene.mask,color:j%2?'#ff354e':'#4d9fff',bodyBrightness:['NATURAL','RADIANT','BLAZING'][j%3],time:i*100+j});peak=Math.max(peak,r.diagnostics().targetBytes);}const active=count();r.dispose();r.dispose();cycles.push({peak,active,after:count(),stats:r.diagnostics()});}return {baseline,cycles};
 });writeFileSync('.test-artifacts/body-canvas-lifecycle.json',JSON.stringify(report,null,2));for(const s of report.cycles){expect(s.active).toBe(report.baseline+1);expect(s.after).toBe(report.baseline);expect(s.stats.canvases).toBe(0);expect(s.stats.targetBytes).toBe(0);expect(s.peak).toBeLessThan(3*1024*1024);}expect(new Set(report.cycles.map(s=>s.peak)).size).toBe(1);
});

for(const fallback of [false,true])test(`body illumination brightness/detail and independent levels ${fallback?'Canvas':'WebGL'}`,async({page})=>{
 test.setTimeout(120000);await page.goto('/');
 const rows=await page.evaluate(async fallback=>{
  const {neonGlowScene}=await import('/tests/fixtures/neonGlowScene.js');const {colors}=await import('/src/colors.js');
  const before=await import('/tests/fixtures/deployedNeon/glowRenderer.js'),after=await import('/src/effects/glowRenderer.js');
  const rows=[];document.body.replaceChildren();document.body.style.cssText='margin:0;background:#090711;color:white;font:12px sans-serif';
  for(const scenario of ['dark','shadow','low','light','darkSkin','lightSkin','brightRoom'])for(const [name,color] of colors)for(const intensity of ['SOFT','NEON','SUPERNOVA']){
   const scene=neonGlowScene({light:scenario==='light',bright:scenario==='brightRoom',skin:scenario==='darkSkin'?'#52382c':scenario==='lightSkin'?'#e0baa0':'#987563'});
   const c=scene.camera.getContext('2d');if(scenario==='shadow'||scenario==='low'){c.fillStyle=scenario==='low'?'rgba(0,0,0,.7)':'rgba(0,0,0,.4)';c.fillRect(0,0,320,240);}
   const line=document.createElement('div');line.style.cssText='display:flex;flex-wrap:nowrap;gap:4px';const label=document.createElement('div');label.textContent=`${scenario} ${name} ${intensity} — BEFORE / NATURAL / RADIANT / BLAZING`;if(scenario==='dark'&&intensity==='NEON')document.body.append(label,line);
   const stats=[];
   for(const bodyBrightness of ['BEFORE','NATURAL','RADIANT','BLAZING']){
    const canvas=document.createElement('canvas');if(fallback)canvas.getContext('2d');const r=(bodyBrightness==='BEFORE'?before:after).createGlowRenderer(canvas);r.resize(320,240);
    r.draw({video:scene.camera,mask:scene.mask,color,intensity,bodyBrightness,opacity:1,time:100,bodyAura:0});
    const read=document.createElement('canvas');read.width=320;read.height=240;const ctx=read.getContext('2d');ctx.drawImage(canvas,0,0);const data=ctx.getImageData(0,0,320,240).data;
    const luma=(x,y)=>{const i=(y*320+x)*4;return data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722;};
    let interior=0,n=0,clip=0,exterior=0,faceClip=0;for(let y=120;y<175;y++)for(let x=130;x<190;x++){interior+=luma(x,y);n++;if(Math.max(...data.slice((y*320+x)*4,(y*320+x)*4+3))>=254)clip++;}
    for(let y=45;y<85;y++)for(let x=145;x<175;x++)if(Math.max(...data.slice((y*320+x)*4,(y*320+x)*4+3))>=254)faceClip++;
    for(let y=112;y<180;y++)for(let x=210;x<240;x++)exterior+=luma(x,y);
    const center=Array.from(data.slice((150*320+160)*4,(150*320+160)*4+3));stats.push({bodyBrightness,interior:interior/n,center,chroma:Math.max(...center)-Math.min(...center),faceContrast:luma(159,68)-luma(170,60),textureContrast:Math.abs(luma(160,120)-luma(160,122)),clip:clip/n,faceClip:faceClip/1200,exterior:exterior/(68*30),resources:r.diagnostics()});
    if(scenario==='dark'&&intensity==='NEON')line.append(read);r.dispose();stats.at(-1).disposed=r.diagnostics();
   }
   const src=c.getImageData(0,0,320,240).data;const lum=(x,y)=>{const i=(y*320+319-x)*4;return src[i]*.2126+src[i+1]*.7152+src[i+2]*.0722;};
   rows.push({scenario,name,intensity,sourceFace:lum(159,68)-lum(170,60),sourceTexture:Math.abs(lum(160,120)-lum(160,122)),stats});
  }return rows;
 },fallback);
 writeFileSync(`.test-artifacts/body-visual-${fallback?'canvas':'webgl'}.json`,JSON.stringify(rows,null,2));
 await page.setViewportSize({width:1320,height:1600});await page.screenshot({path:`.test-artifacts/body-comparison-${fallback?'canvas':'webgl'}.png`,fullPage:true});
 for(const row of rows){const [b,n,r,z]=row.stats;const label=`${row.scenario}/${row.name}/${row.intensity}`;
  if(row.scenario!=='light')expect(r.interior/b.interior,label+' brightness').toBeGreaterThanOrEqual(1.5);
  if(row.scenario==='dark')expect(r.chroma,label+' colored illumination').toBeGreaterThanOrEqual(25);
  expect(r.interior,label).toBeGreaterThan(n.interior);expect(z.interior,label).toBeGreaterThan(r.interior);
  for(const s of [n,r,z]){expect(s.clip,label+' clip').toBeLessThanOrEqual(.02);expect(s.faceClip,label+' face clip').toBeLessThanOrEqual(.02);expect(s.faceContrast,label+' face').toBeGreaterThanOrEqual(row.sourceFace*.7);expect(s.textureContrast,label+' texture').toBeGreaterThanOrEqual(row.sourceTexture*.7);expect(Math.abs(s.exterior/b.exterior-1),label+' exterior').toBeLessThanOrEqual(.05);if(!fallback){expect(s.resources.textures).toBe(9);expect(s.resources.framebuffers).toBe(7);expect(s.disposed.textures).toBe(0);}else{expect(s.disposed.canvases).toBe(0);expect(s.disposed.filterNodes).toBe(0);}}
 }
});
