import {freshEnergyPose} from './energyCalibration.js';
export function createEnergyMotionEvidence(){
 let observations=[],last=-Infinity,lastPose=-Infinity,poseCount=0;
 return {reset(){observations=[];last=lastPose=-Infinity;poseCount=0;},
  sample(s,cal,body,now){
   if(!s?.valid||s.timestamp<=last)return false;
   if(s.timestamp-last>250)observations=[];last=s.timestamp;
   observations.push({timestamp:s.timestamp,x:s.center.x,y:s.center.y});observations=observations.filter(o=>s.timestamp-o.timestamp<=1200).slice(-20);
   const pose=freshEnergyPose(body,now);
   if(pose&&pose.timestamp>lastPose){poseCount=pose.timestamp-lastPose<=500?poseCount+1:1;lastPose=pose.timestamp;}else if(!pose)poseCount=0;
   const positive=[cal.targets.left,cal.targets.right].filter((n,i)=>cal.capabilities.includes(i?'right':'left'));
   const threshold=Math.max(.0125,(positive.length?Math.min(...positive)*.8:.02),cal.noise*3||0);
   const lateral=observations.length>=3&&observations.some(o=>s.timestamp-o.timestamp>=200&&Math.abs(s.center.x-o.x)>=threshold)&&Math.abs(s.occupancy/cal.baseline.occupancy-1)<.25;
   const reach=cal.capabilities.includes('reach')&&poseCount>=3&&pose&&pose.reach-cal.baseline.reach>=cal.targets.reach*.8;
   const expand=cal.capabilities.includes('expand')&&(s.bounds.maxX-s.bounds.minX)/cal.baseline.width-1>=Math.max(.08,cal.targets.expand*.8)&&Math.abs(s.occupancy/cal.baseline.occupancy-1)<.15;
   return !!(lateral||reach||expand);
  }
 };
}
