// All times are monotonic milliseconds. No frame-count or renderer clock owns game time.
export function createRoundClock(duration = 120, countdown = 3) {
  let startedAt = null, pausedAt = null, pauseReason = '', count = 0, phase = 'ready';
  let latestTime = 0;
  function tick(now) {
    latestTime = Math.max(latestTime, Number.isFinite(now) ? now : latestTime);
    const total = startedAt === null ? 0 : Math.max(0, ((pausedAt ?? latestTime) - startedAt) / 1000);
    if (startedAt !== null) phase = total < countdown ? 'countdown' : total < countdown + duration ? 'playing' : 'results';
    const elapsed = Math.max(0, Math.min(duration, total - countdown));
    return { phase, paused: pausedAt !== null, pauseReason, count, elapsed,
      remaining: duration - elapsed, seconds: Math.ceil(duration - elapsed),
      countdown: phase === 'countdown' ? Math.ceil(countdown - total) : 0,
      progress: elapsed / duration };
  }
  return {
    tick,
    start(now) {
      if (phase !== 'ready' && phase !== 'results') return tick(now);
      latestTime = now; startedAt = now; pausedAt = null; pauseReason = ''; count = 0;
      return tick(now);
    },
    addHits(hits, now) {
      const state = tick(now);
      if (state.phase === 'playing' && !state.paused && Number.isInteger(hits) && hits > 0) count += hits;
      return tick(now);
    },
    pause(now, reason) {
      const state = tick(now);
      if (!state.paused && (state.phase === 'playing' || state.phase === 'countdown')) { pausedAt = latestTime; pauseReason = reason; }
      return tick(now);
    },
    resume(now) {
      tick(now);
      if (pausedAt !== null) { startedAt += latestTime - pausedAt; pausedAt = null; pauseReason = ''; }
      return tick(now);
    },
    reset() { startedAt = pausedAt = null; pauseReason = ''; count = 0; phase = 'ready'; latestTime = 0; },
  };
}
