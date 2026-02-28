/*
This module resolves project and style token artifacts from either explicit file
paths or project IDs. It is isolated so validate, preview, and render commands
can share one canonical artifact-loading behavior.
*/

import path from 'node:path';
import type { ProjectSpec, StyleTokens } from '../../schemas/index.js';
import { readJsonFile } from './io.js';

export interface LoadedProjectArtifacts {
  projectPath: string;
  stylePath: string;
  project: ProjectSpec;
  styleTokens: StyleTokens;
}

function looksLikePath(input: string): boolean {
  return input.includes('/') || input.endsWith('.json');
}

export async function loadProjectArtifacts(projectRef: string): Promise<LoadedProjectArtifacts> {
  const projectPath = looksLikePath(projectRef)
    ? path.resolve(projectRef)
    : path.resolve('artifacts', 'projects', projectRef, 'project.spec.json');

  const project = await readJsonFile<ProjectSpec>(projectPath);

  // Style token references are resolved relative to the project artifact location.
  const stylePath = path.resolve(path.dirname(projectPath), project.styleTokenRef);
  const styleTokens = await readJsonFile<StyleTokens>(stylePath);

  return {
    projectPath,
    stylePath,
    project,
    styleTokens,
  };
}
