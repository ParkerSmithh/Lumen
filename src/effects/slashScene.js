import { matterPalette } from '../colors';
import { sweptHit } from './slashGeometry';

const shape=[[0,-1.15],[.62,-.38],[.75,.35],[.12,1.12],[-.7,.42],[-.59,-.4]];
const random=(low,high)=>low+Math.random()*(high-low);
const polygon=(ctx,vertices)=>{ctx.beginPath();vertices.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();};

export function createSlashScene(ctx) {
  let palette=matterPalette('#b06aff');
  let width=1,height=1,field={x:0,y:0,width:1,height:1},elapsed=0,nextSpawn=1,spawned=0;
  const objects=[],trails=[],flashes=[],fragments=[];
  const particles=Array.from({length:192},()=>({life:0}));
  let particleSlot=0;
  function spawn() {
    const radius=Math.max(20,Math.min(48,field.width*.09,field.height*.1));
    const first=spawned++===0;
    objects.push({palette,x:field.x+field.width*(first?.5:random(.22,.78)),y:field.y+field.height*(first?.54:.8),
      vx:random(-8,8),vy:first?-12:random(-38,-22),radius,angle:random(-.25,.25),rotation:random(-.22,.22),age:0,life:first?14:12});
  }
  function burst(object,slash) {
    const dx=slash.end.x-slash.start.x,dy=slash.end.y-slash.start.y,length=Math.hypot(dx,dy)||1;
    const direction={x:dx/length,y:dy/length},normal={x:-dy/length,y:dx/length},strength=slash.strength;
    flashes.push({palette:object.palette,x:object.x,y:object.y,radius:object.radius,life:.14});
    for(let i=0;i<shape.length;i++){
      if(fragments.length>=24)break;
      const side=i<3?1:-1;
      const cosine=Math.cos(object.angle),sine=Math.sin(object.angle);
      const vertices=[[0,0],shape[i],shape[(i+1)%shape.length]].map(([x,y])=>[(x*cosine-y*sine)*object.radius,(x*sine+y*cosine)*object.radius]);
      fragments.push({x:object.x,y:object.y,vertices,vx:normal.x*side*(65+strength*120)+direction.x*40+random(-15,15),
        vy:normal.y*side*(65+strength*120)+direction.y*40+random(-15,15),angle:0,rotation:random(-2,2),life:random(.65,1),maxLife:1,color:object.palette.faces[i],palette:object.palette});
    }
    const count=Math.floor(24+strength*20);
    for(let i=0;i<count;i++){
      const angle=random(0,Math.PI*2),speed=random(35,100)+strength*100;
      const p=particles[particleSlot++%particles.length];
      Object.assign(p,{palette:object.palette,x:object.x+random(-8,8),y:object.y+random(-8,8),vx:Math.cos(angle)*speed+direction.x*55,
        vy:Math.sin(angle)*speed+direction.y*55,life:random(.25,.65),size:random(.6,1.8)});
    }
  }
  function cut(slash) {
    trails.push({...slash,palette,life:.2});if(trails.length>12)trails.shift();
    let hits=0;
    for(let i=objects.length-1;i>=0;i--)if(sweptHit(slash,objects[i],Math.max(slash.source==='camera-motion'?24:slash.robust?12:8,objects[i].radius*(slash.source==='camera-motion'?.4:slash.robust?.3:.18)))){burst(objects[i],slash);objects.splice(i,1);hits++;}
    return hits;
  }
  function drawCrystal(object) {
    const appear=Math.min(1,object.age/.45),fade=Math.min(1,(object.life-object.age)/.6);
    ctx.save();ctx.globalAlpha=appear*fade;ctx.translate(object.x,object.y);
    const halo=ctx.createRadialGradient(0,0,0,0,0,object.radius*2.2);
    halo.addColorStop(0,object.palette.color+'35');halo.addColorStop(1,object.palette.color+'00');ctx.fillStyle=halo;
    ctx.fillRect(-object.radius*2.2,-object.radius*2.2,object.radius*4.4,object.radius*4.4);
    ctx.rotate(object.angle);
    const vertices=shape.map(([x,y])=>[x*object.radius,y*object.radius]);
    for(let i=0;i<vertices.length;i++){
      polygon(ctx,[[0,-object.radius*.13],vertices[i],vertices[(i+1)%vertices.length]]);
      const gradient=ctx.createLinearGradient(0,-object.radius,vertices[i][0],object.radius);
      gradient.addColorStop(0,object.palette.faces[i]);gradient.addColorStop(1,object.palette.dark);ctx.fillStyle=gradient;ctx.fill();
      ctx.lineWidth=.7;ctx.strokeStyle=object.palette.bright+'80';ctx.stroke();
    }
    polygon(ctx,vertices);ctx.strokeStyle=object.palette.bright;ctx.shadowColor=object.palette.color;ctx.shadowBlur=14;ctx.lineWidth=1.2;ctx.stroke();
    ctx.shadowBlur=0;ctx.fillStyle=object.palette.bright;ctx.globalAlpha*=.7;ctx.beginPath();ctx.arc(0,-object.radius*.13,2,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function update(dt) {
    dt=Math.min(.04,Math.max(0,dt));elapsed+=dt;
    const cap=elapsed<5?1:elapsed<10?2:4;
    if(elapsed>=nextSpawn&&objects.length<cap){spawn();nextSpawn=elapsed+random(2.5,3.8);}
    for(let i=objects.length-1;i>=0;i--){const o=objects[i];o.age+=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.angle+=o.rotation*dt;if(o.age>o.life||o.y<field.y-o.radius||o.x<-o.radius||o.x>width+o.radius)objects.splice(i,1);}
    for(const list of [trails,flashes,fragments])for(let i=list.length-1;i>=0;i--){const item=list[i];item.life-=dt;if(item.vx!==undefined){item.x+=item.vx*dt;item.y+=item.vy*dt;item.vy+=25*dt;item.angle+=item.rotation*dt;}if(item.life<=0)list.splice(i,1);}
    for(const p of particles)if(p.life>0){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-dt*2);p.vy*=Math.exp(-dt*2);}
  }
  function draw() {
    ctx.clearRect(0,0,width,height);
    for(const object of objects)drawCrystal(object);
    for(const fragment of fragments){ctx.save();ctx.globalAlpha=Math.min(1,fragment.life*2);ctx.translate(fragment.x,fragment.y);ctx.rotate(fragment.angle);polygon(ctx,fragment.vertices);ctx.fillStyle=fragment.color;ctx.fill();ctx.strokeStyle=fragment.palette.bright;ctx.lineWidth=1;ctx.shadowColor=fragment.palette.color;ctx.shadowBlur=8;ctx.stroke();ctx.restore();}
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(const flash of flashes){const glow=ctx.createRadialGradient(flash.x,flash.y,0,flash.x,flash.y,flash.radius*2);glow.addColorStop(0,flash.palette.bright+Math.round(flash.life/.14*204).toString(16).padStart(2,'0'));glow.addColorStop(1,flash.palette.color+'00');ctx.fillStyle=glow;ctx.fillRect(flash.x-flash.radius*2,flash.y-flash.radius*2,flash.radius*4,flash.radius*4);}
    for(const trail of trails){ctx.globalAlpha=Math.pow(trail.life/.2,1.6);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(trail.start.x,trail.start.y);if(trail.path)trail.path.slice(1).forEach(node=>ctx.lineTo(node.center.x,node.center.y));else ctx.lineTo(trail.end.x,trail.end.y);ctx.strokeStyle=trail.palette.color;ctx.shadowColor=trail.palette.color;ctx.shadowBlur=14;ctx.lineWidth=3;ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#f6efff';ctx.lineWidth=1;ctx.stroke();}
    ctx.globalAlpha=1;ctx.shadowBlur=5;ctx.shadowColor='#b576ff';
    for(const p of particles)if(p.life>0){ctx.globalAlpha=Math.min(1,p.life*3);ctx.fillStyle=p.palette.bright;ctx.shadowColor=p.palette.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  return {update,draw,cut,setColor(color){if(color!==palette.color)palette=matterPalette(color);},setSize(w,h,rect){width=w;height=h;field=rect;},dispose(){objects.length=trails.length=flashes.length=fragments.length=0;particles.forEach(p=>p.life=0);}};
}
