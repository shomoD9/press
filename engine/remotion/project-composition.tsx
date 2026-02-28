/*
This composition renders a full Press project timeline by sequencing scene kits
according to compiled frame offsets. It is separate from single-scene rendering
so project-wide orchestration stays explicit and testable.
*/

import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import type { PressInputProps } from './types.js';
import { compileProject } from '../compiler/index.js';
import { resolveSceneComponent } from '../scenes/registry.js';

export function ProjectComposition({ project, styleTokens }: PressInputProps): React.JSX.Element {
  const compiled = compileProject(project);

  return (
    <AbsoluteFill>
      {compiled.scenes.map((compiledScene) => {
        const SceneComponent = resolveSceneComponent(compiledScene.scene.treatmentType);

        return (
          <Sequence
            key={compiledScene.scene.sceneId}
            from={compiledScene.startFrame}
            durationInFrames={compiledScene.scene.durationFrames}
          >
            <SceneComponent scene={compiledScene.scene} style={styleTokens} fps={project.fps} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
