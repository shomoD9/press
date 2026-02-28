/*
This compiler converts validated project data into timeline-ready metadata. It is
isolated so scene ordering, frame offsets, and composition duration logic remain
explicit and independently testable.
*/

import type { ProjectSpec, SceneSpec } from '../../schemas/index.js';

export interface CompiledScene {
  scene: SceneSpec;
  index: number;
  startFrame: number;
  endFrame: number;
}

export interface CompiledProject {
  project: ProjectSpec;
  scenes: CompiledScene[];
  totalDurationInFrames: number;
}

export function compileProject(project: ProjectSpec): CompiledProject {
  let cursor = 0;

  const scenes = project.scenes.map((scene, index) => {
    const startFrame = cursor;
    const endFrame = cursor + scene.durationFrames;

    // The cursor moves strictly by scene duration so timeline math is deterministic.
    cursor = endFrame;

    return {
      scene,
      index,
      startFrame,
      endFrame,
    } satisfies CompiledScene;
  });

  return {
    project,
    scenes,
    totalDurationInFrames: cursor,
  };
}

export function findSceneById(project: ProjectSpec, sceneId: string): SceneSpec | undefined {
  return project.scenes.find((scene) => scene.sceneId === sceneId);
}
