/**
 * This file provides reusable fixture setup utilities for Publish V1 tests. We keep
 * setup logic here so each test can focus on behavior instead of repetitive filesystem
 * bootstrapping steps.
 *
 * It talks to fixture directories on disk and returns isolated temporary workspaces.
 */
import { cp, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export interface FixtureWorkspace {
  rootDir: string;
  creativeRoot: string;
  essayProject: string;
  commentaryProject: string;
}

export async function createFixtureWorkspace(): Promise<FixtureWorkspace> {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "press-publish-v1-"));
  const sourceCreative = path.resolve("tests/fixtures/creative");
  const creativeRoot = path.join(rootDir, "creative");

  // Each test gets a full copy so mutations never leak across test cases.
  await cp(sourceCreative, creativeRoot, { recursive: true });

  return {
    rootDir,
    creativeRoot,
    essayProject: path.join(creativeRoot, "Essays", "discipline-architecture"),
    commentaryProject: path.join(creativeRoot, "Commentary", "film-symmetry")
  };
}

export async function cleanupFixtureWorkspace(workspace: FixtureWorkspace): Promise<void> {
  await rm(workspace.rootDir, { recursive: true, force: true });
}

export async function listDiagramFiles(projectPath: string): Promise<string[]> {
  const artifactsPath = path.join(projectPath, "artifacts");
  const files = await readdir(artifactsPath);
  return files.filter((file) => /^diagram-\d+\.excalidraw$/.test(file)).sort();
}

export async function readText(filePath: string): Promise<string> {
  return readFile(filePath, "utf8");
}
