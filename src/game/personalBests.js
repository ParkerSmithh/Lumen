const MODES = ['FLOW', 'SLASH', 'LAUNCH'];
const empty = () => ({ score: 0, count: 0, accuracy: null });
const validInt = value => Number.isSafeInteger(value) && value >= 0;
const sanitize = (value = {}) => ({
  score: validInt(value?.score) ? value.score : 0,
  count: validInt(value?.count) ? value.count : 0,
  accuracy: Number.isFinite(value?.accuracy) && value.accuracy >= 0 && value.accuracy <= 100 && value.count > 0 ? value.accuracy : null,
});
const merge = (a, b) => ({ score: Math.max(a.score,b.score), count: Math.max(a.count,b.count),
  accuracy: a.accuracy === null ? b.accuracy : b.accuracy === null ? a.accuracy : Math.max(a.accuracy,b.accuracy) });

export function createPersonalBests(provider = () => globalThis.localStorage) {
  const memory = new Map();
  function read(mode) {
    if (!MODES.includes(mode)) return empty();
    let stored = empty();
    try {
      const raw = JSON.parse(provider()?.getItem(`lumen.arcade.bests.v1.${mode}`) || 'null');
      if (raw?.version === 1) stored = sanitize(raw.metrics);
    } catch { /* Storage and malformed data are optional, never gameplay failures. */ }
    const best = merge(stored, memory.get(mode) || empty());
    memory.set(mode,best); return { ...best };
  }
  return { read, record(mode, metrics, completed = false) {
    const previous = read(mode);
    if (!completed || !MODES.includes(mode)) return { bests: previous, newBest: false };
    const candidate = sanitize(metrics), bests = merge(previous,candidate);
    const newBest = bests.score > previous.score || bests.count > previous.count ||
      (bests.accuracy !== null && bests.accuracy > (previous.accuracy ?? 0));
    memory.set(mode,bests);
    try { provider()?.setItem(`lumen.arcade.bests.v1.${mode}`, JSON.stringify({version:1,metrics:bests})); } catch {}
    return { bests: { ...bests }, newBest };
  }};
}
export const personalBests = createPersonalBests();
