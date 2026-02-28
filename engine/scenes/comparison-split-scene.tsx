/*
This scene kit presents contrast arguments with a controlled split-screen layout.
We isolate it because comparative rhetoric requires synchronized dual motion and
balanced typography that differs from single-focus scene structures.
*/

import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import type { SceneRenderProps } from './types.js';
import { Backdrop } from '../../scene-kits/common/backdrop.js';

export function ComparisonSplitScene({ scene, style }: SceneRenderProps): React.JSX.Element {
  const frame = useCurrentFrame();
  const divider = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <Backdrop style={style} durationInFrames={scene.durationFrames} />
      <AbsoluteFill style={{ flexDirection: 'row' }}>
        <div
          style={{
            width: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: `1px solid ${style.palette.muted}`,
            opacity: 0.92,
          }}
        >
          <h2
            style={{
              margin: 0,
              color: style.palette.foreground,
              fontFamily: style.typography.displayFamily,
              fontWeight: style.typography.weightBold,
              fontSize: 76,
            }}
          >
            BEFORE
          </h2>
        </div>
        <div
          style={{
            width: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.98,
          }}
        >
          <h2
            style={{
              margin: 0,
              color: style.palette.foreground,
              fontFamily: style.typography.displayFamily,
              fontWeight: style.typography.weightBold,
              fontSize: 76,
            }}
          >
            AFTER
          </h2>
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: 2,
            height: `${divider * 80}%`,
            backgroundColor: style.palette.accent,
            boxShadow: `0 0 22px ${style.palette.accent}`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
