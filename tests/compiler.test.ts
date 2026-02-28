/*
These tests verify compiler timeline math so scene sequencing remains deterministic
and frame offsets cannot drift silently over time.
*/

import demoProject from '../artifacts/projects/demo-v1/project.spec.json';
import { compileProject } from '../engine/compiler/index.js';

describe('compileProject', () => {
  it('produces cumulative start/end frame offsets', () => {
    const compiled = compileProject(demoProject);

    expect(compiled.scenes[0].startFrame).toBe(0);
    expect(compiled.scenes[0].endFrame).toBe(demoProject.scenes[0].durationFrames);
    expect(compiled.scenes[1].startFrame).toBe(demoProject.scenes[0].durationFrames);

    const durationSum = demoProject.scenes.reduce((total, scene) => total + scene.durationFrames, 0);
    expect(compiled.totalDurationInFrames).toBe(durationSum);
  });
});
