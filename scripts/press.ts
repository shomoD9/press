/*
This script is the operational interface for Press V1. It translates user-level
commands into validation, preview, and render actions while enforcing quality
checks before expensive rendering work.
*/

import { spawn } from 'node:child_process';
import path from 'node:path';
import {
  validateProjectArtifacts,
  type ValidationIssue,
} from '../schemas/index.js';
import { lintCraft } from '../engine/quality/index.js';
import { renderProject, renderScene } from '../engine/render/index.js';
import { PRESS_COMPOSITION_ID, PRESS_SCENE_COMPOSITION_ID } from '../engine/remotion/composition-ids.js';
import { loadProjectArtifacts } from './shared/load-project.js';

function parseFlag(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function printIssues(issues: ValidationIssue[]): void {
  issues.forEach((issue) => {
    console.error(`- ${issue.path || '<root>'}: ${issue.message}`);
  });
}

async function runValidate(projectRef: string): Promise<void> {
  const loaded = await loadProjectArtifacts(projectRef);
  const result = validateProjectArtifacts(loaded.project, loaded.styleTokens);

  if (!result.valid) {
    console.error(`Validation failed for ${loaded.projectPath}`);
    printIssues(result.issues);
    process.exitCode = 1;
    return;
  }

  console.log(`Validation passed for ${loaded.project.projectId}.`);
}

async function runPreview(projectId: string, sceneRef: string): Promise<void> {
  const loaded = await loadProjectArtifacts(projectId);
  const validation = validateProjectArtifacts(loaded.project, loaded.styleTokens);

  if (!validation.valid) {
    console.error('Cannot launch preview because artifacts are invalid.');
    printIssues(validation.issues);
    process.exitCode = 1;
    return;
  }

  const compositionId = sceneRef === 'all' ? PRESS_COMPOSITION_ID : PRESS_SCENE_COMPOSITION_ID;
  const props = sceneRef === 'all'
    ? { project: loaded.project, styleTokens: loaded.styleTokens }
    : { project: loaded.project, styleTokens: loaded.styleTokens, sceneId: sceneRef };

  const args = [
    'remotion',
    'studio',
    path.resolve('engine/remotion/index.ts'),
    '--composition',
    compositionId,
    '--props',
    JSON.stringify(props),
  ];

  // Preview runs as a child process so users stay in native Remotion studio UX.
  const child = spawn('npx', args, {
    stdio: 'inherit',
  });

  await new Promise<void>((resolve, reject) => {
    child.on('exit', (code) => {
      if (code && code !== 0) {
        reject(new Error(`Preview process exited with code ${code}.`));
        return;
      }
      resolve();
    });

    child.on('error', reject);
  });
}

async function runRenderScene(projectId: string, sceneId: string, force: boolean): Promise<void> {
  const loaded = await loadProjectArtifacts(projectId);
  const validation = validateProjectArtifacts(loaded.project, loaded.styleTokens);

  if (!validation.valid) {
    console.error('Cannot render scene because artifacts are invalid.');
    printIssues(validation.issues);
    process.exitCode = 1;
    return;
  }

  const craft = lintCraft(loaded.project, loaded.styleTokens);
  if (!craft.ok && !force) {
    console.error('Craft lint failed. Use --force to override errors.');
    craft.issues.forEach((issue) => {
      console.error(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    });
    process.exitCode = 1;
    return;
  }

  const output = await renderScene({
    project: loaded.project,
    styleTokens: loaded.styleTokens,
    sceneId,
  });

  console.log(`Scene render complete: ${output.outputPath}`);
  console.log(`Manifest written: ${output.manifestPath}`);
}

async function runRenderFull(projectId: string, force: boolean): Promise<void> {
  const loaded = await loadProjectArtifacts(projectId);
  const validation = validateProjectArtifacts(loaded.project, loaded.styleTokens);

  if (!validation.valid) {
    console.error('Cannot render project because artifacts are invalid.');
    printIssues(validation.issues);
    process.exitCode = 1;
    return;
  }

  const craft = lintCraft(loaded.project, loaded.styleTokens);
  if (!craft.ok && !force) {
    console.error('Craft lint failed. Use --force to override errors.');
    craft.issues.forEach((issue) => {
      console.error(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    });
    process.exitCode = 1;
    return;
  }

  const output = await renderProject({
    project: loaded.project,
    styleTokens: loaded.styleTokens,
  });

  console.log(`Project render complete: ${output.outputPath}`);
  console.log(`Manifest written: ${output.manifestPath}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.error('Usage: press <validate|preview|render:scene|render:full> ...');
    process.exitCode = 1;
    return;
  }

  if (command === 'validate') {
    const projectRef = args[1];
    if (!projectRef) {
      throw new Error('Usage: press validate <project-spec-path-or-project-id>');
    }

    await runValidate(projectRef);
    return;
  }

  if (command === 'preview') {
    const projectId = parseFlag(args, '--project');
    const sceneRef = parseFlag(args, '--scene') ?? 'all';

    if (!projectId) {
      throw new Error('Usage: press preview --project <id> --scene <scene-id|all>');
    }

    await runPreview(projectId, sceneRef);
    return;
  }

  if (command === 'render:scene') {
    const projectId = parseFlag(args, '--project');
    const sceneId = parseFlag(args, '--scene');
    const force = args.includes('--force');

    if (!projectId || !sceneId) {
      throw new Error('Usage: press render:scene --project <id> --scene <scene-id> [--force]');
    }

    await runRenderScene(projectId, sceneId, force);
    return;
  }

  if (command === 'render:full') {
    const projectId = parseFlag(args, '--project');
    const force = args.includes('--force');

    if (!projectId) {
      throw new Error('Usage: press render:full --project <id> [--force]');
    }

    await runRenderFull(projectId, force);
    return;
  }

  throw new Error(`Unknown command '${command}'.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
