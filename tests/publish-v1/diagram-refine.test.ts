/**
 * This file verifies in-place refinement behavior so iterative chat edits update the
 * same diagram artifact instead of generating duplicates.
 */
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { runDiagramCreate } from "../../src/capabilities/diagram-create.js";
import { runDiagramRefine } from "../../src/capabilities/diagram-refine.js";
import { cleanupFixtureWorkspace, createFixtureWorkspace, readText } from "./test-helpers.js";

test("diagram-refine updates the same file and increments revisions", async () => {
  const workspace = await createFixtureWorkspace();

  try {
    const created = await runDiagramCreate({
      project: workspace.essayProject,
      source: "essay.md",
      excerpt: "\"A system that links cues...parts is the argument.\""
    });

    assert.equal(created.ok, true);
    assert.equal(created.data?.filename, "diagram-01.excalidraw");

    const diagramPath = path.join(workspace.essayProject, "artifacts", "diagram-01.excalidraw");
    const before = await readText(diagramPath);

    const refined = await runDiagramRefine({
      project: workspace.essayProject,
      diagram: "diagram-01",
      instruction: "Split this into three labeled parts and simplify wording."
    });

    assert.equal(refined.ok, true);
    assert.equal(refined.data?.revisions, 1);

    const after = await readText(diagramPath);
    assert.notEqual(after, before);
    assert.match(after, /Split this into three labeled parts/);
  } finally {
    await cleanupFixtureWorkspace(workspace);
  }
});
