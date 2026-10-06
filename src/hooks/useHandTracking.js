import { useCallback, useEffect, useRef, useState } from 'react';
import { updateHand } from '../tracking/handPointer';

export function useHandTracking(videoRef,enabled) {
  const handRef=useRef(null);
  const [status,setStatus]=useState('idle'),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  const retry=useCallback(()=>setAttempt(value=>value+1),[]);
  useEffect(()=>{
    handRef.current=null;setError('');
    if(!enabled){setStatus('idle');return;}
    setStatus('loading');
    let closed=false,ready=false,pending=false,raf,last=0,videoTime=-1,sequence=0,currentStatus='loading',watchdog;
    let worker;
    const changeStatus=next=>{if(next!==currentStatus){currentStatus=next;setStatus(next);}};
    const fail=()=>{
      if(closed)return;
      closed=true;clearTimeout(watchdog);cancelAnimationFrame(raf);worker?.terminate();handRef.current=null;
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
        const hand=updateHand(handRef.current,data.landmarks,data.timestamp,++sequence);
        hand.sourceWidth=data.sourceWidth;hand.sourceHeight=data.sourceHeight;handRef.current=hand;
        changeStatus(hand.handDetected ? Math.hypot(hand.velocity.x,hand.velocity.y)>.03?'drawing':'tracking' : 'searching');
      }else if(data.type==='error')fail();
    };
    worker.postMessage({type:'init',assetBase:new URL(import.meta.env.BASE_URL,location.origin).href});
    const tick=async time=>{
      if(closed)return;
      raf=requestAnimationFrame(tick);
      if(handRef.current?.handDetected&&time-handRef.current.timestamp>250)changeStatus('searching');
      const video=videoRef.current;
      if(!ready||pending||document.hidden||!video||video.readyState<2||time-last<50||videoTime===video.currentTime)return;
      pending=true;last=time;videoTime=video.currentTime;watchdog=setTimeout(fail,5000);
      try{
        const frame=await createImageBitmap(video);
        if(closed){frame.close();return;}
        worker.postMessage({type:'frame',frame,timestamp:time},[frame]);
      }catch{fail();}
    };
    raf=requestAnimationFrame(tick);
    return()=>{closed=true;clearTimeout(watchdog);cancelAnimationFrame(raf);handRef.current=null;worker.terminate();};
  },[videoRef,enabled,attempt]);
  return{handRef,status,error,retry};
}
