/*
This file defines the top-level project contract that binds style tokens,
ordered scenes, and render defaults into a single executable unit. It is split
from scene definitions so project-level concerns stay coherent and auditable.
*/

import { z } from 'zod';
import { sceneSpecSchema } from './scene-spec.js';

export const projectSpecSchema = z.object({
  projectId: z.string().regex(/^[a-z0-9-]+$/),
  fps: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  styleTokenRef: z.string().min(1),
  scenes: z.array(sceneSpecSchema).min(1),
  audioRef: z.string().optional(),
  renderPreset: z.enum(['draft', 'production']).default('production'),
});

export type ProjectSpec = z.infer<typeof projectSpecSchema>;
