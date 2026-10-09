import { slashDifficulty, SLASH_DURATION } from './slashGame.js';

const POINTS = Object.freeze({ normal: 100, bonus: 300, splitting: 100, child: 100 });
const COMBO_WINDOW = 2;

/** Pure arcade scoring driven exclusively by active gameplay seconds. */
export function createSlashArcade() {
  let score, combo, maxCombo, comboExpiresAt, elapsed;
  const destroyed = new Set();

  function snapshot(nextElapsed = elapsed) {
    if (Number.isFinite(nextElapsed) && nextElapsed >= elapsed) elapsed = nextElapsed;
    if (combo > 0 && elapsed > comboExpiresAt) {
      combo = 0;
      comboExpiresAt = null;
    }
    return { score, combo, maxCombo, comboExpiresAt, overload: elapsed >= 100 };
  }

  function reset() {
    score = combo = maxCombo = elapsed = 0;
    comboExpiresAt = null;
    destroyed.clear();
    return snapshot();
  }

  function record(events, nextElapsed) {
    if (!Number.isFinite(nextElapsed) || nextElapsed < elapsed || nextElapsed < 0) return snapshot();
    snapshot(nextElapsed);
    if (!Array.isArray(events)) return snapshot();
    const valid = events.filter(event => event && Number.isFinite(event.id)
      && Object.hasOwn(POINTS, event.type)).slice().sort((a, b) => a.id - b.id);
    for (const event of valid) {
      if (destroyed.has(event.id)) continue;
      destroyed.add(event.id);
      combo += 1;
      maxCombo = Math.max(maxCombo, combo);
      const multiplier = combo >= 10 ? 4 : combo >= 6 ? 3 : combo >= 3 ? 2 : 1;
      score += POINTS[event.type] * multiplier;
      comboExpiresAt = elapsed + COMBO_WINDOW;
    }
    return snapshot();
  }

  reset();
  return { reset, record, snapshot };
}

/** Normalized round progress; approved ramp through 100 seconds, then OVERLOAD. */
export function slashArcadeDifficulty(progress) {
  const bounded = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const overloadStart = 100 / SLASH_DURATION;
  if (bounded < overloadStart) return { ...slashDifficulty(bounded), overload: false };
  const initial = slashDifficulty(overloadStart);
  const fraction = (bounded - overloadStart) / (1 - overloadStart);
  const ease = fraction * fraction * (3 - 2 * fraction);
  return { interval: initial.interval + (.28 - initial.interval) * ease, cap: Math.min(8, initial.cap), overload: true };
}

/** RNG is a function (or finite sample); capacityAvailable counts reserved free slots. */
export function selectCrystalType({ elapsed = 0, random = Math.random, hasSplitter = false, capacityAvailable = 0 } = {}) {
  if (!Number.isFinite(elapsed) || elapsed < 15) return 'normal';
  const sample = typeof random === 'function' ? random() : random;
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) return 'normal';
  if (sample < .08) return 'bonus';
  if (sample < .18 && !hasSplitter && Number.isFinite(capacityAvailable) && capacityAvailable >= 2) return 'splitting';
  return 'normal';
}

/** CHAOS gameplay density is independent of CALM/WILD/MAX presentation. */
export function chaosSlashDifficulty(progress, storm=false) {
 const bounded=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
 const position=bounded*4,index=Math.min(3,Math.floor(position)),fraction=position-index;
 const ease=fraction*fraction*(3-2*fraction),caps=[3,6,8,10,10];
 return {...slashArcadeDifficulty(bounded),cap:storm?12:Math.floor(caps[index]+(caps[index+1]-caps[index])*ease+1e-10)};
}
/** Active gameplay seconds freeze naturally with the existing round clock. */
export function createFractureStorm(){
 let until=-Infinity,ready=-Infinity,crossed=false,last=0;
 const reset=(combo=0)=>{until=ready=-Infinity;crossed=combo>=10;last=0;};
 return {reset,update(combo,elapsed){
  if(!Number.isFinite(elapsed)||elapsed<last)return {active:last<until,until};
  last=elapsed;if(combo===0)crossed=false;
  if(combo>=10&&!crossed){crossed=true;if(elapsed>=ready){until=elapsed+4;ready=until+8;}}
  return {active:elapsed<until,until};
 }};
}
