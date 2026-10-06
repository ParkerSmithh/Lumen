import { useCallback, useEffect, useRef, useState } from 'react';
import { createTrackingMetrics } from '../tracking/metrics';
import { updateHand } from '../tracking/handPointer';

export function useHandTracking(videoRef,enabled) {
  const handRef=useRef(null),metricsRef=useRef(null);
  const [status,setStatus]=useState('idle'),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  const retry=useCallback(()=>setAttempt(value=>value+1),[]);
  useEffect(()=>{
    const requested=import.meta.env.DEV?new URLSearchParams(location.search).get('trackingHz'):null;
    const diagnostics=import.meta.env.DEV&&(!!requested||new URLSearchParams(location.search).has('debugTracking'));
    handRef.current=null;metricsRef.current=diagnostics?createTrackingMetrics():null;setError('');
    if(!enabled){setStatus('idle');return;}
    setStatus('loading');
    let closed=false,ready=false,pending=false,raf,last=0,videoTime=-1,sequence=0,currentStatus='loading',watchdog;
    let worker,captureMs=0,dispatch=0,frameCallback,frameSerial=0,usedSerial=-1;
    const liveVideo=videoRef.current;
    const markFrame=()=>{frameSerial++;if(!closed)frameCallback=liveVideo.requestVideoFrameCallback(markFrame);};
    if(liveVideo?.requestVideoFrameCallback)frameCallback=liveVideo.requestVideoFrameCallback(markFrame);
    const interval=requested==='max'?0:requested==='20'?50:1000/30;
    if(diagnostics)window.__lumenTracking={metrics:metricsRef.current,handRef,interval};
    const changeStatus=next=>{if(next!==currentStatus){currentStatus=next;setStatus(next);}};
    const fail=()=>{
      if(closed)return;
      closed=true;liveVideo?.cancelVideoFrameCallback?.(frameCallback);clearTimeout(watchdog);cancelAnimationFrame(raf);worker?.terminate();handRef.current=null;
      changeStatus('error');setError('Hand tracking is unavailable. Retry, or use mouse / touch.');
    };
    try{worker=new Worker(`${import.meta.env.BASE_URL}hand-tracking.worker.js`);}catch{fail();return;}
    watchdog=setTimeout(fail,30000);
    worker.onerror=fail;
    worker.onmessage=({data})=>{
      if(closed)return;
      clearTimeout(watchdog);pending=false;
      if(data.type==='ready'){ready=true;changeStatus('searching');}
      else if(data.type==='hand'){
        const received=performance.now();
        metricsRef.current?.record({timestamp:data.timestamp,received,captureMs,dispatch,inferenceMs:data.inferenceMs,detected:received-data.timestamp<=250?!!data.landmarks:undefined,sourceWidth:data.sourceWidth,sourceHeight:data.sourceHeight});
        if(received-data.timestamp>250){metricsRef.current?.drop();handRef.current=null;changeStatus('searching');return;}
        const hand=updateHand(handRef.current,data.landmarks,data.timestamp,++sequence);
        hand.sourceWidth=data.sourceWidth;hand.sourceHeight=data.sourceHeight;handRef.current=hand;
        changeStatus(hand.handDetected ? Math.hypot(hand.velocity.x,hand.velocity.y)>.03?'drawing':'tracking' : 'searching');
      }else if(data.type==='error')fail();
    };
    worker.postMessage({type:'init',diagnostics,assetBase:new URL(import.meta.env.BASE_URL,location.origin).href});
    const tick=async time=>{
      if(closed)return;
      raf=requestAnimationFrame(tick);
      if(handRef.current?.handDetected&&time-handRef.current.timestamp>250)changeStatus('searching');
      const video=videoRef.current;
      if(!ready||pending||document.hidden||!video||video.readyState<2||time-last<interval||(liveVideo?.requestVideoFrameCallback?frameSerial===usedSerial:videoTime===video.currentTime))return;
      pending=true;usedSerial=frameSerial;last=time;videoTime=video.currentTime;watchdog=setTimeout(fail,5000);
      try{
        const started=performance.now();
        const frame=await createImageBitmap(video);captureMs=performance.now()-started;
        if(closed){frame.close();return;}
        dispatch=performance.now();worker.postMessage({type:'frame',frame,timestamp:time},[frame]);
      }catch{fail();}
    };
    raf=requestAnimationFrame(tick);
    return()=>{closed=true;liveVideo?.cancelVideoFrameCallback?.(frameCallback);clearTimeout(watchdog);cancelAnimationFrame(raf);handRef.current=null;worker.terminate();};
  },[videoRef,enabled,attempt]);
  return{handRef,metricsRef,status,error,retry};
}
