import test from 'node:test';import assert from 'node:assert/strict';
import {trackingNotice} from '../src/tracking/trackingNotice.js';
import {shapePath,createTraceEvaluator} from '../src/game/lightTrace.js';
import {getGameInstructions,instructionReadiness} from '../src/game/gameInstructions.js';
test('tracking notices distinguish connectivity from detection and describe recovery',()=>{
 assert.match(trackingNotice({camera:'loading'}),/connecting/i);
 assert.match(trackingNotice({camera:'ready',tracking:'loading'}),/preparing/i);
 assert.match(trackingNotice({camera:'ready',tracking:'tracking'}),/active/i);
 assert.match(trackingNotice({camera:'ready',tracking:'searching',seen:true}),/lost/i);
 assert.match(trackingNotice({camera:'error',error:'Camera disconnected'}),/disconnected/i);
 assert.match(trackingNotice({camera:'error',error:'Permission denied'}),/permission/i);
 assert.match(trackingNotice({assisted:true}),/touch ready/i);
});
test('FLOW progress display follows the accepted tracing direction',()=>{
 const path=shapePath(0,{x:.1,y:.2,width:.8,height:.6},1000,700),e=createTraceEvaluator(path,1000,700);
 for(let i=100;i>=80;i--)e.sample({...path[i],active:true,timestamp:(100-i)*33,sequence:100-i,source:'hand'});
 assert.ok(e.progress>.15);assert.deepEqual(e.displayPath[0],path.at(-1));
});
test('FLOW short interruption preserves earned progress without inventing trace travel or accuracy',()=>{
 const path=shapePath(0,{x:.1,y:.2,width:.8,height:.6},1000,700),e=createTraceEvaluator(path,1000,700);
 for(let i=0;i<=35;i++)e.sample({...path[i],active:true,timestamp:i*33,sequence:i,source:'hand'});
 const progress=e.progress;e.sample(null);assert.equal(e.progress,progress);
 const r=e.sample({...path[70],active:true,timestamp:1300,sequence:70,source:'hand',reset:true});
 assert.equal(e.progress,progress);assert.equal(r.complete,false);
});
test('SLASH camera-frame readiness remains understandable when hand tracking is unavailable',()=>{
 assert.match(trackingNotice({camera:'ready',tracking:'error',frameMotion:true}),/camera motion ready/i);
 assert.match(instructionReadiness('SLASH',false,true,{status:'ready',trackingStatus:'loading'}),/camera motion/i);
 assert.match(instructionReadiness('SLASH',false,true,{status:'ready',trackingError:'Unavailable'}),/camera motion/i);
});
test('LAUNCH assisted instructions describe pressing and release instead of a fist',()=>{
 assert.match(getGameInstructions('LAUNCH',true).subtitle,/PRESS.*RELEASE/);
 assert.match(getGameInstructions('LAUNCH',false).subtitle,/CLOSE FIST.*OPEN HAND/);
});

test('tracking recovery tells body and hand users how to return into frame',()=>{
 assert.match(trackingNotice({camera:'ready',tracking:'searching',seen:true,body:true}),/step back/);
 assert.match(trackingNotice({camera:'ready',tracking:'searching',seen:true}),/raise your hand/);
 assert.match(trackingNotice({camera:'ready',tracking:'loading',body:true}),/body tracking/);
});
