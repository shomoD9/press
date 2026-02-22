/**
 * This file contains defensive validators for Publish V1 contracts. We keep this
 * separate from the type declarations because runtime data arrives from files and
 * tools, not from TypeScript-only compile-time guarantees.
 *
 * The validator layer is called by capability implementations and by the explicit
 * plan validation command so malformed edits are caught early.
 */
import { type PlanRow, type PlanState, type VisualType } from "./types.js";

const VISUAL_TYPES: Set<VisualType> = new Set([
  "Diagram",
  "B-Roll A (Atmospheric)",
  "B-Roll B (Specific)",
  "Emphasis"
]);

export function isVisualType(value: string): value is VisualType {
  return VISUAL_TYPES.has(value as VisualType);
}

export function validatePlanRow(row: PlanRow): string[] {
  const errors: string[] = [];

  // We enforce stable identifiers so row-level iteration can target exact entries.
  if (!row.id.trim()) {
    errors.push("PlanRow.id must be a non-empty string.");
  }

  if (!row.excerpt.trim()) {
    errors.push("PlanRow.excerpt must be non-empty.");
  }

  if (!isVisualType(row.visualType)) {
    errors.push(`PlanRow.visualType is invalid: ${row.visualType}`);
  }

  if (!row.notesArtifacts.trim()) {
    errors.push("PlanRow.notesArtifacts must be non-empty.");
  }

  if (!row.context.trim()) {
    errors.push("PlanRow.context must be non-empty.");
  }

  if (!row.sourceFile.trim()) {
    errors.push("PlanRow.sourceFile must be non-empty.");
  }

  return errors;
}

export function validatePlanState(state: PlanState): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!state.version.trim()) {
    errors.push("PlanState.version must be non-empty.");
  }

  if (!state.projectPath.trim()) {
    errors.push("PlanState.projectPath must be non-empty.");
  }

  if (!state.sourceFile.trim()) {
    warnings.push("PlanState.sourceFile is empty. This is allowed before first generation.");
  }

  if (!state.essayHash.trim()) {
    warnings.push("PlanState.essayHash is empty. This is allowed before source parsing.");
  }

  const duplicateDiagramFiles = new Set<string>();

  // We validate each row independently so manual edits fail with clear granularity.
  for (const row of state.rows) {
    const rowErrors = validatePlanRow(row);
    errors.push(...rowErrors.map((entry) => `${row.id || "(missing-id)"}: ${entry}`));
  }

  for (const diagram of state.diagrams) {
    if (!diagram.id.trim()) {
      errors.push("DiagramRecord.id must be non-empty.");
    }

    if (!diagram.filename.endsWith(".excalidraw")) {
      errors.push(`DiagramRecord.filename must end with .excalidraw: ${diagram.filename}`);
    }

    if (duplicateDiagramFiles.has(diagram.filename)) {
      errors.push(`Duplicate diagram filename in state: ${diagram.filename}`);
    }

    duplicateDiagramFiles.add(diagram.filename);

    if (diagram.revisions < 0) {
      errors.push(`DiagramRecord.revisions cannot be negative: ${diagram.filename}`);
    }
  }

  return { errors, warnings };
}
