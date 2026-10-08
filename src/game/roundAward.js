// Commit mode-specific score only if the same clock instant accepts its count.
export function awardRoundHit(clock,now,count,commit) {
  const state=clock.tick(now);
  if(state.phase!=='playing'||state.paused||!Number.isInteger(count)||count<=0)return false;
  commit?.(state);clock.addHits(count,now);return true;
}
