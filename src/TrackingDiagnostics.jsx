import {useEffect,useState} from 'react';
import {fitContain} from './tracking/utils';
export function TrackingDiagnostics({hands,mode}){
 const [data,setData]=useState(null);
 useEffect(()=>{const timer=setInterval(()=>setData({...hands.metricsRef.current?.report(),hand:hands.handRef.current,now:performance.now()}),250);return()=>clearInterval(timer);},[hands.metricsRef,hands.handRef]);
 const hand=data?.hand,r=fitContain(hand?.sourceWidth||640,hand?.sourceHeight||480,innerWidth,innerHeight);
 const style=p=>({left:r.x+p.x*r.width,top:r.y+p.y*r.height});
 return <aside className="tracking-debug" aria-label="Development tracking diagnostics">
  <pre>{JSON.stringify({mode,hz:data?.hz?.toFixed(1),resultAgeMs:data?.ageMs,currentHandAgeMs:hand?Math.round(data.now-hand.timestamp):null,inference:data?.inferenceMs,capture:data?.captureMs,roundTrip:data?.roundTripMs,dimensions:[data?.sourceWidth,data?.sourceHeight],dropped:data?.dropped,losses:data?.losses,reacquisitions:data?.reacquisitions,confidence:.5,detected:hand?.handDetected,raw:hand?.rawIndex,filtered:hand?.indexFinger,palm:hand?.palm,velocity:hand?.velocity,reset:hand?.resetReason,push:hand?.pushDebug,slash:hand?.slashDebug},null,2)}</pre>
  {hand?.handDetected&&<><i className="raw-tip" style={style(hand.rawIndex)}/><i style={style(hand.indexFinger)}/></>}
 </aside>;
}
