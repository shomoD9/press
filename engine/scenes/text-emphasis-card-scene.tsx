/*
This scene kit produces centered emphasis cards for rhetorical anchors such as
thesis conclusions and key claims. It lives separately because these beats need
restrained, editorial timing rather than dense visual choreography.
*/

import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import type { SceneRenderProps } from './types.js';
import { Backdrop } from '../../scene-kits/common/backdrop.js';
import { TypographyBlock } from '../../scene-kits/common/typography-block.js';

export function TextEmphasisCardScene({ scene, style }: SceneRenderProps): React.JSX.Element {
  const frame = useCurrentFrame();

  // We hold this composition calmer than other scenes so language has gravity.
  const opacity = interpolate(frame, [0, 20, scene.durationFrames - 16, scene.durationFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <Backdrop style={style} durationInFrames={scene.durationFrames} />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          opacity,
          paddingLeft: 120,
          paddingRight: 120,
        }}
      >
        <TypographyBlock
          style={style}
          headline={scene.textPlan.headline ?? scene.intent}
          subline={scene.textPlan.subline}
          align="center"
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
