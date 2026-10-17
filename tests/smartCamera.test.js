import test from 'node:test';
import assert from 'node:assert/strict';
import {createCameraController} from '../src/camera/cameraController.js';

const tick=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
function fixture({saved,permission='granted',storageThrows=false,writeThrows=false,queryThrows=false,mediaMissing=false,delayed=false,play,visible=()=>true,permissionWait=false}={}){
 const values=new Map(saved?[['lumen.camera.v1',JSON.stringify(saved)]]:[]),requests=[],streams=[],waiters=[];
 const permissionListeners=new Set(),deviceListeners=new Set();let clock=0,live=0,peak=0;
 const permissionStatus={state:permission,addEventListener:(type,fn)=>permissionListeners.add(fn),removeEventListener:(type,fn)=>permissionListeners.delete(fn)};
 const video={srcObject:null,play:play||(()=>Promise.resolve()),pause(){}};
 const devices=[{kind:'videoinput',deviceId:'a',label:'Desk camera',groupId:'private'},{kind:'videoinput',deviceId:'b',label:'USB camera'}];
 const media={enumerateDevices:async()=>devices,getUserMedia:constraints=>{requests.push(constraints);const make=()=>{live++;peak=Math.max(peak,live);let ended=false;const track={readyState:'live',getSettings:()=>({deviceId:constraints.video.deviceId?.exact||'a',facingMode:constraints.video.facingMode||'user'}),stop(){if(!ended){ended=true;live--;this.readyState='ended';}},onended:null};const stream={getTracks:()=>[track],getVideoTracks:()=>[track]};streams.push(stream);return stream;};return delayed?new Promise(resolve=>waiters.push(()=>resolve(make()))):Promise.resolve(make());},addEventListener:(type,fn)=>deviceListeners.add(fn),removeEventListener:(type,fn)=>deviceListeners.delete(fn)};
 const storage=()=>{if(storageThrows)throw Error('storage blocked');return {getItem:k=>values.get(k)||null,setItem:(k,v)=>{if(writeThrows)throw Error('write blocked');values.set(k,v);},removeItem:k=>{if(writeThrows)throw Error('write blocked');values.delete(k);}};};
 const timers=new Map();let serial=0;
 const c=createCameraController({getVideo:()=>video,media:mediaMissing?null:media,permissions:{query:async()=>{if(queryThrows)throw Error('unsupported');if(permissionWait)await new Promise(resolve=>waiters.push(resolve));return permissionStatus;}},storage,now:()=>clock+=5,visible,secure:()=>true,setTimer:fn=>{timers.set(++serial,fn);return serial;},clearTimer:id=>timers.delete(id)});
 return {c,media,values,requests,streams,waiters,video,devices,permissionStatus,permissionListeners,deviceListeners,timers,get live(){return live;},get peak(){return peak;},async permission(state){permissionStatus.state=state;for(const fn of permissionListeners)fn();await tick();},async remove(){devices.splice(0,1);for(const fn of deviceListeners)fn();await tick();},async end(){const t=streams.at(-1).getVideoTracks()[0];t.stop();t.onended?.();await tick();}};
}
const remembered={version:1,remember:true,autoReconnect:true,deviceId:'b',facingMode:'user'};

