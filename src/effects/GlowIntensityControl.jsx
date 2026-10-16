import './glowControls.css';
export function GlowIntensityControl({value,onChange}){
 return <div className="glow-intensity" data-energy-exclude><span>GLOW INTENSITY</span><div role="group" aria-label="Glow intensity">{['SOFT','NEON','SUPERNOVA'].map(preset=><button key={preset} aria-pressed={value===preset} title={preset==='NEON'?'Recommended glow intensity':undefined} onClick={()=>onChange(preset)}>{preset}{preset==='NEON'&&<small>RECOMMENDED</small>}</button>)}</div></div>;
}
