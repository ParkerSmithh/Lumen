import {test,expect} from '@playwright/test';
test('shader initialization failure releases partial GPU resources',async({page})=>{
 await page.goto('/');const result=await page.evaluate(async()=>{
  const {createGlowRenderer}=await import('/src/effects/glowRenderer.js');const c=document.createElement('canvas'),gl=c.getContext('webgl');let shaders=0,programs=0;
  const cs=gl.createShader.bind(gl),ds=gl.deleteShader.bind(gl),cp=gl.createProgram.bind(gl),dp=gl.deleteProgram.bind(gl);gl.createShader=(...a)=>{shaders++;return cs(...a);};gl.deleteShader=s=>{shaders--;ds(s);};gl.createProgram=()=>{programs++;return cp();};gl.deleteProgram=p=>{programs--;dp(p);};gl.getShaderParameter=()=>false;
  let failed=false;try{createGlowRenderer(c);}catch{failed=true;}return {failed,shaders,programs};
 });expect(result).toEqual({failed:true,shaders:0,programs:0});
});
test('mounted framebuffer allocation failure recovers to Canvas',async({page})=>{
 await page.addInitScript(()=>{WebGLRenderingContext.prototype.checkFramebufferStatus=function(){return this.FRAMEBUFFER_UNSUPPORTED;};});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.getByRole('button',{name:'Preview light'}).click();await expect.poll(()=>page.evaluate(()=>!!document.querySelector('.glow-artwork canvas')?.getContext('2d'))).toBe(true);expect(errors).toEqual([]);
});
