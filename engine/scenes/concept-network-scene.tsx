/*
This scene kit visualizes distributed conceptual relationships as animated nodes
and links. It exists separately because network choreography has unique layout
and sequencing logic that should not leak into unrelated treatments.
*/

import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from 'remotion';
import type { SceneRenderProps } from './types.js';
import { Backdrop } from '../../scene-kits/common/backdrop.js';
import { seededRandomSequence } from '../motion/index.js';

interface NodePoint {
  x: number;
  y: number;
  size: number;
}

export function ConceptNetworkScene({ scene, style, fps }: SceneRenderProps): React.JSX.Element {
  const frame = useCurrentFrame();

  const nodes = useMemo<NodePoint[]>(() => {
    const values = seededRandomSequence(scene.sceneId, 90);
    const points: NodePoint[] = [];

    for (let index = 0; index < 30; index += 1) {
      const x = 18 + values[index * 3] * 64;
      const y = 16 + values[index * 3 + 1] * 68;
      const size = 6 + values[index * 3 + 2] * 10;
      points.push({ x, y, size });
    }

    return points;
  }, [scene.sceneId]);

  const reveal = spring({
    frame,
    fps,
    config: {
      damping: style.motionProfile.springDamping,
      stiffness: style.motionProfile.springStiffness,
    },
  });

  return (
    <AbsoluteFill>
      <Backdrop style={style} durationInFrames={scene.durationFrames} />
      <AbsoluteFill>
        <svg width="100%" height="100%" viewBox="0 0 1920 1080">
          {nodes.slice(1).map((node, index) => {
            const source = nodes[Math.max(0, index - 1)];
            const pathReveal = interpolate(reveal, [0, 1], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });

            return (
              <line
                key={`edge-${index}`}
                x1={(source.x / 100) * 1920}
                y1={(source.y / 100) * 1080}
                x2={(source.x + (node.x - source.x) * pathReveal) / 100 * 1920}
                y2={(source.y + (node.y - source.y) * pathReveal) / 100 * 1080}
                stroke={style.palette.muted}
                strokeOpacity={0.42}
                strokeWidth={2}
              />
            );
          })}
          {nodes.map((node, index) => {
            const delay = index * 2;
            const localFrame = Math.max(0, frame - delay);
            const nodePop = spring({
              frame: localFrame,
              fps,
              config: {
                damping: style.motionProfile.springDamping,
                stiffness: style.motionProfile.springStiffness,
              },
            });

            return (
              <circle
                key={`node-${index}`}
                cx={(node.x / 100) * 1920}
                cy={(node.y / 100) * 1080}
                r={node.size * nodePop}
                fill={index % 6 === 0 ? style.palette.accent : style.palette.primary}
                fillOpacity={0.88}
              />
            );
          })}
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
