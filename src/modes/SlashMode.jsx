import { useEffect,useRef } from 'react';
import { createSlashDetector,handEdge } from '../tracking/slashDetector';
import { createSlashFrameMotion } from '../tracking/slashFrameMotion';
import { fitContain } from '../tracking/utils';
import { createSlashScene } from '../effects/slashScene';

export function SlashMode({handRef,videoRef,color,mouseMode,onSlash,onFailure}) {
  const canvasRef=useRef(null),settings=useRef({mouseMode,color,onSlash,onFailure});settings.current={mouseMode,color,onSlash,onFailure};
  useEffect(()=>{
    const canvas=canvasRef.current,ctx=canvas.getContext('2d');
    if(!ctx){settings.current.onFailure('SLASH needs Canvas rendering. Try another browser.');return;}
    const scene=createSlashScene(ctx),detector=createSlashDetector(),motionDetector=createSlashDetector(),frameMotion=createSlashFrameMotion();
    const frameCanvas=document.createElement('canvas'),frameContext=frameCanvas.getContext('2d',{willReadFrequently:true});
    let lastVideoTime=-1,lastFrameTime=0,frameSequence=0,recognizedSegments=0;
    let raf,last=performance.now(),rect,width,height,mouse=null,pressed=false,sequence=0,mode=settings.current.mouseMode,sourceAspect=4/3;
    const resize=()=>{
      width=canvas.clientWidth;height=canvas.clientHeight;
      const ratio=Math.min(devicePixelRatio||1,1.5,1280/width,900/height);
      canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
      const contained=fitContain(sourceAspect,1,width,height);
      // Keep spawn positions reachable and clear of the navigation/footer.
      rect={x:contained.x,y:contained.y+contained.height*.12,width:contained.width,height:contained.height*.76};
      scene.setSize(width,height,rect);detector.reset();
    };
    resize();const observer=new ResizeObserver(resize);observer.observe(canvas);
    const reset=()=>{pressed=false;mouse=null;detector.reset();motionDetector.reset();frameMotion.reset();lastVideoTime=-1;};
    const move=event=>{
      if(!settings.current.mouseMode||!pressed)return;
      if(event.target.closest?.('button,nav,header,footer')){mouse=null;detector.reset();return;}
      const bounds=canvas.getBoundingClientRect(),x=(event.clientX-bounds.left)/width,y=(event.clientY-bounds.top)/height;
      mouse={active:true,center:{x,y},edge:[{x,y:y-.018},{x,y:y+.018}],aspect:width/height,timestamp:performance.now(),sequence:++sequence,source:'mouse'};
      if(event.pointerType==='touch')event.preventDefault();
    };
    const down=event=>{if(!settings.current.mouseMode||event.target.closest?.('button,nav,header,footer'))return;event.preventDefault();pressed=true;detector.reset();move(event);};
    const visibility=()=>{last=performance.now();if(document.hidden)reset();};
    window.addEventListener('pointerdown',down);window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',reset);window.addEventListener('pointercancel',reset);window.addEventListener('blur',reset);document.addEventListener('visibilitychange',visibility);
    const draw=time=>{
      if(mode!==settings.current.mouseMode){mode=settings.current.mouseMode;reset();}
      const dt=(time-last)/1000;last=time;
      if(document.hidden){reset();raf=requestAnimationFrame(draw);return;}
      const hand=handRef.current;
      let sample;
      if(mode)sample=mouse;
      else{
        sample=handEdge(hand);
        if(hand?.sourceWidth&&Math.abs(sourceAspect-hand.sourceWidth/hand.sourceHeight)>.001){sourceAspect=hand.sourceWidth/hand.sourceHeight;resize();}
      }
      scene.setColor(settings.current.color);scene.update(dt);
      let fallback=null;
      const video=videoRef?.current;
      if(!mode&&video&&!video.paused&&video.readyState>=2&&video.currentTime!==lastVideoTime&&time-lastFrameTime>=30&&frameContext){
        lastVideoTime=video.currentTime;lastFrameTime=time;
        const aspect=video.videoWidth/video.videoHeight;
        if(Math.abs(sourceAspect-aspect)>.001){sourceAspect=aspect;resize();}
        const h=128,w=Math.max(32,Math.round(h*aspect));
        if(frameCanvas.width!==w||frameCanvas.height!==h){frameCanvas.width=w;frameCanvas.height=h;frameMotion.reset();motionDetector.reset();}
        frameContext.drawImage(video,0,0,w,h);
        const packet=frameMotion.update(frameContext.getImageData(0,0,w,h).data,w,h,time,++frameSequence);
        fallback=motionDetector.update(packet,time);
      }else if(!mode&&(!video||video.paused||video.readyState<2)){frameMotion.reset();motionDetector.reset();}
      let slash=detector.update(sample,time)||fallback;

      if(import.meta.env.DEV&&hand)hand.slashDebug={recognizedSegments:(recognizedSegments+=slash?1:0),source:slash?.source,speed:Math.hypot(hand.palmVelocity?.x||0,hand.palmVelocity?.y||0),threshold:.65,qualified:!!slash};
      if(slash){
        // Tracking occupies the whole contained camera frame; it is never stretched.
        const mapping=mode?{x:0,y:0,width,height}:fitContain(sourceAspect,1,width,height);
        const project=point=>({x:mapping.x+point.x*mapping.width,y:mapping.y+point.y*mapping.height});
        const hit=scene.cut({...slash,start:project(slash.start),end:project(slash.end),edge:slash.edge.map(project),previousEdge:slash.previousEdge.map(project),path:slash.path?.map(node=>({center:project(node.center),edge:node.edge.map(project)}))});
        settings.current.onSlash(hit>0);
      }
      scene.draw();raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('pointerdown',down);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',reset);window.removeEventListener('pointercancel',reset);window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',visibility);detector.reset();motionDetector.reset();frameMotion.reset();frameCanvas.width=frameCanvas.height=0;scene.dispose();canvas.width=canvas.height=0;};
  },[handRef,videoRef]);
  return <canvas ref={canvasRef} className={`artwork slash-artwork ${mouseMode?'':'hand-input'}`} aria-hidden="true"/>;
}
