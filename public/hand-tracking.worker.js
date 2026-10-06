importScripts(new URL('vision/vision_bundle.js',self.location.href).href);
let task,diagnostics=false;
self.onmessage=async ({data})=>{
  try {
    if(data.type==='init') {
      const base=data.assetBase;diagnostics=!!data.diagnostics;
      const files=await Vision.FilesetResolver.forVisionTasks(base+'vision');
      task=await Vision.HandLandmarker.createFromOptions(files,{
        baseOptions:{modelAssetPath:base+'models/hand_landmarker.task',delegate:'CPU'},
        runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.5,minHandPresenceConfidence:.5,minTrackingConfidence:.5,
      });
      self.postMessage({type:'ready'});
    } else if(data.type==='frame'&&task) {
      const started=diagnostics?performance.now():0;
      const result=task.detectForVideo(data.frame,data.timestamp);
      self.postMessage({type:'hand',inferenceMs:diagnostics?performance.now()-started:undefined,landmarks:result.landmarks[0]||null,timestamp:data.timestamp,sourceWidth:data.frame.width,sourceHeight:data.frame.height});
    } else if(data.type==='dispose') {task?.close();task=null;self.close();}
  } catch(error){self.postMessage({type:'error',message:error.message});}
  finally{data.frame?.close();}
};
