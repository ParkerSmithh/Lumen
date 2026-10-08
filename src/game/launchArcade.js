import { sweptTargetHit } from './targetGeometry.js';

// Axis values are captured before the solver's wall correction and reflection.
export function isBankBounce({ previous, position, velocity, limit, radius, held = false }) {
  if (held || ![previous, position, velocity, limit, radius].every(Number.isFinite) || radius < 0 || limit < radius) return false;
  return Math.abs(previous) <= limit - radius + 1e-6 &&
    Math.abs(position) + radius > limit &&
    velocity * Math.sign(position) >= .01;
}

// Time arguments are active simulation seconds, so pausing does not age a bank.
export function createLaunchArcade() {
  let score = 0, count = 0, label = null, generation = 0;
  const slots = new Map(), scored = new Set();
  const validSlot = slot => Number.isInteger(slot) && slot >= 0;
  const state = (slot, token) => {
    const value = slots.get(slot);
    return value && (token === undefined || token === value.generation) ? value : null;
  };
  const snapshot = () => ({ score, count, label });
  return {
    snapshot,
    reset() { score = count = 0; label = null; slots.clear(); scored.clear(); },
    created(slot) {
      if (!validSlot(slot)) return undefined;
      const token = ++generation;
      slots.set(slot, { generation: token, bounce: null });
      return token;
    },
    grabbed(slot, token) { const value = state(slot, token); if (value) value.bounce = null; },
    wallBounce(slot, elapsed, token) {
      const value = state(slot, token);
      if (value && Number.isFinite(elapsed) && elapsed >= 0 && (value.bounce === null || elapsed >= value.bounce)) value.bounce = elapsed;
    },
    hit(event, elapsed) {
      const value = event && state(event.slot, event.generation);
      if (!value || !Number.isFinite(elapsed) || elapsed < 0 || event.id == null ||
          (typeof event.id === 'number' && !Number.isFinite(event.id)) ||
          !['normal', 'bonus'].includes(event.type) || scored.has(event.id)) return snapshot();
      scored.add(event.id);
      const age = value.bounce === null ? Infinity : elapsed - value.bounce;
      const bank = age >= 0 && age <= 3;
      score += (event.type === 'bonus' ? 200 : 100) + (bank ? 100 : 0);
      count++;
      label = bank ? 'BANK +100' : event.type === 'bonus' ? 'BONUS +200' : null;
      value.bounce = null;
      return snapshot();
    },
  };
}

export function targetBehavior(serial, elapsed, reducedMotion = false) {
  const eligible = Number.isInteger(serial) && serial > 0;
  const bonus = eligible && serial % 6 === 0 && elapsed >= 20;
  return {
    type: bonus ? 'bonus' : 'normal',
    moving: !bonus && !reducedMotion && eligible && serial % 3 === 0 && elapsed >= 45,
    duration: bonus ? 8 : Infinity,
    radiusMultiplier: bonus ? 1.35 : 1,
  };
}

// Target base x/y/z remain fixed; callers retain these centers for relative sweeps.
export function movingTargetPosition(target, physicsSeconds, dt = 0) {
  const amplitude = Math.min(.6, Math.max(0, target.motionAmplitude ?? .6));
  const center = time => {
    const offset = target.moving ? amplitude * Math.sin((time - (target.motionStart ?? 0)) * Math.PI / 4) : 0;
    const x = Math.max(target.minX ?? -Infinity, Math.min(target.maxX ?? Infinity, target.x + offset));
    return { x, y: target.y, z: target.z };
  };
  return { previous: center(physicsSeconds - Math.max(0, dt)), current: center(physicsSeconds) };
}

export function relativeTargetHit(a, b, ballRadius, previousTarget, currentTarget) {
  const relative = (point, center) => ({ x: point.x - center.x, y: point.y - center.y, z: point.z - center.z });
  return sweptTargetHit(relative(a, previousTarget), relative(b, currentTarget), ballRadius, {
    x: 0, y: 0, z: 0, radius: currentTarget.radius, halfDepth: currentTarget.halfDepth,
  });
}
