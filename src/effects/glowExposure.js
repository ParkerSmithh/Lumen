// Background-only 5Hz meter; time-based adaptation avoids brightness pumping.
export function ambientMeter(){
 const sample=document.createElement('canvas');sample.width=24;sample.height=18;const ctx=sample.getContext('2d',{willReadFrequently:true});let last=-Infinity,value;
 const measure=(video,mask)=>{
  if(!video||!mask)return value??0;const now=performance.now();if(now-last<200)return value??0;const elapsed=now-last;last=now;
  try{ctx.drawImage(video,0,0,24,18);const pixels=ctx.getImageData(0,0,24,18).data;let total=0,count=0;
   for(let y=0;y<18;y++)for(let x=0;x<24;x++){const i=y*24+x,mx=Math.min(mask.width-1,Math.floor((x+.5)*mask.width/24)),my=Math.min(mask.height-1,Math.floor((y+.5)*mask.height/18));if(mask.values[my*mask.width+mx]>.2)continue;total+=(pixels[i*4]*.2126+pixels[i*4+1]*.7152+pixels[i*4+2]*.0722)/255;count++;}
   if(count<24)return value??0;const u=Math.max(0,Math.min(1,(.24-total/count)/.18)),target=u*u*(3-2*u);value=value===undefined?target:value+(target-value)*(1-Math.exp(-Math.min(elapsed,400)/1100));
  }catch{}return value??0;
 };
 measure.reset=()=>{last=-Infinity;value=undefined;};
 measure.dispose=()=>{sample.width=sample.height=0;measure.reset();};
 return measure;
}