test('new defaults are on but even granted permission cannot start first capture',async()=>{
 const f=fixture();assert.equal(f.c.getSnapshot().prefs.remember,true);assert.equal(f.c.getSnapshot().prefs.autoReconnect,true);assert.equal(f.c.getSnapshot().prefs.startupConfirmed,false);assert.equal(f.c.getSnapshot().status,'idle');await f.c.initialize();assert.equal(f.requests.length,0);f.c.dispose();
});
test('manual connection confirms default return behavior and restores the actual device',async()=>{
 const f=fixture();await f.c.initialize();await f.c.start();const saved=JSON.parse(f.values.get('lumen.camera.v1'));assert.equal(saved.startupConfirmed,true);assert.equal(saved.deviceId,'a');f.c.dispose();const g=fixture({saved});await g.c.initialize();assert.equal(g.requests.length,1);assert.equal(g.requests[0].video.deviceId.exact,'a');g.c.dispose();
});
test('saving settings before the first successful connection does not authorize first capture',async()=>{
 const f=fixture();await f.c.initialize();f.c.setPreferences({autoReconnect:false});f.c.setPreferences({autoReconnect:true});const saved=JSON.parse(f.values.get('lumen.camera.v1'));f.c.dispose();const g=fixture({saved});await g.c.initialize();assert.equal(g.requests.length,0);assert.equal(g.c.getSnapshot().prefs.autoReconnect,true);g.c.dispose();
});
test('forget and explicit off remain off on a new controller despite on defaults',async()=>{
 for(const action of ['forget','off']){const f=fixture();await f.c.initialize();await f.c.start();if(action==='forget')f.c.forget();else f.c.setPreferences({remember:false});const saved=JSON.parse(f.values.get('lumen.camera.v1'));assert.equal(saved.deviceId,'');assert.equal(saved.startupConfirmed,false);f.c.dispose();const g=fixture({saved});await g.c.initialize();assert.equal(g.c.getSnapshot().prefs.remember,false);assert.equal(g.c.getSnapshot().prefs.autoReconnect,false);assert.equal(g.requests.length,0);g.c.dispose();}
});
test('legacy explicitly enabled preferences still restore without a confirmation field',async()=>{const f=fixture({saved:remembered});await f.c.initialize();assert.equal(f.requests.length,1);assert.equal(f.c.getSnapshot().prefs.startupConfirmed,true);f.c.dispose();});
test('preference edits during failed playback cannot confirm automatic first capture',async()=>{
 let reject;const f=fixture({play:()=>new Promise((resolve,fail)=>reject=fail)});await f.c.initialize();const pending=f.c.start();await tick();f.c.setPreferences({autoReconnect:true});reject(Error('Playback refused'));await pending;const saved=JSON.parse(f.values.get('lumen.camera.v1'));assert.equal(saved.startupConfirmed,false);f.c.dispose();const g=fixture({saved});await g.c.initialize();assert.equal(g.requests.length,0);g.c.dispose();
});

