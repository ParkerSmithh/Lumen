import {useEffect,useRef,useState} from 'react';
import {createBodyTrackingBudget} from '../tracking/bodyTrackingBudget.js';
export function useBodyTracking(videoRef,enabled,poseEnabled=false){
 const maskRef=useRef(null),poseRef=useRef(null),desired=useRef(poseEnabled);desired.current=poseEnabled;
 const [status,setStatus]=useState('idle'),[error,setError]=useState(''),[poseStatus,setPoseStatus]=useState('off');
 useEffect(()=>{maskRef.current=poseRef.current=null;setError('');setPoseStatus('off');if(!enabled){setStatus('idle');return;}setStatus('loading');
 let stopped=false,failed=false,pending=false,ready=false,raf,last=0,lastVideo=-1,lastPresence=false,worker,watchdog;
 let poseWorker,poseReady=false,posePending=false,poseBlocked=false,poseWatchdog,lastPose=-Infinity,lastPoseVideo=-1,lastDesired=false,deadline=0,estimate=35,baselineHz=1000/66.7;
 const budget=createBodyTrackingBudget({enabled:true,supported:true}),returns=[];
 const stopPose=reason=>{clearTimeout(poseWatchdog);poseWorker?.terminate();poseWorker=null;poseReady=posePending=false;poseRef.current=null;budget.release('pose',performance.now());setPoseStatus(reason);};
 const fail=()=>{if(stopped||failed)return;failed=true;clearTimeout(watchdog);cancelAnimationFrame(raf);worker?.terminate();stopPose('off');ready=pending=false;maskRef.current=null;budget.release('segmentation',performance.now());setStatus('error');setError('Body tracking is unavailable. Try again.');};
 const startPose=()=>{if(returns.length>=12)baselineHz=(returns.length-1)*1000/(returns.at(-1)-returns[0]);try{poseWorker=new Worker(import.meta.env.BASE_URL+'pose-tracking.worker.js');setPoseStatus('loading');poseWatchdog=setTimeout(()=>{poseBlocked=true;stopPose('fallback');},10000);poseWorker.onerror=()=>{poseBlocked=true;stopPose('fallback');};poseWorker.onmessage=({data})=>{if(stopped)return;if(data.type==='ready'){clearTimeout(poseWatchdog);poseReady=true;setPoseStatus('ready');}else if(data.type==='pose'){const received=performance.now();clearTimeout(poseWatchdog);posePending=false;budget.release('pose',received);estimate=Math.max(35,(data.inferenceMs||0)*1.3);if(received>deadline||estimate>45){poseBlocked=true;stopPose('fallback');return;}poseRef.current=data.landmarks?data:null;}else if(data.type==='error'){poseBlocked=true;stopPose('fallback');}};poseWorker.postMessage({type:'init',assetBase:new URL(import.meta.env.BASE_URL,location.origin).href});}catch{poseBlocked=true;stopPose('fallback');}};
 try{worker=new Worker(import.meta.env.BASE_URL+'segmentation.worker.js');}catch{fail();return;}watchdog=setTimeout(fail,30000);worker.onerror=fail;
 worker.onmessage=({data})=>{if(stopped||failed)return;if(data.type==='ready'){clearTimeout(watchdog);ready=true;setStatus('searching');}else if(data.type==='mask'){const received=performance.now();clearTimeout(watchdog);pending=false;budget.release('segmentation',received);returns.push(received);if(returns.length>20)returns.shift();if(poseWorker&&returns.length>=12){const hz=(returns.length-1)*1000/(returns.at(-1)-returns[0]);budget.setCadence(baselineHz,hz);if(budget.diagnostics.reason){poseBlocked=true;stopPose('fallback');}}
 let foreground=0;for(let i=0;i<data.values.length;i+=4)if(data.values[i]>.6)foreground++;const presence=foreground>data.values.length*.003;maskRef.current=presence?data:null;if(presence!==lastPresence){lastPresence=presence;setStatus(presence?'tracking':'searching');}}else if(data.type==='error')fail();};
 try{worker.postMessage({type:'init',assetBase:new URL(import.meta.env.BASE_URL,location.origin).href});}catch{fail();return;}
 const visibility=()=>{if(document.hidden){poseRef.current=null;stopPose('off');}};document.addEventListener('visibilitychange',visibility);
 const tick=async time=>{if(stopped||failed)return;raf=requestAnimationFrame(tick);const video=videoRef.current;
 if(desired.current!==lastDesired){lastDesired=desired.current;if(!lastDesired)stopPose('off');else poseBlocked=false;}
 if(!ready||document.hidden||!video||video.readyState<2||video.paused||video.ended){poseRef.current=null;return;}
 if(desired.current&&!poseWorker&&!poseBlocked&&returns.length>=12)startPose();
 if(pending)return;
 if(time-last>=66&&video.currentTime!==lastVideo){if(!budget.acquire('segmentation',performance.now()))return;pending=true;last=time;lastVideo=video.currentTime;watchdog=setTimeout(fail,5000);try{const frame=await createImageBitmap(video);if(stopped||failed){frame.close();budget.release('segmentation',performance.now());return;}worker.postMessage({type:'frame',frame,timestamp:time},[frame]);}catch{budget.release('segmentation',performance.now());fail();}return;}
 if(desired.current&&poseReady&&!posePending&&!poseBlocked&&time-lastPose>=250&&video.currentTime!==lastPoseVideo){const began=performance.now();deadline=last+66;if(!budget.acquire('pose',began,deadline,estimate))return;posePending=true;lastPose=time;lastPoseVideo=video.currentTime;poseWatchdog=setTimeout(()=>{poseBlocked=true;stopPose('fallback');},1000);try{const frame=await createImageBitmap(video);if(stopped||!poseWorker){frame.close();budget.release('pose',performance.now());return;}poseWorker.postMessage({type:'frame',frame,timestamp:time},[frame]);}catch{poseBlocked=true;stopPose('fallback');}}
 };
 raf=requestAnimationFrame(tick);return()=>{stopped=true;clearTimeout(watchdog);cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);maskRef.current=poseRef.current=null;worker?.terminate();stopPose('off');};
 },[enabled,videoRef]);return {maskRef,poseRef,status,error,poseStatus};
}
