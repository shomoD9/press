/*
This validator is the gatekeeper between user-authored artifacts and the engine.
It combines structural schema parsing with cross-scene invariants that Zod alone
cannot express, so we can fail early before preview or rendering.
*/

import { projectSpecSchema, type ProjectSpec } from './project-spec.js';
import { styleTokensSchema, type StyleTokens } from './style-tokens.js';
import type { SceneSpec } from './scene-spec.js';

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  project?: ProjectSpec;
  styleTokens?: StyleTokens;
}

function validateBeatOverlap(scenes: SceneSpec[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const sorted = [...scenes].sort((a, b) => a.beatRange.start - b.beatRange.start);

  // We walk adjacent ranges because any overlap must appear between neighbors once sorted.
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];

    if (current.beatRange.start <= previous.beatRange.end) {
      issues.push({
        path: `scenes.${index}.beatRange`,
        message: `Beat range overlap between ${previous.sceneId} and ${current.sceneId}.`,
      });
    }
  }

  return issues;
}

function validateSceneInternals(scene: SceneSpec, sceneIndex: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Scene layer timings should always stay inside scene duration bounds.
  scene.layers.forEach((layer, layerIndex) => {
    if (layer.endFrame >= scene.durationFrames) {
      issues.push({
        path: `scenes.${sceneIndex}.layers.${layerIndex}.endFrame`,
        message: `Layer ${layer.id} exceeds durationFrames for scene ${scene.sceneId}.`,
      });
    }
  });

  // Camera keyframes must be chronological so interpolation remains deterministic.
  for (let keyframeIndex = 1; keyframeIndex < scene.cameraPlan.keyframes.length; keyframeIndex += 1) {
    const previous = scene.cameraPlan.keyframes[keyframeIndex - 1];
    const current = scene.cameraPlan.keyframes[keyframeIndex];

    if (current.frame <= previous.frame) {
      issues.push({
        path: `scenes.${sceneIndex}.cameraPlan.keyframes.${keyframeIndex}.frame`,
        message: `Camera keyframes must be strictly increasing in scene ${scene.sceneId}.`,
      });
    }
  }

  return issues;
}

export function validateProjectArtifacts(projectInput: unknown, styleInput: unknown): ValidationResult {
  const projectResult = projectSpecSchema.safeParse(projectInput);
  const styleResult = styleTokensSchema.safeParse(styleInput);

  const issues: ValidationIssue[] = [];

  if (!projectResult.success) {
    projectResult.error.issues.forEach((issue) => {
      issues.push({
        path: issue.path.join('.'),
        message: issue.message,
      });
    });
  }

  if (!styleResult.success) {
    styleResult.error.issues.forEach((issue) => {
      issues.push({
        path: `style.${issue.path.join('.')}`,
        message: issue.message,
      });
    });
  }

  if (!projectResult.success || !styleResult.success) {
    return { valid: false, issues };
  }

  const project = projectResult.data;
  const styleTokens = styleResult.data;

  const sceneIdSet = new Set<string>();
  project.scenes.forEach((scene, sceneIndex) => {
    if (sceneIdSet.has(scene.sceneId)) {
      issues.push({
        path: `scenes.${sceneIndex}.sceneId`,
        message: `Duplicate sceneId '${scene.sceneId}'.`,
      });
    }

    sceneIdSet.add(scene.sceneId);
    issues.push(...validateSceneInternals(scene, sceneIndex));
  });

  issues.push(...validateBeatOverlap(project.scenes));

  if (issues.length > 0) {
    return { valid: false, issues };
  }

  return {
    valid: true,
    issues: [],
    project,
    styleTokens,
  };
}
