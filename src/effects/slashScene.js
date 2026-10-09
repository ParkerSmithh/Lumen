import { matterPalette } from '../colors.js';
import { sweptHit } from './slashGeometry.js';
import { selectCrystalType } from '../game/slashArcade.js';

const shape=[[0,-1.15],[.62,-.38],[.75,.35],[.12,1.12],[-.7,.42],[-.59,-.4]];
const random=(low,high)=>low+Math.random()*(high-low);
const polygon=(ctx,vertices)=>{ctx.beginPath();vertices.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();};

export const slashObjectTypes = Object.freeze(Object.fromEntries(
  [['normal',100],['bonus',300],['splitting',100],['child',100]].map(([type,points])=>[type,Object.freeze({value:1,points})])
));

export function createSlashScene(ctx, { onLifecycle, drawAtmosphere, arcade=false, chaos=false, random:rng=Math.random, reducedMotion=false } = {}) {
  let palette=matterPalette('#b06aff');
  let width=1,height=1,field={x:0,y:0,width:1,height:1},nextSpawn=1,spawned=0,nextId=1,playing=false,ended=false;
  const objects=[],trails=[],flashes=[],fragments=[];
  const particles=Array.from({length:chaos?320:192},()=>({life:0}));
  let opportunity=0;
  let particleSlot=0,particleLimit=chaos?256:192,fragmentLimit=chaos?32:24,motionReduced=reducedMotion,storm=false,surge=false;
  let activeElapsed=0,comboIntensity=0,overload=false;
  const reserved=()=>objects.filter(object=>object.type==='splitting').length;
  const rand=(low,high)=>low+rng()*(high-low);
  function spawn(cap) {
    if(!chaos){const type=arcade?selectCrystalType({elapsed:activeElapsed,random:rng,hasSplitter:reserved()>0,capacityAvailable:cap-objects.length-reserved()}):'normal';const radius=Math.max(20,Math.min(48,field.width*.09,field.height*.1))*(type==='splitting'?1.15:1);const first=spawned++===0;objects.push({id:nextId++,type,...slashObjectTypes[type],palette,x:field.x+field.width*(first?.5:rand(.22,.78)),y:field.y+field.height*(first?.54:.8),vx:rand(-8,8),vy:first?-12:rand(-38,-22),radius,angle:rand(-.25,.25),rotation:rand(-.22,.22),age:0,life:first?14:12});return;}
    const free=cap-objects.length-reserved();if(free<1)return;
    const first=spawned===0,lane=opportunity++%4;
    const formation=chaos&&activeElapsed>=15?Math.floor(rng()*3): -1;
    const wanted=formation===0?3:formation===1?4:formation===2?2:1;
    const radius=Math.max(20,Math.min(48,field.width*.09,field.height*.1));
    // Sample each proposed crystal exactly once; never reroll a failed special.
    let hasSplitter=reserved()>0,remaining=free;
    const proposals=[];
    for(let i=0;i<Math.min(wanted,free);i++){
      const type=arcade?selectCrystalType({elapsed:activeElapsed,random:rng,hasSplitter,capacityAvailable:remaining}):'normal';
      const cost=type==='splitting'?2:1;if(cost>remaining)break;remaining-=cost;hasSplitter ||= type==='splitting';
      const r=radius*(type==='splitting'?1.15:1),gap=radius*2.5+14;
      const offset=(i-(Math.min(wanted,free)-1)/2)*gap;
      let x=field.x+field.width*.5+offset,y=field.y+field.height*(formation<0&&first?.54:.24+lane*.18);
      if(formation===1)y-=Math.cos((i-(wanted-1)/2)*.7)*radius*1.8;
      if(formation===2){x=field.x+field.width*(i===0?.18:.82);y=field.y+field.height*(.24+lane*.18);}
      if(formation<0&&!first)x=field.x+field.width*(lane%2?.25:.75);
      proposals.push({type,radius:r,x,y,vx:formation===2?(i===0?18:-18):rand(-8,8),vy:first?-12:rand(-38,-22),angle:rand(-.25,.25),rotation:rand(-.22,.22)});
    }
    const valid=p=>p.x-p.radius>=field.x&&p.x+p.radius<=field.x+field.width&&p.y-p.radius>=field.y&&p.y+p.radius<=field.y+field.height;
    const spaced=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)>=a.radius+b.radius+12;
    const accepted=[];
    for(const proposal of proposals){if(valid(proposal)&&objects.every(o=>spaced(proposal,o))&&accepted.every(o=>spaced(proposal,o)))accepted.push(proposal);}
    // Smaller valid formations retain sampled types; a blocked field skips its due opportunity.
    for(const p of accepted){objects.push({id:nextId++, ...p,...slashObjectTypes[p.type],palette,age:0,life:first?14:12});spawned++;}
  }
  function children(parent) {
    const radius=Math.max(20,parent.radius*.65),offset=radius+6;
    let positions=null;
    if(chaos){
      const candidates=[],inside=p=>p.x-radius>=field.x&&p.x+radius<=field.x+field.width&&p.y-radius>=field.y&&p.y+radius<=field.y+field.height;
      const clear=p=>inside(p)&&objects.every(o=>Math.hypot(p.x-o.x,p.y-o.y)>=radius+o.radius+12);
      // Prefer a nearby pair. Alternate orientations keep children clear of neighbours.
      for(const angle of [0,Math.PI/2,Math.PI/4,-Math.PI/4]){
        const pair=[-1,1].map(side=>({x:parent.x+Math.cos(angle)*side*offset,y:parent.y+Math.sin(angle)*side*offset}));
        if(pair.every(clear)){positions=pair;break;}
      }
      if(!positions){
        // Bounded deterministic placement search; no random retries or altered colliders.
        const left=field.x+radius,right=field.x+field.width-radius,top=field.y+radius,bottom=field.y+field.height-radius;
        if(right>=left&&bottom>=top)for(let row=0;row<9;row++)for(let col=0;col<11;col++){
          const point={x:left+(right-left)*col/10,y:top+(bottom-top)*row/8};if(clear(point))candidates.push(point);
        }
        candidates.sort((a,b)=>Math.hypot(a.x-parent.x,a.y-parent.y)-Math.hypot(b.x-parent.x,b.y-parent.y));
        outer:for(let i=0;i<candidates.length;i++)for(let j=i+1;j<candidates.length;j++)if(Math.hypot(candidates[i].x-candidates[j].x,candidates[i].y-candidates[j].y)>=radius*2+12){positions=[candidates[i],candidates[j]];break outer;}
      }
    }
    for(const [index,side] of [-1,1].entries())objects.push({id:nextId++,type:'child',...slashObjectTypes.child,palette:parent.palette,
      x:positions?.[index].x??parent.x+side*(chaos?offset:radius*.7),y:positions?.[index].y??parent.y,vx:reducedMotion?0:side*18,vy:reducedMotion?0:-9,
      radius,angle:side*.15,rotation:reducedMotion?0:side*.12,age:0,life:6,bornAt:activeElapsed});
    // On impossibly small fields preserve both original scoring objects and clamp as before.
    objects.slice(-2).forEach(boundChild);
  }
  function boundChild(object) {
    const left=field.x+object.radius,right=Math.max(left,field.x+field.width-object.radius);
    const top=field.y+object.radius,bottom=Math.max(top,field.y+field.height-object.radius);
    if(object.x<left||object.x>right)object.vx*=-1;
    if(object.y<top||object.y>bottom)object.vy*=-1;
    object.x=Math.max(left,Math.min(right,object.x));object.y=Math.max(top,Math.min(bottom,object.y));
  }
  function burst(object,slash) {
    const dx=slash.end.x-slash.start.x,dy=slash.end.y-slash.start.y,length=Math.hypot(dx,dy)||1;
    const direction={x:dx/length,y:dy/length},normal={x:-dy/length,y:dx/length},strength=slash.strength;
    if(flashes.length>=12)flashes.shift();flashes.push({palette:object.palette,x:object.x,y:object.y,radius:object.radius,life:.14});
    for(let i=0;i<shape.length;i++){
      if(fragments.length>=fragmentLimit)break;
      const side=i<3?1:-1;
      const cosine=Math.cos(object.angle),sine=Math.sin(object.angle);
      const vertices=[[0,0],shape[i],shape[(i+1)%shape.length]].map(([x,y])=>[(x*cosine-y*sine)*object.radius,(x*sine+y*cosine)*object.radius]);
      fragments.push({x:object.x,y:object.y,vertices,vx:normal.x*side*(65+strength*120)+direction.x*40+random(-15,15),
        vy:normal.y*side*(65+strength*120)+direction.y*40+random(-15,15),angle:0,rotation:random(-2,2),life:random(.65,1),maxLife:1,color:object.palette.faces[i],palette:object.palette});
    }
    if(motionReduced)for(const f of fragments){f.vx=f.vy=f.rotation=0;}
    const level=Math.max(comboIntensity,overload?1:0,storm?1:0,surge?1:0);
    const count=motionReduced?6:Math.floor((24+strength*20+level*16)*Math.min(1.5,particleLimit/192));
    for(let i=0;i<count;i++){
      const angle=random(0,Math.PI*2),speed=random(35,100)+strength*100;
      const p=particles[particleSlot++%particleLimit];
      Object.assign(p,{palette:object.palette,x:object.x+random(-8,8),y:object.y+random(-8,8),vx:Math.cos(angle)*speed+direction.x*55,
        vy:Math.sin(angle)*speed+direction.y*55,life:random(.25,.65),size:random(.6,1.8)});if(motionReduced)p.vx=p.vy=0;
    }
  }
  function cut(slash) {
    if(!playing)return 0;
    trails.push({...slash,palette,life:.2});if(trails.length>12)trails.shift();
    let hits=0;
    const splitParents=[];
    for(let i=objects.length-1;i>=0;i--)if(sweptHit(slash,objects[i],Math.max(slash.source==='camera-motion'?24:slash.robust?12:8,objects[i].radius*(slash.source==='camera-motion'?.4:slash.robust?.3:.18)))){
      const object=objects[i];burst(object,slash);objects.splice(i,1);hits++;
      if(object.type==='splitting')splitParents.push(object);
      const cosine=Math.cos(object.angle),sine=Math.sin(object.angle);const echoPoints=shape.map(([x,y])=>({x:(object.x+(x*cosine-y*sine)*object.radius)/width,y:(object.y+(x*sine+y*cosine)*object.radius)/height}));
      onLifecycle?.({kind:'destroyed',id:object.id,type:object.type,value:object.value,points:object.points,echoPoints,aspect:width/height,color:object.palette.color,strength:slash.strength});
    }
    splitParents.forEach(children);
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
    // Shape cues remain recognizable without relying on hue.
    if(object.type==='bonus'){
      const crown=Array.from({length:12},(_,i)=>{const angle=i*Math.PI/6,radius=object.radius*(i%2?1.08:1.35);return [Math.sin(angle)*radius,Math.cos(angle)*radius];});
      polygon(ctx,crown);ctx.lineWidth=1.8;ctx.shadowBlur=20;ctx.stroke();
      polygon(ctx,[[0,-object.radius*.52],[object.radius*.32,0],[0,object.radius*.52],[-object.radius*.32,0]]);ctx.stroke();
    }
    if(object.type==='splitting'){
      for(const side of [-1,1]){polygon(ctx,[[side*object.radius*.08,-object.radius*.75],[side*object.radius*.7,-object.radius*.18],[side*object.radius*.5,object.radius*.65],[side*object.radius*.08,object.radius*.8]]);ctx.lineWidth=1.7;ctx.stroke();}
      ctx.beginPath();ctx.moveTo(0,-object.radius*.9);ctx.lineTo(-object.radius*.1,-object.radius*.2);ctx.lineTo(object.radius*.1,object.radius*.25);ctx.lineTo(0,object.radius*.9);ctx.lineWidth=2.4;ctx.stroke();
    }
    ctx.shadowBlur=0;ctx.fillStyle=object.palette.bright;ctx.globalAlpha*=.7;ctx.beginPath();ctx.arc(0,-object.radius*.13,2,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function update(dt, game) {
    playing=game?.phase==='playing'&&!game.paused;
    if(game?.paused)return;
    const elapsedStep=Number.isFinite(dt)?Math.max(0,dt):0;
    if(playing&&Number.isFinite(game.elapsed))activeElapsed=game.elapsed;
    dt=Math.min(.04,elapsedStep);
    if(game?.phase==='results'&&!ended){ended=true;objects.forEach(o=>{o.life=Math.min(o.life,o.age+.6);});}
    // One due opportunity per frame, including when full: never queue catch-up births.
    if(playing&&game.elapsed>=nextSpawn){const cap=Math.min(chaos?12:8,game.cap);if(objects.length+reserved()<cap)spawn(cap);nextSpawn=game.elapsed+game.interval;}
    for(let i=objects.length-1;i>=0;i--){const o=objects[i];o.age=o.type==='child'&&playing?activeElapsed-o.bornAt:o.age+dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.angle+=o.rotation*dt;if(o.type==='child')boundChild(o);if((o.type==='child'?o.age>=o.life:o.age>o.life)||o.y<field.y-o.radius||o.x<-o.radius||o.x>width+o.radius){
      objects.splice(i,1);if(!ended)onLifecycle?.({kind:'expired',id:o.id,type:o.type,value:o.value,points:o.points});
    }}
    for(const list of [trails,flashes,fragments])for(let i=list.length-1;i>=0;i--){const item=list[i];item.life-=dt;if(item.vx!==undefined){item.x+=item.vx*dt;item.y+=item.vy*dt;if(!motionReduced)item.vy+=25*dt;item.angle+=item.rotation*dt;}if(item.life<=0)list.splice(i,1);}
    for(const p of particles)if(p.life>0){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-dt*2);p.vy*=Math.exp(-dt*2);}
  }
  function draw() {
    ctx.clearRect(0,0,width,height);try{drawAtmosphere?.(ctx,width,height);}catch{}
    if(overload){ctx.save();ctx.globalAlpha=.045;ctx.fillStyle=palette.color;ctx.fillRect(field.x,field.y,field.width,field.height);ctx.restore();}
    for(const object of objects)drawCrystal(object);
    for(const fragment of fragments){ctx.save();ctx.globalAlpha=Math.min(1,fragment.life*2);ctx.translate(fragment.x,fragment.y);ctx.rotate(fragment.angle);polygon(ctx,fragment.vertices);ctx.fillStyle=fragment.color;ctx.fill();ctx.strokeStyle=fragment.palette.bright;ctx.lineWidth=1;ctx.shadowColor=fragment.palette.color;ctx.shadowBlur=8;ctx.stroke();ctx.restore();}
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(const flash of flashes){const glow=ctx.createRadialGradient(flash.x,flash.y,0,flash.x,flash.y,flash.radius*2);glow.addColorStop(0,flash.palette.bright+Math.round(flash.life/.14*204).toString(16).padStart(2,'0'));glow.addColorStop(1,flash.palette.color+'00');ctx.fillStyle=glow;ctx.fillRect(flash.x-flash.radius*2,flash.y-flash.radius*2,flash.radius*4,flash.radius*4);}
    for(const trail of trails){ctx.globalAlpha=Math.pow(trail.life/.2,1.6);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(trail.start.x,trail.start.y);if(trail.path)trail.path.slice(1).forEach(node=>ctx.lineTo(node.center.x,node.center.y));else ctx.lineTo(trail.end.x,trail.end.y);ctx.strokeStyle=trail.palette.color;ctx.shadowColor=trail.palette.color;ctx.shadowBlur=14;ctx.lineWidth=3+(reducedMotion?0:comboIntensity);ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#f6efff';ctx.lineWidth=1;ctx.stroke();}
    ctx.globalAlpha=1;ctx.shadowBlur=5;ctx.shadowColor='#b576ff';
    for(const p of particles)if(p.life>0){ctx.globalAlpha=Math.min(1,p.life*3);ctx.fillStyle=p.palette.bright;ctx.shadowColor=p.palette.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  function reset(){objects.length=trails.length=flashes.length=fragments.length=0;particles.forEach(p=>p.life=0);particleSlot=0;opportunity=0;nextSpawn=1;spawned=0;activeElapsed=0;comboIntensity=0;overload=storm=surge=false;playing=false;ended=false;}
  return {update,draw,cut,reset,clearEffects(){trails.length=flashes.length=fragments.length=0;particles.forEach(p=>p.life=0);particleSlot=0;storm=surge=false;},
    inspect(){return {objects:objects.map(({id,type,value,points,x,y,radius,age})=>({id,type,value,points,x,y,radius,age})),reserved:reserved(),effects:{trails:trails.length,flashes:flashes.length,fragments:fragments.length,particles:particles.filter(p=>p.life>0).length}};},
    setChaosProfile(profile={}){motionReduced=reducedMotion||profile.moving===false;const previousLimit=particleLimit;particleLimit=Math.max(1,Math.min(chaos?320:192,Math.floor(profile.particles|| (chaos?256:192))));fragmentLimit=Math.max(1,Math.min(48,Math.floor(profile.fragments|| (chaos?32:24))));if(previousLimit!==particleLimit)for(let i=particleLimit;i<particles.length;i++)particles[i].life=0;if(fragments.length>fragmentLimit)fragments.splice(0,fragments.length-fragmentLimit);},setStorm(value){storm=!!value;},setSurge(value){surge=!!value;},
    setCombo(combo){comboIntensity=Number.isFinite(combo)?Math.min(1,Math.max(0,combo)/10):0;},setOverload(value){overload=Boolean(value);},
    setColor(color){if(color!==palette.color)palette=matterPalette(color);},setSize(w,h,rect){width=w;height=h;field=rect;},dispose:reset};
}
