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

// All times are monotonic milliseconds. No frame-count or renderer clock owns game time.
export function createSlashGame() {
  let startedAt = null, pausedAt = null, pauseReason = '', count = 0, phase = 'ready';
  let latestTime = 0;
  function tick(now) {
    latestTime = Math.max(latestTime, Number.isFinite(now) ? now : latestTime);
    const total = startedAt === null ? 0 : Math.max(0, ((pausedAt ?? latestTime) - startedAt) / 1000);
    if (startedAt !== null) phase = total < SLASH_COUNTDOWN ? 'countdown' : total < SLASH_COUNTDOWN + SLASH_DURATION ? 'playing' : 'results';
    const elapsed = Math.max(0, Math.min(SLASH_DURATION, total - SLASH_COUNTDOWN));
    return { phase, paused: pausedAt !== null, pauseReason, count, elapsed,
      remaining: SLASH_DURATION - elapsed, seconds: Math.ceil(SLASH_DURATION - elapsed),
      countdown: phase === 'countdown' ? Math.ceil(SLASH_COUNTDOWN - total) : 0,
      progress: elapsed / SLASH_DURATION, ...slashDifficulty(elapsed / SLASH_DURATION) };
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
