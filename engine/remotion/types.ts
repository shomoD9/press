/*
This file defines the input props contract passed into Remotion compositions from
preview and render commands. It is isolated so CLI and composition layers share
one source of truth for cross-process serialization.
*/

import type { ProjectSpec, StyleTokens } from '../../schemas/index.js';

export interface PressInputProps extends Record<string, unknown> {
  project: ProjectSpec;
  styleTokens: StyleTokens;
  sceneId?: string;
}
