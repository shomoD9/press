/**
 * This file resolves and guards project filesystem paths. It exists separately so
 * every capability shares one strict rule-set about where writes are allowed and
 * how a valid essay/commentary project is recognized.
 *
 * It talks to the contract layer for typed path objects and to the filesystem for
 * existence checks. Capability files call these helpers before any read or write.
 */
import { access } from "node:fs/promises";
import path from "node:path";
import { type ProjectPaths } from "../contracts/types.js";

const PROJECT_CATEGORY_NAMES = new Set(["Essays", "Commentary"]);

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function splitPathParts(absolutePath: string): string[] {
  return absolutePath.split(path.sep).filter((part) => part.length > 0);
}

function assertProjectShape(projectRoot: string): { vaultRoot: string; category: string; slug: string } {
  const absoluteRoot = path.resolve(projectRoot);
  const parts = splitPathParts(absoluteRoot);

  const categoryIndex = parts.findIndex((entry) => PROJECT_CATEGORY_NAMES.has(entry));
  if (categoryIndex === -1 || categoryIndex === parts.length - 1) {
    throw new Error(
      "Project path must include Essays/<slug> or Commentary/<slug> as its terminal segment."
    );
  }

  const reconstructedProject = path.join(path.sep, ...parts.slice(0, categoryIndex + 2));
  if (absoluteRoot !== reconstructedProject) {
    throw new Error(
      "Project path must point at the project root itself (for example: .../Essays/<slug>)."
    );
  }

  const vaultRoot = path.join(path.sep, ...parts.slice(0, categoryIndex));
  return {
    vaultRoot,
    category: parts[categoryIndex] as string,
    slug: parts[categoryIndex + 1] as string
  };
}

export function isPathInside(parentPath: string, childPath: string): boolean {
  const relativePath = path.relative(path.resolve(parentPath), path.resolve(childPath));
  return relativePath.length > 0 && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

export async function resolveProjectPaths(projectPath: string): Promise<ProjectPaths> {
  const absoluteProject = path.resolve(projectPath);
  const { vaultRoot, category, slug } = assertProjectShape(absoluteProject);

  if (!(await pathExists(absoluteProject))) {
    throw new Error(`Project path does not exist: ${absoluteProject}`);
  }

  const artifactsDir = path.join(absoluteProject, "artifacts");
  const internalDir = path.join(artifactsDir, ".press");
  const visualPlanFile = path.join(artifactsDir, "visual-plan.md");
  const stateFile = path.join(internalDir, "plan-state.json");
  const linksFile = path.join(artifactsDir, "diagram-links.md");
  const rulesFile = path.join(vaultRoot, "_system", "visual-trigger-ruleset.md");

  if (!(await pathExists(rulesFile))) {
    throw new Error(
      `The vault-level rules file is missing at ${rulesFile}. Publish V1 expects this file.`
    );
  }

  // We keep this check explicit so failures mention the intended category and slug.
  if (!PROJECT_CATEGORY_NAMES.has(category) || !slug.trim()) {
    throw new Error("Project category or slug is invalid.");
  }

  return {
    vaultRoot,
    projectRoot: absoluteProject,
    artifactsDir,
    internalDir,
    visualPlanFile,
    stateFile,
    linksFile,
    rulesFile
  };
}

export async function resolveSourcePath(paths: ProjectPaths, sourceFile: string): Promise<string> {
  const candidatePath = path.resolve(paths.projectRoot, sourceFile);

  if (!isPathInside(paths.projectRoot, candidatePath)) {
    throw new Error(
      `Source file must stay inside the project root (${paths.projectRoot}). Received: ${candidatePath}`
    );
  }

  if (path.extname(candidatePath).toLowerCase() !== ".md") {
    throw new Error(`Source file must be markdown (.md). Received: ${candidatePath}`);
  }

  if (!(await pathExists(candidatePath))) {
    throw new Error(`Source markdown file does not exist: ${candidatePath}`);
  }

  return candidatePath;
}

export function assertWriteTarget(paths: ProjectPaths, targetPath: string): void {
  const absoluteTarget = path.resolve(targetPath);

  // Every generated artifact must remain under artifacts/ by contract.
  if (absoluteTarget === paths.artifactsDir || isPathInside(paths.artifactsDir, absoluteTarget)) {
    return;
  }

  throw new Error(
    `Refusing to write outside the project's artifacts directory: ${absoluteTarget}`
  );
}
