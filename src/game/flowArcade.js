/** FLOW scoring rules; the shared round clock owns the 90-second duration. */
export function createFlowArcade(){
 let state,seen;
 const snapshot=()=>({...state});
 function reset(){seen=new Set();state={score:0,chain:0,maxChain:0,quality:null,accuracy:null};return snapshot();}
 reset();
 return {reset,snapshot,complete(id,accuracy,elapsed){
  if(seen.has(id))return snapshot();seen.add(id);
  const value=Number.isFinite(accuracy)?Math.max(0,Math.min(100,accuracy)):0;
  const bonus=value>=95?100:value>=85?50:0;
  state.score+=100+bonus+Math.min(25,state.chain*5);
  state.chain++;state.maxChain=Math.max(state.maxChain,state.chain);
  state.accuracy=value;state.quality=value>=95?'PERFECT TRACE':value>=85?'CLEAN TRACE':'COMPLETE';
  return snapshot();
 },skip(id,elapsed){if(seen.has(id))return snapshot();seen.add(id);state.chain=0;state.quality=null;state.accuracy=null;return snapshot();}};
}