test('first visit never requests capture; explicit connection owns and releases one stream',async()=>{
 const f=fixture();await f.c.initialize();assert.equal(f.requests.length,0);await f.c.start();assert.equal(f.c.getSnapshot().status,'ready');assert.equal(f.live,1);assert.equal(f.values.size,1);f.c.stop();assert.equal(f.live,0);assert.equal(f.video.srcObject,null);f.c.dispose();assert.equal(f.permissionListeners.size,0);assert.equal(f.deviceListeners.size,0);
});
test('remember saves only successful selection and minimal opt-in data; a new controller restores it',async()=>{
 const f=fixture();await f.c.initialize();await f.c.start();f.c.setPreferences({remember:true,autoReconnect:true});await f.c.selectCamera('b');
 assert.deepEqual(JSON.parse(f.values.get('lumen.camera.v1')),{...remembered,startupConfirmed:true});f.c.dispose();
 const g=fixture({saved:JSON.parse(f.values.get('lumen.camera.v1'))});await g.c.initialize();assert.equal(g.requests.length,1);assert.equal(g.requests[0].video.deviceId.exact,'b');assert.equal(g.c.getSnapshot().status,'ready');g.c.dispose();
});
for(const state of ['prompt','denied'])test(`automatic return with ${state} permission never prompts`,async()=>{const f=fixture({saved:remembered,permission:state});await f.c.initialize();assert.equal(f.requests.length,0);assert.match(f.c.getSnapshot().detail,/reconnect|permission/i);f.c.dispose();});
test('unsupported permission query and hidden pages use manual return action',async()=>{for(const options of [{queryThrows:true},{visible:()=>false}]){const f=fixture({saved:remembered,...options});await f.c.initialize();assert.equal(f.requests.length,0);await f.c.start();assert.equal(f.requests.length,1);f.c.dispose();}});
test('missing saved device never silently requests another camera',async()=>{const f=fixture({saved:{...remembered,deviceId:'gone'}});await f.c.initialize();assert.equal(f.requests.length,0);assert.equal(f.c.getSnapshot().status,'error');assert.match(f.c.getSnapshot().error,/saved camera/i);await f.c.selectCamera('a');assert.equal(f.requests[0].video.deviceId.exact,'a');f.c.dispose();});
test('manual disconnect suppresses automatic return and recovery across reinitialization',async()=>{const f=fixture({saved:remembered});await f.c.initialize();f.c.stop();await f.c.initialize();assert.equal(f.requests.length,1);assert.equal(f.live,0);await f.c.start();assert.equal(f.requests.length,2);assert.equal(f.live,1);f.c.dispose();});
test('auto disabled or remembering disabled never reconnects; forget clears only camera preference',async()=>{
 for(const prefs of [{...remembered,autoReconnect:false},{...remembered,remember:false}]){const f=fixture({saved:prefs});await f.c.initialize();assert.equal(f.requests.length,0);f.c.dispose();}
 const f=fixture({saved:remembered});f.values.set('unrelated','keep');await f.c.initialize();f.c.forget();assert.equal(JSON.parse(f.values.get('lumen.camera.v1')).remember,false);assert.equal(JSON.parse(f.values.get('lumen.camera.v1')).deviceId,'');assert.equal(f.values.get('unrelated'),'keep');assert.equal(f.c.getSnapshot().prefs.autoReconnect,false);assert.equal(f.live,1);f.c.setPreferences({remember:true,autoReconnect:true});f.c.setPreferences({remember:false});assert.equal(JSON.parse(f.values.get('lumen.camera.v1')).remember,false);assert.equal(JSON.parse(f.values.get('lumen.camera.v1')).deviceId,'');assert.equal(f.c.getSnapshot().prefs.autoReconnect,false);f.c.dispose();
});
test('corrupted and unavailable storage keep manual capture usable',async()=>{
 for(const options of [{saved:{...remembered,remember:'yes',deviceId:5}},{storageThrows:true}]){const f=fixture(options);await f.c.initialize();assert.equal(f.requests.length,0);await f.c.start();f.c.setPreferences({remember:true,autoReconnect:true});assert.equal(f.c.getSnapshot().status,'ready');if(options.storageThrows)assert.equal(f.c.getSnapshot().storageAvailable,false);f.c.dispose();}
 const f=fixture();f.values.set('lumen.camera.v1','{bad');await f.c.initialize();assert.equal(f.requests.length,0);f.c.dispose();
});
test('concurrent starts coalesce; cancellation stops late streams and serializes device switching',async()=>{
 const f=fixture({delayed:true});await f.c.initialize();const a=f.c.start(),b=f.c.start();await tick();assert.equal(f.requests.length,1);const change=f.c.selectCamera('b');await tick();assert.equal(f.requests.length,1);f.waiters.shift()();await tick();assert.equal(f.requests.length,2);assert.equal(f.live,0);f.waiters.shift()();await Promise.all([a,b,change]);assert.equal(f.live,1);assert.equal(f.peak,1);assert.equal(f.requests[1].video.deviceId.exact,'b');f.c.dispose();assert.equal(f.live,0);
});
test('dispose while permission query or capture is pending cannot auto-start or leak',async()=>{
 const f=fixture({delayed:true});await f.c.initialize();const p=f.c.start();await tick();f.c.dispose();f.waiters.shift()();await p;assert.equal(f.live,0);assert.equal(f.c.getSnapshot().status,'idle');
});
for(const revokedState of ['denied','prompt'])test(`permission revocation to ${revokedState} releases capture and never starts recovery`,async()=>{const f=fixture({saved:remembered});await f.c.initialize();await f.permission(revokedState);assert.equal(f.live,0);assert.equal(f.c.getSnapshot().status,'error');assert.match(f.c.getSnapshot().error,/permission/i);assert.equal(f.requests.length,1);f.c.dispose();});
test('hardware removal refreshes choices without switching to an unintended camera',async()=>{const f=fixture({saved:{...remembered,deviceId:'a'}});await f.c.initialize();await f.remove();await f.end();assert.equal(f.live,0);assert.equal(f.requests.length,1);assert.equal(f.c.getSnapshot().devices.length,1);assert.match(f.c.getSnapshot().error,/camera/i);f.c.dispose();});
test('unexpected end makes at most one automatic recovery attempt until manual reconnect',async()=>{const f=fixture({saved:remembered});await f.c.initialize();await f.end();assert.equal(f.requests.length,2);assert.equal(f.c.getSnapshot().status,'ready');assert.ok(f.c.getSnapshot().metrics.recoveryMs>=0);await f.end();assert.equal(f.requests.length,2);assert.equal(f.live,0);assert.equal(f.c.getSnapshot().status,'error');f.c.dispose();});
test('media APIs unavailable fail clearly and playback errors release tracks',async()=>{const f=fixture({mediaMissing:true});await f.c.initialize();await f.c.start();assert.equal(f.c.getSnapshot().status,'error');f.c.dispose();const g=fixture({play:()=>Promise.reject(Error('play blocked'))});await g.c.initialize();await g.c.start();assert.equal(g.live,0);assert.equal(g.c.getSnapshot().status,'error');g.c.dispose();});
test('timeout releases an acquired stream and ignores late playback',async()=>{let finish;const f=fixture({play:()=>new Promise(r=>finish=r)});await f.c.initialize();const p=f.c.start();await tick();for(const fn of f.timers.values())fn();await p;assert.equal(f.live,0);assert.equal(f.c.getSnapshot().status,'error');finish();await tick();assert.equal(f.c.getSnapshot().status,'error');f.c.dispose();});
test('facing selection is transient without remembering and does not overlap streams',async()=>{const f=fixture();await f.c.initialize();f.c.setPreferences({remember:false});await f.c.start();await f.c.selectCamera('', 'environment');assert.equal(f.requests.at(-1).video.facingMode,'environment');assert.equal(f.values.size,1);assert.equal(f.peak,1);f.c.dispose();});
test('fifty connect/disconnect cycles leave zero streams and listener counts remain bounded',async()=>{const f=fixture();await f.c.initialize();for(let i=0;i<50;i++){await f.c.start();f.c.stop();}assert.equal(f.requests.length,50);assert.equal(f.peak,1);assert.equal(f.live,0);assert.equal(f.c.getSnapshot().metrics.activeStreams,0);assert.equal(f.permissionListeners.size,1);f.c.dispose();assert.equal(f.timers.size,0);assert.equal(f.deviceListeners.size,0);assert.equal(f.permissionListeners.size,0);});
test('return begins in a checking state to avoid flashing first-visit entry',()=>{const f=fixture({saved:remembered});assert.equal(f.c.getSnapshot().status,'loading');f.c.dispose();});
test('forget and auto opt-out cancel pending permission results without requesting capture',async()=>{
 for(const action of ['forget','disable','dispose']){const f=fixture({saved:remembered,permissionWait:true});const p=f.c.initialize();await tick();if(action==='forget')f.c.forget();else if(action==='disable')f.c.setPreferences({autoReconnect:false});else f.c.dispose();f.waiters.shift()();await p;assert.equal(f.requests.length,0);if(action==='dispose')assert.equal(f.permissionListeners.size,0);f.c.dispose();}
});
test('a timed-out unresolved capture cannot overlap a later retry',async()=>{
 const f=fixture({delayed:true});await f.c.initialize();const a=f.c.start();await tick();for(const fn of [...f.timers.values()])fn();await a;const b=f.c.start();await tick();assert.equal(f.requests.length,1);f.waiters.shift()();await tick();assert.equal(f.requests.length,2);assert.equal(f.live,0);f.waiters.shift()();await b;assert.equal(f.peak,1);f.c.dispose();
});
test('preference edits during a pending switch persist only a successfully selected camera',async()=>{
 const f=fixture({saved:remembered,delayed:true});const init=f.c.initialize();await tick();f.waiters.shift()();await init;const change=f.c.selectCamera('a');await tick();f.c.setPreferences({remember:true,autoReconnect:true});assert.equal(JSON.parse(f.values.get('lumen.camera.v1')).deviceId,'b');f.waiters.shift()();await change;assert.equal(JSON.parse(f.values.get('lumen.camera.v1')).deviceId,'a');f.c.dispose();
});
test('enabling remember during manual startup does not cancel the explicit request',async()=>{const f=fixture({delayed:true});await f.c.initialize();const p=f.c.start();await tick();f.c.setPreferences({remember:true});f.waiters.shift()();await p;assert.equal(f.c.getSnapshot().status,'ready');assert.equal(JSON.parse(f.values.get('lumen.camera.v1')).deviceId,'a');f.c.dispose();});
test('automatic return rechecks visibility after pending permission and capture',async()=>{
 let visible=true;const f=fixture({saved:remembered,permissionWait:true,visible:()=>visible});const p=f.c.initialize();await tick();visible=false;f.waiters.shift()();await p;assert.equal(f.requests.length,0);assert.equal(f.c.getSnapshot().status,'idle');f.c.dispose();
 visible=true;const g=fixture({saved:remembered,delayed:true,visible:()=>visible});const q=g.c.initialize();await tick();visible=false;g.waiters.shift()();await q;assert.equal(g.live,0);assert.equal(g.c.getSnapshot().status,'idle');g.c.dispose();
});
test('remember can be re-enabled after forget using the currently live camera',async()=>{const f=fixture({saved:remembered});await f.c.initialize();f.c.forget();f.c.setPreferences({remember:true,autoReconnect:true});assert.equal(JSON.parse(f.values.get('lumen.camera.v1')).deviceId,'b');assert.equal(f.requests.length,1);f.c.dispose();});
test('repeated selection of the same pending camera cannot roll back the newer selection',async()=>{
 const f=fixture({delayed:true});await f.c.initialize();const a=f.c.selectCamera('b');await tick();const b=f.c.selectCamera('b');await tick();f.waiters.shift()();await tick();assert.equal(f.requests.at(-1).video.deviceId?.exact,'b');f.waiters.shift()();await Promise.all([a,b]);assert.equal(f.c.getSnapshot().prefs.deviceId,'b');f.c.dispose();
});
test('a slow device-list refresh after playable video cannot time out a healthy stream',async()=>{
 const f=fixture();await f.c.initialize();f.media.enumerateDevices=()=>new Promise(()=>{});let completed=false;f.c.start().then(()=>completed=true);await tick();assert.equal(f.c.getSnapshot().status,'ready');assert.equal(completed,true);assert.equal(f.timers.size,0);assert.equal(f.live,1);f.c.dispose();
});
test('actual front-facing selection overrides an unsupported requested rear preference',async()=>{const f=fixture();await f.c.initialize();const capture=f.media.getUserMedia;f.media.getUserMedia=async constraints=>{const stream=await capture(constraints);stream.getVideoTracks()[0].getSettings=()=>({deviceId:'a',facingMode:'user'});return stream;};await f.c.selectCamera('','environment');assert.equal(f.c.getSnapshot().prefs.facingMode,'user');f.c.dispose();});
test('failed preference removal disables auto in memory and reports persistence failure',async()=>{const f=fixture({saved:remembered,writeThrows:true});await f.c.initialize();f.c.setPreferences({remember:false});assert.equal(f.c.getSnapshot().storageAvailable,false);assert.equal(f.c.getSnapshot().prefs.autoReconnect,false);await f.end();assert.equal(f.requests.length,1);assert.equal(f.live,0);f.c.dispose();});
