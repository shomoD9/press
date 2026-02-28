/*
This module enforces V1 craft constraints before rendering. It exists as a
separate policy layer so taste and quality rules are explicit, inspectable, and
independent from schema shape validation.
*/

import type { ProjectSpec, SceneSpec, StyleTokens } from '../../schemas/index.js';
import { contrastRatio } from './contrast.js';

export type CraftIssueSeverity = 'error' | 'warning';

export interface CraftIssue {
  severity: CraftIssueSeverity;
  code: string;
  sceneId?: string;
  message: string;
}

export interface CraftLintResult {
  ok: boolean;
  issues: CraftIssue[];
}

function countConcurrentFocalLayers(scene: SceneSpec, frame: number): number {
  return scene.layers.filter((layer) => {
    const isVisible = frame >= layer.startFrame && frame <= layer.endFrame;
    const isFocal = layer.focalWeight >= 0.65;

    return isVisible && isFocal;
  }).length;
}

function lintSceneDensity(scene: SceneSpec): CraftIssue[] {
  const issues: CraftIssue[] = [];

  // Sampling every frame is cheap at V1 scale and catches bursty overlaps reliably.
  for (let frame = 0; frame < scene.durationFrames; frame += 1) {
    const concurrent = countConcurrentFocalLayers(scene, frame);

    if (concurrent > scene.timingPlan.maxConcurrentFocalElements) {
      issues.push({
        severity: 'error',
        code: 'FOCAL_DENSITY_EXCEEDED',
        sceneId: scene.sceneId,
        message:
          `Scene ${scene.sceneId} exceeds maxConcurrentFocalElements at frame ${frame}.` +
          ` Expected <= ${scene.timingPlan.maxConcurrentFocalElements}, got ${concurrent}.`,
      });

      // One violation is enough to fail this scene, so we stop to keep output concise.
      break;
    }
  }

  return issues;
}

function lintSceneHold(scene: SceneSpec): CraftIssue[] {
  const issues: CraftIssue[] = [];

  if (scene.timingPlan.minHoldFrames < 8) {
    issues.push({
      severity: 'warning',
      code: 'HOLD_TOO_SHORT',
      sceneId: scene.sceneId,
      message: `Scene ${scene.sceneId} has minHoldFrames below the recommended floor of 8.`,
    });
  }

  return issues;
}

function lintCameraVelocity(scene: SceneSpec, style: StyleTokens): CraftIssue[] {
  const issues: CraftIssue[] = [];
  const keyframes = scene.cameraPlan.keyframes;

  for (let index = 1; index < keyframes.length; index += 1) {
    const previous = keyframes[index - 1];
    const current = keyframes[index];

    const frameSpan = current.frame - previous.frame;
    if (frameSpan <= 0) {
      continue;
    }

    const distance = Math.hypot(current.x - previous.x, current.y - previous.y);
    const zoomDelta = Math.abs(current.zoom - previous.zoom) * 200;
    const velocity = (distance + zoomDelta) / frameSpan;

    if (velocity > style.motionProfile.cameraMaxVelocityPerFrame) {
      issues.push({
        severity: 'error',
        code: 'CAMERA_VELOCITY_SPIKE',
        sceneId: scene.sceneId,
        message:
          `Scene ${scene.sceneId} camera velocity ${velocity.toFixed(2)} exceeds max ` +
          `${style.motionProfile.cameraMaxVelocityPerFrame.toFixed(2)} per frame.`,
      });
    }
  }

  return issues;
}

export function lintCraft(project: ProjectSpec, style: StyleTokens): CraftLintResult {
  const issues: CraftIssue[] = [];

  const textContrast = contrastRatio(style.palette.foreground, style.palette.background);
  if (textContrast < style.contrastRules.minTextContrastRatio) {
    issues.push({
      severity: 'error',
      code: 'TEXT_CONTRAST_TOO_LOW',
      message:
        `Palette foreground/background contrast is ${textContrast.toFixed(2)}, below required ` +
        `${style.contrastRules.minTextContrastRatio.toFixed(2)}.`,
    });
  }

  project.scenes.forEach((scene) => {
    issues.push(...lintSceneDensity(scene));
    issues.push(...lintSceneHold(scene));
    issues.push(...lintCameraVelocity(scene, style));
  });

  return {
    ok: !issues.some((issue) => issue.severity === 'error'),
    issues,
  };
}
