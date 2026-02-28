/*
This module contains frame-domain math helpers used across scene kits. It is
separate from scene code so timing math stays consistent and testable instead of
being reimplemented differently inside each visual treatment.
*/

export function clamp(value: number, min: number, max: number): number {
  // We clamp all interpolation inputs to avoid accidental overshoot artifacts.
  return Math.min(max, Math.max(min, value));
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function normalizeFrame(frame: number, startFrame: number, endFrame: number): number {
  if (endFrame <= startFrame) {
    // Degenerate ranges should settle to zero progress rather than blow up divisions.
    return 0;
  }

  const rawProgress = (frame - startFrame) / (endFrame - startFrame);
  return clamp(rawProgress, 0, 1);
}

export function easeInOutCubic(progress: number): number {
  const t = clamp(progress, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

export function smoothStep(progress: number): number {
  const t = clamp(progress, 0, 1);
  return t * t * (3 - 2 * t);
}

export function dampedLerp(current: number, target: number, damping: number): number {
  const safeDamping = clamp(damping, 0, 1);

  // This gives us a weighted move toward target without abrupt frame-to-frame jumps.
  return current + (target - current) * safeDamping;
}
