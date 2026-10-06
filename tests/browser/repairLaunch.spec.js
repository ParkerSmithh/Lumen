import {test,expect} from '@playwright/test';
test('Ballpit starts empty, activates only requested spheres, retains colors and recycles',async({page})=>{
 await page.goto('/');const result=await page.evaluate(async()=>{
 const {createBallpit}=await import('/src/effects/Ballpit.jsx');const {Color}=await import('/node_modules/three/build/three.module.js');
 const host=document.createElement('div');host.style.cssText='width:640px;height:480px';document.body.append(host);const canvas=document.createElement('canvas');host.append(canvas);
 const instance=createBallpit(canvas,{count:4,maxActive:3,interactiveCreation:true,followCursor:false,colors:[0x663399,0xaaaaee]});
 try{const initial=instance.spheres.activeCount;instance.spawn({x:0,y:0,z:0},'#4d9fff');instance.spawn({x:1,y:1,z:0},'#ff354e');const a=new Color(),b=new Color();instance.spheres.getColorAt(1,a);instance.spheres.getColorAt(2,b);
 const first=a.getHexString(),second=b.getHexString();instance.spawn({x:2,y:0,z:0},'#ffd84a');instance.spawn({x:-1,y:1,z:0},'#5fffa4');instance.spheres.getColorAt(2,b);
 return {initial,active:instance.spheres.activeCount,drawCount:instance.spheres.count,first,second,retained:b.getHexString(),finite:[...instance.spheres.physics.positionData].every(Number.isFinite)};
 }finally{instance.dispose();host.remove();}
 });expect(result.initial).toBe(0);expect(result.active).toBe(3);expect(result.drawCount).toBe(4);expect(result.first).toBe('4d9fff');expect(result.second).toBe('ff354e');expect(result.retained).toBe('ff354e');expect(result.finite).toBe(true);
});
