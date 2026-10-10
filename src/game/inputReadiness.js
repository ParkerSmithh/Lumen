// Camera-frame motion is valid without hand landmarks (SLASH).
export function inputReady({assisted=false,cameraReady=false,video,trackingStatus,trackingError=false,frameMotion=false,renderReady=true}){
 if(!renderReady)return false;
 if(assisted)return true;
 if(!cameraReady||!video||video.readyState<2||video.paused||video.ended)return false;
 return frameMotion||(!trackingError&&trackingStatus!=='loading'&&trackingStatus!=='idle'&&trackingStatus!=='error');
}
