import { createRoundClock } from './roundClock.js';
export const SLASH_DURATION = 120;
export const SLASH_COUNTDOWN = 3;
const intervals = [1.8, 1.2, .8, .45, .35];
const caps = [3, 5, 7, 8, 8];

export function slashDifficulty(progress) {
  const position = Math.max(0, Math.min(1, progress)) * 4;
  const index = Math.min(3, Math.floor(position));
  const fraction = position - index;
  const ease = fraction * fraction * (3 - 2 * fraction);
  return {
    interval: intervals[index] + (intervals[index + 1] - intervals[index]) * ease,
    cap: Math.floor(caps[index] + (caps[index + 1] - caps[index]) * ease + 1e-10),
  };
}

export function createSlashGame() {
 const clock=createRoundClock(SLASH_DURATION,SLASH_COUNTDOWN);
 const decorate=state=>({...state,...slashDifficulty(state.progress)});
 return {...clock,...Object.fromEntries(['tick','start','addHits','pause','resume'].map(name=>[name,(...args)=>decorate(clock[name](...args))]))};
}
