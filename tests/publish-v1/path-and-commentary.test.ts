/**
 * This file verifies project-path safety and ensures Commentary projects are supported
 * with the same capability behavior as Essays projects.
 */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { runPlanGenerate } from "../../src/capabilities/plan-generate.js";
import { resolveProjectPaths } from "../../src/io/project-paths.js";
import { cleanupFixtureWorkspace, createFixtureWorkspace } from "./test-helpers.js";

test("plan-generate works for Commentary projects", async () => {
  const workspace = await createFixtureWorkspace();

  try {
    const result = await runPlanGenerate({
      project: workspace.commentaryProject,
      source: "essay.md"
    });

    assert.equal(result.ok, true);
  } finally {
    await cleanupFixtureWorkspace(workspace);
  }
});

test("path resolver rejects non-project roots and unsupported categories", async () => {
  const workspace = await createFixtureWorkspace();

  try {
    const nonRootPath = path.join(workspace.essayProject, "drafts");
    await assert.rejects(() => resolveProjectPaths(nonRootPath));

    const fictionProject = path.join(workspace.creativeRoot, "Fiction", "novel-seed");
    await mkdir(fictionProject, { recursive: true });
    await assert.rejects(() => resolveProjectPaths(fictionProject));
  } finally {
    await cleanupFixtureWorkspace(workspace);
  }
});
