// Synthetic canvas capture and worker boundary, never a physical webcam.
export async function installCamera(page,{permission='granted',saved=null,storageBlocked=false,delay=false}={}) {
 await page.addInitScript(({permission,saved,storageBlocked,delay})=>{
  if(saved&&!localStorage.getItem('lumen.camera.v1'))localStorage.setItem('lumen.camera.v1',JSON.stringify(saved));
  if(storageBlocked){Object.defineProperty(window,'localStorage',{get(){throw Error('storage disabled');}});}
  const stats=window.cameraTest={attempts:0,active:0,peak:0,workers:0,peakWorkers:0,requests:[],pending:[],permission,devices:[{kind:'videoinput',deviceId:'desk',label:'Desk camera'},{kind:'videoinput',deviceId:'usb',label:'USB camera'}],started:null,tracking:null};
  const permissionStatus=new EventTarget();Object.defineProperty(permissionStatus,'state',{get:()=>stats.permission});
  Object.defineProperty(navigator.permissions,'query',{value:async()=>permissionStatus});
  Object.defineProperty(navigator.mediaDevices,'enumerateDevices',{value:async()=>stats.devices});
  Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async constraints=>{
   stats.attempts++;stats.requests.push(constraints);if(delay)await new Promise(resolve=>stats.pending.push(resolve));
   const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;
   const ctx=canvas.getContext('2d');const draw=()=>{ctx.fillStyle='#151827';ctx.fillRect(0,0,640,480);ctx.fillStyle='#ccbbee';ctx.fillRect(200,80,200,360);};draw();
   const stream=canvas.captureStream(30),track=stream.getVideoTracks()[0],stop=track.stop.bind(track);
   stats.active++;stats.peak=Math.max(stats.peak,stats.active);let stopped=false;const timer=setInterval(draw,33);
   track.stop=()=>{if(!stopped){stopped=true;stats.active--;clearInterval(timer);}stop();};
   track.getSettings=()=>({deviceId:constraints.video.deviceId?.exact||'desk',facingMode:constraints.video.facingMode||'user'});
   stats.end=()=>{track.stop();track.dispatchEvent(new Event('ended'));};return stream;
  }});
  stats.revoke=()=>{stats.permission='denied';permissionStatus.dispatchEvent(new Event('change'));};
  stats.remove=()=>{stats.devices=stats.devices.filter(d=>d.deviceId!=='usb');navigator.mediaDevices.dispatchEvent(new Event('devicechange'));};
  window.Worker=class {
   constructor(url){this.url=String(url);this.closed=false;stats.workers++;stats.peakWorkers=Math.max(stats.peakWorkers,stats.workers);}
   postMessage(m){if(this.closed){m.frame?.close();return;}if(m.type==='init')queueMicrotask(()=>{if(!this.closed)this.onmessage?.({data:{type:'ready'}});});
    if(m.type==='frame'){m.frame?.close();if(this.url.includes('segmentation'))queueMicrotask(()=>{if(!this.closed){stats.tracking??=performance.now();this.onmessage?.({data:{type:'mask',width:24,height:18,values:new Float32Array(432).fill(1),timestamp:m.timestamp}});}});}}
   terminate(){if(!this.closed){this.closed=true;stats.workers--;}this.onmessage=null;}
  };
  const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=async function(){await play.call(this);stats.started=performance.now();};
 },{permission,saved,storageBlocked,delay});
}
