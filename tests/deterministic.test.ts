/*
These tests protect seeded randomness guarantees, which are critical for stable
visual outputs across repeated renders of the same spec.
*/

import { seededRandomSequence } from '../engine/motion/index.js';

describe('seededRandomSequence', () => {
  it('returns identical values for the same seed key', () => {
    const first = seededRandomSequence('scene-alpha', 8);
    const second = seededRandomSequence('scene-alpha', 8);

    expect(second).toEqual(first);
  });

  it('returns different values for different seed keys', () => {
    const first = seededRandomSequence('scene-alpha', 8);
    const second = seededRandomSequence('scene-beta', 8);

    expect(second).not.toEqual(first);
  });
});
