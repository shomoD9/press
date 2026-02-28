/*
This composition renders exactly one scene in isolation for fast iteration. It
exists separately from the full project composition to keep scene-level preview
and render loops quick and operationally simple.
*/

import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { PressInputProps } from './types.js';
import { findSceneById } from '../compiler/index.js';
import { resolveSceneComponent } from '../scenes/registry.js';

export function SceneComposition({ project, styleTokens, sceneId }: PressInputProps): React.JSX.Element {
  const selectedScene = sceneId ? findSceneById(project, sceneId) : project.scenes[0];

  if (!selectedScene) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: '#111827',
          color: '#F8FAFC',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'sans-serif',
          fontSize: 48,
        }}
      >
        Requested scene was not found.
      </AbsoluteFill>
    );
  }

  const SceneComponent = resolveSceneComponent(selectedScene.treatmentType);

  return (
    <AbsoluteFill>
      <SceneComponent scene={selectedScene} style={styleTokens} fps={project.fps} />
    </AbsoluteFill>
  );
}
