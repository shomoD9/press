/*
This scene kit handles abstract metaphor beats where shape, rhythm, and motion
carry meaning more than literal icons. It is isolated because it relies on a
seeded geometry system that should stay deterministic and reusable.
*/

import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import type { SceneRenderProps } from './types.js';
import { Backdrop } from '../../scene-kits/common/backdrop.js';
import { seededRandomSequence } from '../motion/index.js';

interface ShapeModel {
  size: number;
  x: number;
  y: number;
  rotateStart: number;
  rotateEnd: number;
}

export function AbstractGeometricScene({ scene, style }: SceneRenderProps): React.JSX.Element {
  const frame = useCurrentFrame();

  const shapes = useMemo<ShapeModel[]>(() => {
    const values = seededRandomSequence(`${scene.sceneId}-abstract`, 75);
    const models: ShapeModel[] = [];

    for (let index = 0; index < 15; index += 1) {
      models.push({
        size: 120 + values[index * 5] * 220,
        x: 8 + values[index * 5 + 1] * 84,
        y: 10 + values[index * 5 + 2] * 80,
        rotateStart: values[index * 5 + 3] * -45,
        rotateEnd: values[index * 5 + 4] * 45,
      });
    }

    return models;
  }, [scene.sceneId]);

  const sceneProgress = interpolate(frame, [0, scene.durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <Backdrop style={style} durationInFrames={scene.durationFrames} />
      <AbsoluteFill>
        {shapes.map((shape, index) => {
          const drift = interpolate(sceneProgress, [0, 1], [-14, 14]);
          const rotate = interpolate(sceneProgress, [0, 1], [shape.rotateStart, shape.rotateEnd]);

          return (
            <div
              key={`shape-${index}`}
              style={{
                position: 'absolute',
                left: `${shape.x}%`,
                top: `${shape.y}%`,
                width: shape.size,
                height: shape.size,
                borderRadius: index % 3 === 0 ? '50%' : 18,
                border: `1px solid ${style.palette.muted}`,
                transform: `translate3d(${drift}px, ${-drift}px, 0) rotate(${rotate}deg)`,
                opacity: 0.25 + (index % 5) * 0.1,
                background: `linear-gradient(145deg, ${style.palette.primary}20, transparent)`,
              }}
            />
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
