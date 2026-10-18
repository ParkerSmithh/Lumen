import {relightChannel,bodyLight,resolveBodyProfile} from './bodyIllumination.js';
let serial=0;
// Native SVG component-transfer applies bounded LUTs without camera readbacks.
export function createBodyCanvasFilter(){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),filter=document.createElementNS(ns,'filter'),transfer=document.createElementNS(ns,'feComponentTransfer');
 const id=`lumen-body-${++serial}`;filter.id=id;filter.setAttribute('color-interpolation-filters','sRGB');
 const blur=document.createElementNS(ns,'feGaussianBlur');blur.setAttribute('in','SourceGraphic');blur.setAttribute('result','local');
 transfer.setAttribute('in','SourceGraphic');transfer.setAttribute('result','lit');
 const detail=document.createElementNS(ns,'feComposite');detail.setAttribute('in','SourceGraphic');detail.setAttribute('in2','local');detail.setAttribute('operator','arithmetic');detail.setAttribute('k2','1');detail.setAttribute('k3','-1');detail.setAttribute('k4','.5');detail.setAttribute('result','detail');
 const combine=document.createElementNS(ns,'feComposite');combine.setAttribute('in','lit');combine.setAttribute('in2','detail');combine.setAttribute('operator','arithmetic');combine.setAttribute('k2','1');
 const colorize=document.createElementNS(ns,'feColorMatrix');colorize.setAttribute('type','matrix');
 const rolloff=document.createElementNS(ns,'feComponentTransfer');for(const channel of ['R','G','B']){const f=document.createElementNS(ns,'feFunc'+channel);f.setAttribute('type','table');f.setAttribute('tableValues',Array.from({length:257},(_,i)=>{const v=i/256;return (Math.min(v,.94)+.045*(1-Math.exp(-Math.max(v-.94,0)/.045))).toFixed(6);}).join(' '));rolloff.append(f);}
 rolloff.setAttribute('result','graded');
 const highlightMask=document.createElementNS(ns,'feColorMatrix');highlightMask.setAttribute('in','local');highlightMask.setAttribute('type','matrix');highlightMask.setAttribute('values','0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.32875 4.47 .45125 0 -4.5');highlightMask.setAttribute('result','highlightMask');
 const preserved=document.createElementNS(ns,'feColorMatrix');preserved.setAttribute('in','SourceGraphic');preserved.setAttribute('type','matrix');preserved.setAttribute('values','.985 0 0 0 0 0 .985 0 0 0 0 0 .985 0 0 0 0 0 1 0');preserved.setAttribute('result','preserved');
 const highlight=document.createElementNS(ns,'feComposite');highlight.setAttribute('in','preserved');highlight.setAttribute('in2','highlightMask');highlight.setAttribute('operator','in');highlight.setAttribute('result','highlight');
 const shaded=document.createElementNS(ns,'feComposite');shaded.setAttribute('in','graded');shaded.setAttribute('in2','highlightMask');shaded.setAttribute('operator','out');shaded.setAttribute('result','shaded');
 const merge=document.createElementNS(ns,'feMerge');for(const input of ['shaded','highlight']){const node=document.createElementNS(ns,'feMergeNode');node.setAttribute('in',input);merge.append(node);}
 svg.setAttribute('width','0');svg.setAttribute('height','0');svg.style.position='absolute';svg.setAttribute('aria-hidden','true');filter.append(blur,transfer,detail,combine,colorize,rolloff,highlightMask,preserved,highlight,shaded,merge);svg.append(filter);document.body.append(svg);
 const channels=['R','G','B'].map(channel=>{const f=document.createElementNS(ns,'feFunc'+channel);f.setAttribute('type','table');transfer.append(f);return f;});let key='';
 return {update(color,preset,scale=1){const next=color+':'+preset+':'+scale;if(next!==key){const rgb=bodyLight(color),profile=resolveBodyProfile(preset);blur.setAttribute('stdDeviation',String(4*scale));channels.forEach((f,i)=>f.setAttribute('tableValues',Array.from({length:257},(_,j)=>relightChannel(j/256,rgb[i],profile).toFixed(6)).join(' ')));combine.setAttribute('k3',String(profile.detail*1.1));combine.setAttribute('k4',String(-profile.detail*.55));const weights=[.2126,.7152,.0722],luma=rgb.reduce((n,v,i)=>n+v*weights[i],0),range=Math.max(.1,Math.max(...rgb)-Math.min(...rgb)),matrix=rgb.flatMap((v,i)=>{const d=(v-luma)/range*profile.chroma;return [...weights.map((w,j)=>(i===j?1:0)-d*w),0,d];});colorize.setAttribute('values',[...matrix,0,0,0,1,0].join(' '));key=next;}return `url(#${id})`;},dispose(){svg.remove();},get nodes(){return svg.isConnected?svg.querySelectorAll('*').length+1:0;}};
}
