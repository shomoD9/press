/*
This file defines the visual constitution for a Press project. It exists as a
separate module so color, typography, spacing, and motion defaults can be
validated once and then reused consistently by every scene kit.
*/

import { z } from 'zod';

// We treat color values as hex strings in V1 so token validation stays strict.
const hexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Expected a hex color like #0F172A.');

export const paletteSchema = z.object({
  background: hexColor,
  foreground: hexColor,
  primary: hexColor,
  accent: hexColor,
  muted: hexColor,
});

export const typographySchema = z.object({
  displayFamily: z.string().min(1),
  bodyFamily: z.string().min(1),
  weightRegular: z.number().int().min(100).max(900),
  weightBold: z.number().int().min(100).max(900),
  trackingTight: z.number(),
  trackingNormal: z.number(),
});

export const motionProfileSchema = z.object({
  enterDurationFrames: z.number().int().min(1),
  exitDurationFrames: z.number().int().min(1),
  springDamping: z.number().min(1),
  springStiffness: z.number().min(1),
  cameraMaxVelocityPerFrame: z.number().positive(),
});

export const styleTokensSchema = z.object({
  palette: paletteSchema,
  typography: typographySchema,
  spacingScale: z.object({
    xs: z.number().positive(),
    sm: z.number().positive(),
    md: z.number().positive(),
    lg: z.number().positive(),
    xl: z.number().positive(),
  }),
  motionProfile: motionProfileSchema,
  texturePolicy: z.object({
    grainOpacity: z.number().min(0).max(1),
    vignetteStrength: z.number().min(0).max(1),
    allowGradients: z.boolean(),
  }),
  contrastRules: z.object({
    minTextContrastRatio: z.number().min(1),
  }),
});

export type StyleTokens = z.infer<typeof styleTokensSchema>;
