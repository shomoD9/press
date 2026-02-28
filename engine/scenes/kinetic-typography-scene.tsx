/*
This scene kit handles argument-emphasis moments where language itself is the
visual payload. It is split into its own file because typography timing and
weight require a distinct motion grammar from diagram-oriented scenes.
*/

import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from 'remotion';
import type { SceneRenderProps } from './types.js';
import { Backdrop } from '../../scene-kits/common/backdrop.js';

export function KineticTypographyScene({ scene, style, fps }: SceneRenderProps): React.JSX.Element {
  const frame = useCurrentFrame();
  const enter = spring({
    frame,
    fps,
    config: {
      damping: style.motionProfile.springDamping,
      stiffness: style.motionProfile.springStiffness,
    },
  });

  // We add controlled parallax so text feels dimensional without looking gimmicky.
  const xOffset = interpolate(enter, [0, 1], [72, 0]);
  const opacity = interpolate(frame, [0, style.motionProfile.enterDurationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <Backdrop style={style} durationInFrames={scene.durationFrames} />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          paddingLeft: 140,
          paddingRight: 140,
        }}
      >
        <div
          style={{
            transform: `translate3d(${xOffset}px, 0, 0)`,
            opacity,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: style.typography.displayFamily,
              fontWeight: style.typography.weightBold,
              letterSpacing: `${style.typography.trackingTight}px`,
              lineHeight: 1.08,
              fontSize: 108,
              color: style.palette.foreground,
            }}
          >
            {scene.textPlan.headline ?? scene.intent}
          </h1>
          {scene.textPlan.subline ? (
            <p
              style={{
                marginTop: 28,
                marginBottom: 0,
                fontFamily: style.typography.bodyFamily,
                fontWeight: style.typography.weightRegular,
                letterSpacing: `${style.typography.trackingNormal}px`,
                lineHeight: 1.34,
                fontSize: 36,
                color: style.palette.muted,
                maxWidth: 1000,
              }}
            >
              {scene.textPlan.subline}
            </p>
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
