import {paletteLight} from './glowProfiles.js';

const profiles={NATURAL:{power:.72,fill:.025,scatter:.025,detail:.45,chroma:.15},RADIANT:{power:.25,fill:.065,scatter:.04,detail:.85,chroma:.42},BLAZING:{power:.21,fill:.08,scatter:.05,detail:1.25,chroma:.46}};
export function resolveBodyProfile(name='RADIANT'){
 return Object.hasOwn(profiles,name)?profiles[name]:profiles.RADIANT;
}
// Neutral lift supplies perceived brightness even for low-luminance saturated hues.
// Color only supplies the fill: it cannot suppress an original camera channel.
export function bodyLight(color){
 const rgb=paletteLight(color),luma=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
 const gain=Math.min(1.8,Math.sqrt(.55/Math.max(.08,luma)));
 return rgb.map(v=>v*gain);
}
export function decodeLight(v){return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}
export function encodeLight(v){return v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055;}
// Same separable, linear-light curve as the GPU, sampled by Canvas native LUTs.
export function relightChannel(v,tint,profile){
 const linear=decodeLight(v),lifted=.2*linear+.8*linear**profile.power;
 return encodeLight(lifted+(1-lifted)*profile.fill*tint);
}
