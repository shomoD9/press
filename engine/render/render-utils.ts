/*
This module contains shared render helper logic for pathing, hashing, and
manifest persistence. We keep it separate from render entrypoints so scene/full
render commands can share consistent artifact behavior.
*/

import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface RenderManifest {
  projectId: string;
  mode: 'scene' | 'full';
  compositionId: string;
  sceneId?: string;
  outputPath: string;
  renderedAt: string;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  codec: string;
  specHash: string;
}

export function hashJson(value: unknown): string {
  const serialized = JSON.stringify(value);
  return createHash('sha256').update(serialized).digest('hex');
}

export async function ensureRenderDirectory(projectId: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = path.resolve('renders', projectId, timestamp);

  await mkdir(outputDir, { recursive: true });
  return outputDir;
}

export async function writeRenderManifest(outputDir: string, manifest: RenderManifest): Promise<string> {
  const manifestPath = path.join(outputDir, 'render-manifest.json');
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
  return manifestPath;
}
