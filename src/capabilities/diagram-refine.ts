/**
 * This file applies iterative refinements to existing diagrams. It is separated from
 * creation so iteration can be explicit and targeted from chat commands like
 * "refine diagram-02".
 *
 * It talks to the state layer to find the canonical artifact, the Excalidraw adapter
 * for transformation, and persistence helpers to keep revision history stable.
 */
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { type CapabilityResult, type DiagramRecord } from "../contracts/types.js";
import { createExcalidrawAdapter } from "../integrations/excalidraw.js";
import { assertWriteTarget, resolveProjectPaths } from "../io/project-paths.js";
import {
  appendWarnings,
  ensureArtifactsStructure,
  findDiagram,
  loadPlanState,
  savePlanState,
  upsertDiagram,
  writeDiagramLinks
} from "../io/state.js";

export interface DiagramRefineArgs {
  project: string;
  diagram: string;
  instruction: string;
}

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function ensureFilename(identifier: string): string {
  return identifier.endsWith(".excalidraw") ? identifier : `${identifier}.excalidraw`;
}

function ensureDiagramRecord(record: DiagramRecord | undefined, filename: string): DiagramRecord {
  if (record) {
    return record;
  }

  const now = new Date().toISOString();
  return {
    id: filename.replace(/\.excalidraw$/i, ""),
    filename,
    linkedExcerpt: "",
    sourceFile: "",
    revisions: 0,
    createdAt: now,
    updatedAt: now
  };
}

export async function runDiagramRefine(args: DiagramRefineArgs): Promise<CapabilityResult> {
  const paths = await resolveProjectPaths(args.project);
  await ensureArtifactsStructure(paths);

  const state = await loadPlanState(paths);
  const existing = findDiagram(state, args.diagram);
  const filename = existing?.filename || ensureFilename(args.diagram);
  const diagramPath = path.join(paths.artifactsDir, filename);

  if (!(await fileExists(diagramPath))) {
    return {
      ok: false,
      message: `Diagram not found: ${filename}`,
      errors: [
        `Expected a file at ${diagramPath}. Create the diagram first or provide the correct identifier.`
      ]
    };
  }

  const currentContent = await readFile(diagramPath, "utf8");
  const adapter = createExcalidrawAdapter();
  const operation = await adapter.refineDiagram({
    diagramId: filename.replace(/\.excalidraw$/i, ""),
    existingContent: currentContent,
    instruction: args.instruction
  });

  assertWriteTarget(paths, diagramPath);
  await writeFile(diagramPath, `${operation.content.trim()}\n`, "utf8");

  const record = ensureDiagramRecord(existing, filename);
  record.revisions += 1;
  record.updatedAt = new Date().toISOString();
  if (operation.webUrl) {
    record.webUrl = operation.webUrl;
  }

  upsertDiagram(state, record);
  appendWarnings(state, operation.warnings);

  await writeDiagramLinks(paths, state);
  await savePlanState(paths, state);

  return {
    ok: true,
    message: `Refined diagram ${filename}.`,
    data: {
      diagramId: record.id,
      filename,
      revisions: record.revisions
    },
    warnings: operation.warnings
  };
}
