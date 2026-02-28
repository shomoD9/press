/*
This root registers Remotion compositions and binds dynamic metadata to input
props. It exists as the entrypoint for both studio preview and programmatic
renderer calls, which keeps composition IDs stable across workflows.
*/

import React from 'react';
import { Composition, staticFile } from 'remotion';
import type { PressInputProps } from './types.js';
import { ProjectComposition } from './project-composition.js';
import { SceneComposition } from './scene-composition.js';
import { compileProject, findSceneById } from '../compiler/index.js';
import { PRESS_COMPOSITION_ID, PRESS_SCENE_COMPOSITION_ID } from './composition-ids.js';
import defaultProject from '../../artifacts/projects/demo-v1/project.spec.json';
import defaultStyleTokens from '../../artifacts/projects/demo-v1/style.tokens.json';

const defaultInputProps: PressInputProps = {
  project: defaultProject,
  styleTokens: defaultStyleTokens,
};

// We touch staticFile to keep Remotion aware of public-asset resolution semantics.
void staticFile('placeholder.txt');

export function RemotionRoot(): React.JSX.Element {
  return (
    <>
      <Composition
        id={PRESS_COMPOSITION_ID}
        component={ProjectComposition}
        defaultProps={defaultInputProps}
        width={defaultProject.width}
        height={defaultProject.height}
        fps={defaultProject.fps}
        durationInFrames={compileProject(defaultProject).totalDurationInFrames}
        calculateMetadata={({ props }) => {
          const input = props as PressInputProps;
          const compiled = compileProject(input.project);

          return {
            width: input.project.width,
            height: input.project.height,
            fps: input.project.fps,
            durationInFrames: compiled.totalDurationInFrames,
          };
        }}
      />
      <Composition
        id={PRESS_SCENE_COMPOSITION_ID}
        component={SceneComposition}
        defaultProps={{ ...defaultInputProps, sceneId: defaultProject.scenes[0]?.sceneId }}
        width={defaultProject.width}
        height={defaultProject.height}
        fps={defaultProject.fps}
        durationInFrames={defaultProject.scenes[0]?.durationFrames ?? 120}
        calculateMetadata={({ props }) => {
          const input = props as PressInputProps;
          const scene = input.sceneId
            ? findSceneById(input.project, input.sceneId)
            : input.project.scenes[0];

          return {
            width: input.project.width,
            height: input.project.height,
            fps: input.project.fps,
            durationInFrames: scene?.durationFrames ?? 120,
          };
        }}
      />
    </>
  );
}
