import {enterArtwork} from './enterArtwork.js';
import {test,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
test('deterministic fixture really separates bright and dark backgrounds',async({page})=>{
 await page.goto('/');await enterArtwork(page);const pixels=await page.evaluate(async()=>{const {neonGlowScene}=await import('/tests/fixtures/neonGlowScene.js');return [false,true].map(bright=>Array.from(neonGlowScene({bright}).camera.getContext('2d').getImageData(10,150,1,1).data));});expect(pixels[0].slice(0,3)).toEqual([16,20,27]);expect(pixels[1].slice(0,3)).toEqual([196,200,204]);
});
for(const fallback of [false,true])test(`OLD versus TRUE NEON six colors and three presets (${fallback?'Canvas':'WebGL'})`,async({page})=>{
 await page.goto('/');await enterArtwork(page);const report=await page.evaluate(async fallback=>{
  const {neonGlowScene}=await import('/tests/fixtures/neonGlowScene.js');const {colors}=await import('/src/colors.js');const legacy=await import('/tests/fixtures/legacyGlowRenderer.js'),neon=await import('/src/effects/glowRenderer.js');document.body.replaceChildren();document.body.style.cssText='margin:0;background:#08090d;color:white;font:14px sans-serif';const rows=[];
  for(const [name,color] of colors)for(const preset of ['SOFT','NEON','SUPERNOVA']){
   const line=document.createElement('div');line.style.cssText='display:flex;gap:8px;align-items:center';const label=document.createElement('span');label.textContent=`${name} ${preset}`;label.style.width='150px';line.append(label);document.body.append(line);
   const scene=neonGlowScene();const stats=[];
   for(const [tag,mod] of [['OLD',legacy],['TRUE NEON',neon]]){
    const canvas=document.createElement('canvas');if(fallback)canvas.getContext('2d');const r=mod.createGlowRenderer(canvas);r.resize(320,240);r.draw({video:scene.camera,mask:scene.mask,color,intensity:preset,opacity:1,time:100});const read=document.createElement('canvas');read.width=320;read.height=240;read.getContext('2d').drawImage(canvas,0,0);const data=read.getContext('2d').getImageData(0,0,320,240).data;
    const pix=(x,y)=>Array.from(data.slice((y*320+x)*4,(y*320+x)*4+3)),peak=(x,y)=>Math.max(...pix(x,y));
    let exterior=0,count=0,clipped=0,interior=0;for(let y=112;y<180;y++)for(let x=210;x<240;x++){exterior+=peak(x,y);count++;}for(let y=120;y<175;y++)for(let x=130;x<190;x++){interior++;if(peak(x,y)>=254)clipped++;}
    const luma=(rgb)=>rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;const light=(x,y)=>luma(pix(x,y));const source=scene.camera.getContext('2d'),sourcePeak=(x,y)=>luma(source.getImageData(319-x,y,1,1).data);
    stats.push({tag,exterior:exterior/count,faceContrast:light(159,68)-light(170,60),sourceFaceContrast:sourcePeak(159,68)-sourcePeak(170,60),textureContrast:light(160,120)-light(160,122),sourceTextureContrast:sourcePeak(160,120)-sourcePeak(160,122),clippedFraction:clipped/interior});const box=document.createElement('div');box.append(tag,read);line.append(box);r.dispose();
   }rows.push({name,preset,stats});
  }return rows;
 },fallback);
 await page.setViewportSize({width:850,height:4800});await page.screenshot({path:`.test-artifacts/neon-comparison-${fallback?'canvas':'webgl'}.png`,fullPage:true});writeFileSync(`.test-artifacts/neon-visual-${fallback?'canvas':'webgl'}.json`,JSON.stringify(report,null,2));
 expect(report).toHaveLength(18);for(const row of report){const s=row.stats[1];expect(s.clippedFraction).toBeLessThanOrEqual(.02);expect(s.faceContrast).toBeGreaterThanOrEqual(s.sourceFaceContrast*.7);expect(Math.abs(s.textureContrast)).toBeGreaterThanOrEqual(Math.abs(s.sourceTextureContrast)*.7);if(row.preset==='NEON')expect(s.exterior).toBeGreaterThan(row.stats[0].exterior*2);}
});


