import {useEffect,useState} from 'react';
import {predictHandPoint} from './tracking/handPointer';
import {fitContain} from './tracking/utils';
export function TrackingDiagnostics({hands,mode}){
 const [data,setData]=useState(null),[copied,setCopied]=useState(false);
 useEffect(()=>{const timer=setInterval(()=>setData({...hands.metricsRef.current?.report(),hand:hands.handRef.current,now:performance.now()}),250);return()=>clearInterval(timer);},[hands.metricsRef,hands.handRef]);
 const hand=data?.hand,predicted=predictHandPoint(hand,data?.now||performance.now()),r=fitContain(hand?.sourceWidth||640,hand?.sourceHeight||480,innerWidth,innerHeight);
 const style=p=>({left:r.x+p.x*r.width,top:r.y+p.y*r.height});
 return <aside className="tracking-debug" aria-label="Development tracking diagnostics">
  <pre>{JSON.stringify({mode,hz:data?.hz?.toFixed(1),motionHz:data?.motionHz?.toFixed(1),resets:data?.resets,rejectedSpikes:data?.rejectedSpikes,filterLag:data?.filterLag,filterDelayMs:data?.estimatedFilterDelayMs,smoothingMs:data?.smoothingMs,resultAgeMs:data?.ageMs,currentHandAgeMs:hand?Math.round(data.now-hand.timestamp):null,inference:data?.inferenceMs,capture:data?.captureMs,roundTrip:data?.roundTripMs,dimensions:[data?.sourceWidth,data?.sourceHeight],dropped:data?.dropped,losses:data?.losses,reacquisitions:data?.reacquisitions,confidence:.5,detected:hand?.handDetected,raw:hand?.rawIndex,filtered:hand?.indexFinger,palm:hand?.palm,velocity:hand?.velocity,rawSpeed:hand?.rawSpeed,travel:hand?.travel,coordinated:hand?.coordinated,reset:hand?.resetReason,push:hand?.pushDebug,slash:hand?.slashDebug},null,2)}</pre>
  {hand?.handDetected&&<><i className="raw-tip" style={style(hand.rawIndex)}/><i style={style(hand.indexFinger)}/>{predicted&&<i className="predicted-tip" style={style(predicted)}/>}</>}
 <button className="copy-motion-report" onClick={async()=>{try{await navigator.clipboard.writeText(JSON.stringify(hands.metricsRef.current?.report(),null,2));setCopied(true);}catch{setCopied(false);}}}>{copied?'Copied motion report':'Copy motion report'}</button>
 </aside>;
}
