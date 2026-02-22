/**
 * This file verifies validation behavior for healthy and malformed plans so the
 * `plan-validate` command can be trusted as a guardrail before production use.
 */
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { runPlanGenerate } from "../../src/capabilities/plan-generate.js";
import { runPlanValidate } from "../../src/capabilities/plan-validate.js";
import { cleanupFixtureWorkspace, createFixtureWorkspace } from "./test-helpers.js";

test("plan-validate succeeds on a generated plan", async () => {
  const workspace = await createFixtureWorkspace();

  try {
    await runPlanGenerate({
      project: workspace.essayProject,
      source: "essay.md"
    });

    const validation = await runPlanValidate({ project: workspace.essayProject });
    assert.equal(validation.ok, true);
  } finally {
    await cleanupFixtureWorkspace(workspace);
  }
});

test("plan-validate catches malformed headers after manual edits", async () => {
  const workspace = await createFixtureWorkspace();

  try {
    await runPlanGenerate({
      project: workspace.essayProject,
      source: "essay.md"
    });

    const planPath = path.join(workspace.essayProject, "artifacts", "visual-plan.md");
    const current = await readFile(planPath, "utf8");

    // We intentionally break the header to simulate accidental manual formatting drift.
    const malformed = current.replace("| Excerpt | Visual Type | Notes & Artifacts | Context |", "| Excerpt | Type | Notes | Context |");
    await writeFile(planPath, malformed, "utf8");

    const validation = await runPlanValidate({ project: workspace.essayProject });
    assert.equal(validation.ok, false);
    assert.ok((validation.errors || []).length > 0);
  } finally {
    await cleanupFixtureWorkspace(workspace);
  }
});
