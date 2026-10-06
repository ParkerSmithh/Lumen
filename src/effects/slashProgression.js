export function slashProgression(elapsed) {
  const progress = Math.min(1, Math.max(0, elapsed / 35));
  const ease = progress * progress * (3 - 2 * progress);
  const interval = progress === 1 ? .4 : 2 - 1.6 * ease;
  const cap = elapsed < 3 ? 1 : elapsed < 7 ? 2 : Math.min(8, 2 + Math.floor(6 * ease));
  return { interval, cap };
}
