import { slashDifficulty, SLASH_DURATION } from '../game/slashGame.js';

// Kept as a compatibility entry point for tools; the game owns the live clock.
export const slashProgression = elapsed => slashDifficulty(elapsed / SLASH_DURATION);
