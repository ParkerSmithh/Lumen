const profiles={SOFT:{rim:1.4,bloom:1.8,lighting:.6,radius:.8},NEON:{rim:2.5,bloom:3.6,lighting:1,radius:1},SUPERNOVA:{rim:3.4,bloom:4.8,lighting:1.2,radius:1.35}};
export function resolveGlowProfile(preset='NEON',quality='high'){
 const name=Object.hasOwn(profiles,preset)?preset:'NEON';return {...profiles[name],name,bloomSize:quality==='low'||name==='SOFT'?128:256,scales:quality==='low'?2:3};
}
export function paletteLight(hex){
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),max=Math.max(...rgb);return rgb.map(v=>Math.pow(v/max,1.8));
}
