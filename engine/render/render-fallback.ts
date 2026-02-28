/*
This module provides a robust fallback renderer for environments where Remotion's
multi-frame renderMedia() path times out while advancing frames. It renders each
frame via renderStill() and stitches the sequence with ffmpeg to preserve MP4
output reliability.
*/

import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import type { VideoConfig } from 'remotion';
import { renderStill } from '@remotion/renderer';
import type { PressInputProps } from '../remotion/types.js';

interface RenderViaStillFramesOptions {
  composition: VideoConfig;
  serveUrl: string;
  inputProps: PressInputProps;
  outputPath: string;
}

async function runFfmpeg(frameDirectory: string, fps: number, outputPath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn(
      'ffmpeg',
      [
        '-y',
        '-framerate',
        String(fps),
        '-start_number',
        '0',
        '-i',
        'frame-%06d.png',
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        outputPath,
      ],
      {
        cwd: frameDirectory,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    let stderrOutput = '';

    ffmpeg.stderr.on('data', (chunk) => {
      stderrOutput += chunk.toString();
    });

    ffmpeg.on('error', reject);
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`ffmpeg exited with code ${code}.\n${stderrOutput}`));
    });
  });
}

export function shouldUseStillFrameFallback(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  // These failures indicate frame-advance instability in renderMedia() mode.
  return (
    message.includes('delayRender() "Setting the current frame') ||
    message.includes('Visited "http://localhost:3000/index.html" but got no response')
  );
}

export async function renderViaStillFrames({
  composition,
  serveUrl,
  inputProps,
  outputPath,
}: RenderViaStillFramesOptions): Promise<void> {
  const frameDirectory = path.join(path.dirname(outputPath), '.frames');

  await rm(frameDirectory, { recursive: true, force: true });
  await mkdir(frameDirectory, { recursive: true });

  try {
    for (let frame = 0; frame < composition.durationInFrames; frame += 1) {
      const framePath = path.join(frameDirectory, `frame-${String(frame).padStart(6, '0')}.png`);

      await renderStill({
        serveUrl,
        composition,
        inputProps,
        frame,
        output: framePath,
        imageFormat: 'png',
        overwrite: true,
        timeoutInMilliseconds: 120000,
        chromiumOptions: {
          gl: 'swiftshader',
          headless: true,
        },
      });
    }

    await runFfmpeg(frameDirectory, composition.fps, outputPath);
  } finally {
    await rm(frameDirectory, { recursive: true, force: true });
  }
}
