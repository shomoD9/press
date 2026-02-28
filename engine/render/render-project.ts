/*
This module performs full-project rendering through Remotion's renderer APIs.
It exists separately from scene render logic because full timeline orchestration
has different composition IDs and output semantics.
*/

import path from 'node:path';
import { bundle, renderMedia, selectComposition } from '@remotion/renderer';
import type { ProjectSpec, StyleTokens } from '../../schemas/index.js';
import { compileProject } from '../compiler/index.js';
import { PRESS_COMPOSITION_ID } from '../remotion/composition-ids.js';
import type { PressInputProps } from '../remotion/types.js';
import { ensureRenderDirectory, hashJson, writeRenderManifest } from './render-utils.js';

export interface RenderProjectOptions {
  project: ProjectSpec;
  styleTokens: StyleTokens;
}

export async function renderProject(options: RenderProjectOptions): Promise<{ outputPath: string; manifestPath: string }> {
  const { project, styleTokens } = options;
  const inputProps: PressInputProps = { project, styleTokens };

  const entryPoint = path.resolve('engine/remotion/index.ts');
  const serveUrl = await bundle({
    entryPoint,
  });

  const composition = await selectComposition({
    serveUrl,
    id: PRESS_COMPOSITION_ID,
    inputProps,
  });

  const outputDir = await ensureRenderDirectory(project.projectId);
  const outputPath = path.join(outputDir, `${project.projectId}-full.mp4`);

  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps,
    crf: 18,
  });

  const compiled = compileProject(project);
  const specHash = hashJson({ project, styleTokens });

  const manifestPath = await writeRenderManifest(outputDir, {
    projectId: project.projectId,
    mode: 'full',
    compositionId: PRESS_COMPOSITION_ID,
    outputPath,
    renderedAt: new Date().toISOString(),
    fps: project.fps,
    width: project.width,
    height: project.height,
    durationInFrames: compiled.totalDurationInFrames,
    codec: 'h264',
    specHash,
  });

  return { outputPath, manifestPath };
}
