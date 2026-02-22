/**
 * This file verifies full plan generation behavior and idempotency. It focuses on the
 * main user outcome: a valid departures-only visual-plan table plus stable diagram
 * reuse on repeated runs.
 */
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { runPlanGenerate } from "../../src/capabilities/plan-generate.js";
import { cleanupFixtureWorkspace, createFixtureWorkspace, listDiagramFiles, readText } from "./test-helpers.js";

test("plan-generate creates visual-plan.md with required columns and visual types", async () => {
  const workspace = await createFixtureWorkspace();

  try {
    const result = await runPlanGenerate({
      project: workspace.essayProject,
      source: "essay.md"
    });

    assert.equal(result.ok, true);

    const planPath = path.join(workspace.essayProject, "artifacts", "visual-plan.md");
    const plan = await readText(planPath);

    assert.match(plan, /\| Excerpt \| Visual Type \| Notes & Artifacts \| Context \|/);
    assert.match(plan, /Diagram/);
    assert.match(plan, /B-Roll A \(Atmospheric\)/);
    assert.match(plan, /B-Roll B \(Specific\)/);
    assert.match(plan, /Emphasis/);
  } finally {
    await cleanupFixtureWorkspace(workspace);
  }
});

test("plan-generate is idempotent for diagram files across repeated runs", async () => {
  const workspace = await createFixtureWorkspace();

  try {
    const first = await runPlanGenerate({
      project: workspace.essayProject,
      source: "essay.md"
    });
    assert.equal(first.ok, true);

    const firstDiagrams = await listDiagramFiles(workspace.essayProject);

    const second = await runPlanGenerate({
      project: workspace.essayProject,
      source: "essay.md"
    });
    assert.equal(second.ok, true);

    const secondDiagrams = await listDiagramFiles(workspace.essayProject);
    assert.deepEqual(secondDiagrams, firstDiagrams);
  } finally {
    await cleanupFixtureWorkspace(workspace);
  }
});
