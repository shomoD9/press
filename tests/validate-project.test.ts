/*
These tests verify that project validation catches malformed artifacts before any
rendering work begins. They live in a dedicated file so schema behavior remains
clear and regression-resistant.
*/

import demoProject from '../artifacts/projects/demo-v1/project.spec.json';
import demoStyle from '../artifacts/projects/demo-v1/style.tokens.json';
import { validateProjectArtifacts } from '../schemas/index.js';

describe('validateProjectArtifacts', () => {
  it('accepts the bundled demo artifacts', () => {
    const result = validateProjectArtifacts(demoProject, demoStyle);

    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('rejects overlapping beat ranges', () => {
    const mutated = structuredClone(demoProject);

    // We force overlap with the previous scene to ensure range checks trigger.
    mutated.scenes[1].beatRange.start = mutated.scenes[0].beatRange.end;

    const result = validateProjectArtifacts(mutated, demoStyle);

    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes('Beat range overlap'))).toBe(true);
  });
});
