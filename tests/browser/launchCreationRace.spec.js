import {startArtworkGame} from './startArtworkGame';
import {test,expect} from '@playwright/test';
test('a press and release between rendering frames still creates exactly one ball',async({page})=>{
 await page.addInitScript(()=>{
 const original=HTMLCanvasElement.prototype.getContext;window.launchInstances=0;
 HTMLCanvasElement.prototype.getContext=function(type,...args){const gl=original.call(this,type,...args);if(gl&&type==='webgl2'&&this.closest('.launch-artwork')){const draw=gl.drawElementsInstanced.bind(gl);gl.drawElementsInstanced=(mode,count,type,offset,instances)=>{window.launchInstances=instances;return draw(mode,count,type,offset,instances);};}return gl;};
 });
 await page.goto('/?debugKinetic');await page.getByRole('button',{name:'LAUNCH',exact:true}).click();await page.getByRole('button',{name:'Mouse / touch fallback'}).click();await startArtworkGame(page);
 await expect.poll(()=>page.evaluate(()=>window.launchInstances)).toBe(1);
 await page.evaluate(()=>{for(const type of ['pointerdown','pointermove','pointerup'])window.dispatchEvent(new PointerEvent(type,{clientX:650,clientY:350,bubbles:true,pointerType:'mouse'}));});
 await expect.poll(()=>page.evaluate(()=>window.launchInstances)).toBe(2);await page.waitForTimeout(100);expect(await page.evaluate(()=>window.launchInstances)).toBe(2);
});
