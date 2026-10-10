import {INSTRUCTION_DEMOS} from './gameInstructions.js';

function Hand({closed=false,...props}) {
 return <g {...props} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d={closed?'M-18 22V0Q-18-8-10-6V-10Q-10-17-3-14Q0-20 6-14Q14-17 16-9L20 6Q23 20 12 30H-6Z':'M-16 24L-25 7Q-27 0-21-1L-12 9V-29Q-12-36-6-32V-8V-38Q-6-45 0-40V-9V-32Q0-39 6-35V-7V-24Q6-31 12-27V4Q24-9 27-1L17 24Q12 34 1 34Z'}/></g>;
}

export function GameInstructionDemo({gameId}) {
 const demo=INSTRUCTION_DEMOS[gameId];
 return <svg className={`game-instructions-demo demo-scene-${demo.scene}`} viewBox="0 0 460 210" aria-hidden="true" focusable="false">
  <g className="demo-particles">{[[54,37],[109,153],[148,24],[300,26],[402,132],[363,163]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i%2?1:1.5} style={{animationDelay:`${i*.6}s`}}/>)}</g>
  {demo.scene==='launch'?<>
   <path className="demo-muted" d="M62 165H398"/><g className="demo-target"><circle cx="365" cy="67" r="27"/><circle cx="365" cy="67" r="14"/><path d="M328 67h74M365 30v74"/></g>
   <circle className="demo-muted" cx="154" cy="139" r="10"/><circle className="demo-muted" cx="240" cy="146" r="9"/>
   <circle className="demo-selection" cx="195" cy="105" r="23"/><circle className="demo-ball" cx="195" cy="105" r="11"/>
   <g className="demo-hand-approach"><Hand className="demo-open-hand" transform="translate(184 107)"/></g><g className="demo-hand-carry"><Hand closed className="demo-closed-hand" transform="translate(184 107)"/></g>
   <path className="demo-throw-path" d="M213 94Q282 8 354 62"/>
  </>:demo.scene==='flow'?<>
   <path className="demo-outline" d={demo.path}/><path className="demo-trace" d={demo.path}/>
   <g className="demo-trace-finger" style={{offsetPath:`path('${demo.path}')`}}><circle r="7"/><path d="m5 6 9 18 3-11 11-2Z" fill="currentColor" stroke="none"/></g>
  </>:demo.scene==='slash'?<>
   <path className="demo-muted" d="m110 125 17-32 30 10 8 30-29 19Z"/>
   <g className="demo-crystal"><path d="m235 50 35 40-20 65-45-8-20-47Z"/><path d="m235 50-15 53 30 52m-65-55 35 3 50-13"/></g>
   <g className="demo-fragments">{[[206,80,-30,-28],[250,76,32,-23],[201,123,-26,25],[251,133,29,28],[226,102,3,-35]].map(([x,y,dx,dy],i)=><path key={i} d={`M${x} ${y}l10 -5 5 14 -13 5Z`} style={{'--fragment-x':`${dx}px`,'--fragment-y':`${dy}px`}}/>)}</g>
   <path className="demo-slash" d="M135 167Q228 118 325 43"/><path className="demo-slash-core" d="m152 160 157-107"/>
   <g className="demo-swipe-hand"><Hand transform="translate(142 151) scale(.45)"/></g>
   <path className="demo-muted" d="m335 126 15-17 19 13-6 25-23-1Z"/>
  </>:<>
   <g className="demo-body" strokeWidth="2.5" strokeLinecap="round"><circle cx="223" cy="47" r="13"/><path d="M212 65Q223 59 234 65L239 96L266 104L263 112L234 105L232 127L252 165L243 168L223 136L204 168L195 165L214 127L212 105L181 113L178 105L207 96Z"/></g>
   <circle className="demo-energy-orb" cx="167" cy="108" r="11"/><circle className="demo-collect-ring" cx="167" cy="108" r="16"/>
   <g className="demo-danger"><circle cx="281" cy="113" r="13"/><path d="m276 108 10 10m0-10-10 10"/></g>
   <path className="demo-dodge" d="M267 148Q225 173 184 147m0 0 3 10m-3-10 11-2"/>
   <path className="demo-muted" d="M114 174H331"/>
  </>}
  {demo.captions.map((text,i)=><text key={text} x={demo.captions.length===2?135+i*190:demo.captions.length===4?55+i*115:90+i*140} y="198">{text}</text>)}
 </svg>;
}
