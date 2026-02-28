/*
This component renders the shared cinematic backdrop treatment used by multiple
scene kits. We keep it separate so depth, gradient, and texture behavior stay
consistent across the visual system.
*/

import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import type { StyleTokens } from '../../schemas/index.js';

interface BackdropProps {
  style: StyleTokens;
  durationInFrames: number;
}

export function Backdrop({ style, durationInFrames }: BackdropProps): React.JSX.Element {
  const frame = useCurrentFrame();

  // Subtle breathing opacity gives the frame life without turning into visual noise.
  const gradientBreath = interpolate(frame, [0, durationInFrames], [0.72, 0.84], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 15% 20%, ${style.palette.primary}26 0%, ${style.palette.background} 48%)`,
      }}
    >
      <AbsoluteFill
        style={{
          opacity: gradientBreath,
          background: `linear-gradient(120deg, ${style.palette.background} 0%, ${style.palette.muted}40 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          opacity: style.texturePolicy.grainOpacity,
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 2px)',
        }}
      />
    </AbsoluteFill>
  );
}
