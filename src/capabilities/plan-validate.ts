/**
 * This file validates generated artifacts and internal state after manual edits or
 * repeated runs. It is separated from generation so users can run a health check
 * without changing files.
 *
 * It talks to the renderer parser, state loader, and schema validators to report
 * structural errors and practical repair hints.
 */
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { type CapabilityResult } from "../contracts/types.js";
import { isVisualType, validatePlanState } from "../contracts/schema.js";
import { readAndParseVisualPlan } from "../io/plan-render.js";
import { resolveProjectPaths } from "../io/project-paths.js";
import { loadPlanState } from "../io/state.js";

export interface PlanValidateArgs {
  project: string;
}

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function extractDiagramReference(notes: string): string | undefined {
  const match = notes.match(/(diagram-\d+\.excalidraw)/i);
  return match?.[1];
}

export async function runPlanValidate(args: PlanValidateArgs): Promise<CapabilityResult> {
  const paths = await resolveProjectPaths(args.project);
  const errors: string[] = [];
  const warnings: string[] = [];
  const repairHints: string[] = [];

  if (!(await fileExists(paths.visualPlanFile))) {
    errors.push(`Missing visual plan file: ${paths.visualPlanFile}`);
    repairHints.push("Run publish.plan_generate to create a fresh visual plan.");

    return {
      ok: false,
      message: "Validation failed: visual-plan.md is missing.",
      errors,
      warnings,
      data: { repairHints }
    };
  }

  const table = await readAndParseVisualPlan(paths);
  errors.push(...table.errors);

  if (table.errors.length > 0) {
    repairHints.push(
      "Ensure the visual plan keeps the four required columns in this exact order: Excerpt, Visual Type, Notes & Artifacts, Context."
    );
  }

  for (const row of table.rows) {
    const visualType = row[1];
    const notes = row[2];

    if (!isVisualType(visualType)) {
      errors.push(`Unknown visual type in table row: ${visualType}`);
      repairHints.push("Replace unknown visual type values with one of the four supported V1 values.");
    }

    if (visualType === "Diagram") {
      const diagramFile = extractDiagramReference(notes);
      if (!diagramFile) {
        errors.push(`Diagram row is missing a diagram filename reference in Notes: ${notes}`);
        repairHints.push("Include diagram filenames in Notes, e.g. `diagram-01.excalidraw`. ");
      } else {
        const diagramPath = path.join(paths.artifactsDir, diagramFile);
        if (!(await fileExists(diagramPath))) {
          errors.push(`Diagram file referenced in plan is missing on disk: ${diagramPath}`);
          repairHints.push(
            "Regenerate diagrams with publish.diagram_create or re-run publish.plan_generate to repair references."
          );
        }
      }
    }
  }

  const state = await loadPlanState(paths);
  const stateValidation = validatePlanState(state);
  errors.push(...stateValidation.errors);
  warnings.push(...stateValidation.warnings);

  for (const diagram of state.diagrams) {
    const filePath = path.join(paths.artifactsDir, diagram.filename);
    if (!(await fileExists(filePath))) {
      errors.push(`State references a missing diagram file: ${diagram.filename}`);
      repairHints.push("Recreate missing diagram files or remove stale records from plan-state.json.");
    }
  }

  if (state.rows.length > 0 && table.rows.length !== state.rows.length) {
    warnings.push(
      "visual-plan.md row count does not match plan-state.json row count. Manual edits may have desynchronized files."
    );
    repairHints.push(
      "If this mismatch is unexpected, run publish.plan_generate to resynchronize visual-plan.md and plan-state.json."
    );
  }

  // We read the file at the end to ensure this command also catches unreadable encoding issues.
  try {
    await readFile(paths.visualPlanFile, "utf8");
  } catch {
    errors.push("visual-plan.md exists but could not be read as UTF-8 text.");
    repairHints.push("Convert visual-plan.md to UTF-8 and run validation again.");
  }

  const ok = errors.length === 0;

  return {
    ok,
    message: ok ? "Validation passed." : "Validation failed.",
    errors: ok ? undefined : errors,
    warnings,
    data: {
      repairHints
    }
  };
}
