/**
 * This file handles pre-plan diagram creation from any markdown source inside a project.
 * It is separated from plan generation because you often want diagrams while ideas are
 * still forming, before locking a full visual plan.
 *
 * It talks to project path guards, markdown parsing, state persistence, and the
 * Excalidraw adapter. The output is a stable artifact file plus updated state.
 */
import { access, writeFile } from "node:fs/promises";
import path from "node:path";
import { type CapabilityResult, type DiagramRecord } from "../contracts/types.js";
import { createExcalidrawAdapter } from "../integrations/excalidraw.js";
import {
  readMarkdownFile,
  sourceContainsExcerpt
} from "../io/markdown.js";
import {
  assertWriteTarget,
  resolveProjectPaths,
  resolveSourcePath
} from "../io/project-paths.js";
import {
  appendWarnings,
  computeContentHash,
  ensureArtifactsStructure,
  findDiagram,
  loadPlanState,
  nextDiagramFilename,
  savePlanState,
  upsertDiagram,
  writeDiagramLinks
} from "../io/state.js";

export interface DiagramCreateArgs {
  project: string;
  source: string;
  excerpt: string;
  intent?: string;
}

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function filenameToId(filename: string): string {
  return filename.replace(/\.excalidraw$/i, "");
}

export async function runDiagramCreate(args: DiagramCreateArgs): Promise<CapabilityResult> {
  const paths = await resolveProjectPaths(args.project);
  const sourcePath = await resolveSourcePath(paths, args.source);
  const sourceText = await readMarkdownFile(sourcePath);
  await ensureArtifactsStructure(paths);

  const sourceFile = path.relative(paths.projectRoot, sourcePath);
  const essayHash = computeContentHash(sourceText);
  const state = await loadPlanState(paths, sourceFile, essayHash);

  const normalizedExcerpt = args.excerpt.trim();

  // We reuse existing diagram mappings to avoid duplicate artifacts for the same excerpt.
  const existingByExcerpt = state.diagrams.find(
    (diagram) => diagram.linkedExcerpt === normalizedExcerpt && diagram.sourceFile === sourceFile
  );

  if (existingByExcerpt) {
    const existingFilePath = path.join(paths.artifactsDir, existingByExcerpt.filename);
    if (await fileExists(existingFilePath)) {
      return {
        ok: true,
        message: `Reused existing diagram ${existingByExcerpt.filename} for the same excerpt.`,
        data: {
          diagramId: existingByExcerpt.id,
          filename: existingByExcerpt.filename,
          reused: true
        },
        warnings: state.warnings
      };
    }
  }

  const filename = await nextDiagramFilename(paths, state);
  const diagramId = filenameToId(filename);
  const diagramPath = path.join(paths.artifactsDir, filename);
  assertWriteTarget(paths, diagramPath);

  const adapter = createExcalidrawAdapter();
  const operation = await adapter.createDiagram({
    title: diagramId,
    excerpt: normalizedExcerpt,
    intent: args.intent,
    sourceText
  });

  await writeFile(diagramPath, `${operation.content.trim()}\n`, "utf8");

  const now = new Date().toISOString();
  const record: DiagramRecord = {
    id: diagramId,
    filename,
    linkedExcerpt: normalizedExcerpt,
    sourceFile,
    revisions: 0,
    webUrl: operation.webUrl,
    createdAt: now,
    updatedAt: now
  };

  upsertDiagram(state, record);

  const warnings: string[] = [...operation.warnings];
  if (!sourceContainsExcerpt(sourceText, normalizedExcerpt)) {
    warnings.push(
      `Excerpt did not match source text exactly for ${sourceFile}; diagram was still created for manual review.`
    );
  }

  appendWarnings(state, warnings);
  state.projectPath = paths.projectRoot;
  state.sourceFile = sourceFile;
  state.essayHash = essayHash;

  await writeDiagramLinks(paths, state);
  await savePlanState(paths, state);

  // We include both id and filename so chat wrappers can address diagrams either way.
  return {
    ok: true,
    message: `Created diagram ${filename}.`,
    data: {
      diagramId,
      filename,
      sourceFile,
      excerpt: normalizedExcerpt
    },
    warnings
  };
}

export async function findDiagramForPlan(
  project: string,
  source: string,
  excerpt: string,
  intent?: string
): Promise<{ filename: string; diagramId: string; warnings: string[] }> {
  const result = await runDiagramCreate({ project, source, excerpt, intent });

  if (!result.ok || !result.data) {
    throw new Error(result.errors?.join("; ") || result.message);
  }

  return {
    filename: String(result.data.filename),
    diagramId: String(result.data.diagramId),
    warnings: result.warnings || []
  };
}
