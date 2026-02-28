/*
This file defines the atomic creative contract for one scene. It lives on its
own because scene intent should be expressible and verifiable independently of
project-wide settings or render orchestration logic.
*/

import { z } from 'zod';

export const layerSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(['text', 'shape', 'diagram', 'symbol', 'background']),
    startFrame: z.number().int().min(0),
    endFrame: z.number().int().min(0),
    focalWeight: z.number().min(0).max(1),
  })
  .refine((layer) => layer.endFrame >= layer.startFrame, {
    message: 'Layer endFrame must be greater than or equal to startFrame.',
    path: ['endFrame'],
  });

export const cameraKeyframeSchema = z.object({
  frame: z.number().int().min(0),
  x: z.number(),
  y: z.number(),
  zoom: z.number().positive(),
  rotationDeg: z.number(),
});

export const sceneSpecSchema = z.object({
  sceneId: z.string().regex(/^[a-z0-9-]+$/),
  beatRange: z
    .object({
      start: z.number().int().min(0),
      end: z.number().int().min(0),
    })
    .refine((range) => range.end >= range.start, {
      message: 'beatRange.end must be greater than or equal to beatRange.start.',
      path: ['end'],
    }),
  treatmentType: z.enum([
    'kinetic-typography',
    'concept-network',
    'comparison-split',
    'abstract-geometric',
    'text-emphasis-card',
  ]),
  intent: z.string().min(10),
  visualMetaphor: z.string().min(5),
  durationFrames: z.number().int().positive(),
  layers: z.array(layerSchema).min(1),
  cameraPlan: z.object({
    keyframes: z.array(cameraKeyframeSchema).min(1),
  }),
  timingPlan: z.object({
    minHoldFrames: z.number().int().min(1),
    maxConcurrentFocalElements: z.number().int().min(1),
    accentFrames: z.array(z.number().int().min(0)),
  }),
  textPlan: z.object({
    headline: z.string().optional(),
    subline: z.string().optional(),
    emphasisHoldFrames: z.number().int().min(0).optional(),
  }),
});

export type SceneSpec = z.infer<typeof sceneSpecSchema>;
