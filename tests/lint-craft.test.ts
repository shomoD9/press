/*
These tests validate craft lint behavior so quality policy remains enforceable
and predictable before rendering operations run.
*/

import demoProject from '../artifacts/projects/demo-v1/project.spec.json';
import demoStyle from '../artifacts/projects/demo-v1/style.tokens.json';
import { lintCraft } from '../engine/quality/index.js';

describe('lintCraft', () => {
  it('passes demo artifacts without blocking errors', () => {
    const result = lintCraft(demoProject, demoStyle);

    expect(result.ok).toBe(true);
    expect(result.issues.some((issue) => issue.severity === 'error')).toBe(false);
  });

  it('fails when foreground and background contrast is unsafe', () => {
    const style = structuredClone(demoStyle);

    // We intentionally collapse contrast to verify accessibility gate behavior.
    style.palette.foreground = '#111111';
    style.palette.background = '#121212';

    const result = lintCraft(demoProject, style);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'TEXT_CONTRAST_TOO_LOW')).toBe(true);
  });

  it('fails when focal layer concurrency exceeds scene threshold', () => {
    const project = structuredClone(demoProject);

    // We inject a second high-focal text layer across the full scene to force density overflow.
    project.scenes[0].layers.push({
      id: 'extra-focal-layer',
      kind: 'text',
      startFrame: 0,
      endFrame: project.scenes[0].durationFrames - 1,
      focalWeight: 0.92,
    });

    const result = lintCraft(project, demoStyle);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'FOCAL_DENSITY_EXCEEDED')).toBe(true);
  });
});
