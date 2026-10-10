/** Serializes primary tracking and optional pose. No camera or animation loop is owned here. */
export function createBodyTrackingBudget({ enabled = false, supported = false, reserveMs = 4 } = {}) {
  let owner = null, started = 0, cadenceBlocked = false, lastPoseMs = null;
  const reason = () => !enabled ? 'disabled' : !supported ? 'unsupported' : cadenceBlocked ? 'primary-cadence' : null;
  return Object.freeze({
    acquire(task, now, deadline, estimatedMs) {
      if (owner || !Number.isFinite(now) || !['hand', 'segmentation', 'pose'].includes(task)) return false;
      if (task === 'pose' && (reason() || !Number.isFinite(deadline) || !Number.isFinite(estimatedMs) || estimatedMs <= 0 || now + estimatedMs + reserveMs > deadline)) return false;
      owner = task; started = now; return true;
    },
    release(task, now) {
      if (owner !== task) return false;
      if (task === 'pose' && Number.isFinite(now)) lastPoseMs = Math.max(0, now - started);
      owner = null; return true;
    },
    setCadence(baselineHz, currentHz) {
      if (Number.isFinite(baselineHz) && baselineHz > 0 && Number.isFinite(currentHz) && currentHz < baselineHz * .9) cadenceBlocked = true;
    },
    get diagnostics() {
      return Object.freeze({ enabled, supported, reason: reason(), busy: owner, lastPoseMs, combinedMaskReplacement: false });
    },
  });
}
