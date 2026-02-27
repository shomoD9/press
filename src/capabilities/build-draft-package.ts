/**
 * This file builds the V1.5 article draft package from a project essay and existing
 * visual artifacts. It exists as a dedicated capability so agents can invoke one
 * deterministic command for publishing handoff prep.
 *
 * It talks to project path resolution, state persistence, and article package IO
 * rendering. The output is always constrained to `artifacts/publish-draft-package`.
 */
import path from "node:path";
import { readdir } from "node:fs/promises";
import { type CapabilityResult } from "../contracts/types.js";
import { readMarkdownFile } from "../io/markdown.js";
import { resolveProjectPaths, resolveSourcePath } from "../io/project-paths.js";
import { loadPlanState } from "../io/state.js";
import { writeDraftPackage } from "../io/article-package.js";

export interface BuildDraftPackageArgs {
  project: string;
  source?: string;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export async function runBuildDraftPackage(
  args: BuildDraftPackageArgs
): Promise<CapabilityResult> {
  const paths = await resolveProjectPaths(args.project);
  const sourcePath = await resolveSourcePath(paths, args.source || "essay.md");
  const sourceFile = path.relative(paths.projectRoot, sourcePath);
  const sourceText = await readMarkdownFile(sourcePath);

  const state = await loadPlanState(paths, sourceFile, "");
  const filesInArtifacts: string[] = await readdir(paths.artifactsDir).catch(
    () => [] as string[]
  );

  // We combine state records with actual artifacts so package output stays resilient.
  const diagramFiles = uniqueSorted([
    ...state.diagrams.map((diagram) => diagram.filename),
    ...filesInArtifacts.filter((file) => /^diagram-\d+\.excalidraw$/.test(file))
  ]);

  const output = await writeDraftPackage(paths, {
    sourceFile,
    sourceText,
    diagramFiles,
    visualPlanPresent: filesInArtifacts.includes("visual-plan.md")
  });

  return {
    ok: true,
    message: `Built article draft package with ${diagramFiles.length} diagram reference(s).`,
    data: {
      packageDir: output.packageDir,
      substackFile: output.files.substack,
      lesswrongFile: output.files.lesswrong,
      xArticleFile: output.files.xArticle,
      metadataFile: output.files.metadata,
      readmeFile: output.files.readme
    },
    warnings: state.warnings
  };
}
