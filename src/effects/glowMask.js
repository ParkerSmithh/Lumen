// Rendering-only confidence processing. The caller's gameplay mask is never modified.
export function createVisualMask(){
 let result=null,history=null,previous=null,stamp,lastTime=0,source='',revision=0;
 return {
 update(mask,time=0){
  if(!mask||!Number.isInteger(mask.width)||!Number.isInteger(mask.height)||mask.width<1||mask.height<1||mask.values?.length!==mask.width*mask.height){this.reset();return null;}
  if(mask===previous&&mask.timestamp===stamp)return result;
  const scale=Math.min(1,512/Math.max(mask.width,mask.height)),w=Math.max(1,Math.round(mask.width*scale)),h=Math.max(1,Math.round(mask.height*scale));
  const geometry=`${mask.width}:${mask.height}:${mask.sourceWidth}:${mask.sourceHeight}`;
  const reset=!result||source!==geometry||time-lastTime>600||time<lastTime;
  if(reset){result={width:w,height:h,data:new Uint8ClampedArray(w*h*4),revision:0};history=new Float32Array(w*h);source=geometry;}
  const blend=1-Math.exp(-Math.max(1,time-lastTime)/45);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=y*w+x,raw=mask.values[Math.min(mask.height-1,Math.floor((y+.5)/h*mask.height))*mask.width+Math.min(mask.width-1,Math.floor((x+.5)/w*mask.width))];
   let a=Number.isFinite(raw)?Math.max(0,Math.min(1,(raw-.25)*2)):0;a=a*a*(3-2*a);
   const value=reset||Math.abs(a-history[i])>.28?a:history[i]+(a-history[i])*blend;history[i]=value;
   result.data[i*4]=result.data[i*4+1]=result.data[i*4+2]=255;result.data[i*4+3]=Math.round(value*255);
  }
  result.revision=++revision;previous=mask;stamp=mask.timestamp;lastTime=time;return result;
 },
 reset(){result=history=previous=null;stamp=undefined;source='';},
 dispose(){this.reset();},stats(){return {bytes:(history?.byteLength||0)+(result?.data.byteLength||0)};}
 };
}

// True min/max morphology, not alpha-union/product: a fractional confidence
// plateau is coverage, never an emissive edge. Writes into caller-owned storage.
export function writeVisualRim(mask,out,rgb){
 const {width:w,height:h,data}=mask;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  let lo=1,hi=0;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const nx=x+dx,ny=y+dy,a=nx<0||ny<0||nx>=w||ny>=h?0:data[(ny*w+nx)*4+3]/255;lo=Math.min(lo,a);hi=Math.max(hi,a);
  }
  const i=(y*w+x)*4,t=Math.max(0,Math.min(1,(hi-lo-.03)/.77));out[i]=rgb[0];out[i+1]=rgb[1];out[i+2]=rgb[2];out[i+3]=Math.round(t*t*(3-2*t)*255);
 }
 return out;
}

