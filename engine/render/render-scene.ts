/*
This module performs scene-isolated rendering for rapid iteration loops. It is
separate from full render logic so scene output can stay fast and independent
without carrying unnecessary timeline orchestration overhead.
*/

import path from 'node:path';
import { bundle, renderMedia, selectComposition } from '@remotion/renderer';
import type { ProjectSpec, StyleTokens } from '../../schemas/index.js';
import { findSceneById } from '../compiler/index.js';
import { PRESS_SCENE_COMPOSITION_ID } from '../remotion/composition-ids.js';
import type { PressInputProps } from '../remotion/types.js';
import { ensureRenderDirectory, hashJson, writeRenderManifest } from './render-utils.js';

export interface RenderSceneOptions {
  project: ProjectSpec;
  styleTokens: StyleTokens;
  sceneId: string;
}

export async function renderScene(options: RenderSceneOptions): Promise<{ outputPath: string; manifestPath: string }> {
  const { project, styleTokens, sceneId } = options;
  const scene = findSceneById(project, sceneId);

  if (!scene) {
    throw new Error(`Scene '${sceneId}' was not found in project '${project.projectId}'.`);
  }

  const inputProps: PressInputProps = { project, styleTokens, sceneId };
  const entryPoint = path.resolve('engine/remotion/index.ts');
  const serveUrl = await bundle({
    entryPoint,
  });

  const composition = await selectComposition({
    serveUrl,
    id: PRESS_SCENE_COMPOSITION_ID,
    inputProps,
  });

  const outputDir = await ensureRenderDirectory(project.projectId);
  const outputPath = path.join(outputDir, `${project.projectId}-${sceneId}.mp4`);

  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps,
    crf: 18,
  });

  const specHash = hashJson({ project, styleTokens, sceneId });

  const manifestPath = await writeRenderManifest(outputDir, {
    projectId: project.projectId,
    mode: 'scene',
    compositionId: PRESS_SCENE_COMPOSITION_ID,
    sceneId,
    outputPath,
    renderedAt: new Date().toISOString(),
    fps: project.fps,
    width: project.width,
    height: project.height,
    durationInFrames: scene.durationFrames,
    codec: 'h264',
    specHash,
  });

  return { outputPath, manifestPath };
}
