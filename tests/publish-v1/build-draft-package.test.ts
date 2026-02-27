/**
 * This file verifies article draft package generation for V1.5. It exists so publish
 * handoff files stay deterministic and complete across Substack, LessWrong, and X.
 *
 * It talks to fixture workspaces and runs the capability directly to validate outputs.
 */
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { runBuildDraftPackage } from "../../src/capabilities/build-draft-package.js";
import { runPlanGenerate } from "../../src/capabilities/plan-generate.js";
import { cleanupFixtureWorkspace, createFixtureWorkspace } from "./test-helpers.js";

test("build-draft-package generates required handoff files", async () => {
  const workspace = await createFixtureWorkspace();

  try {
    await runPlanGenerate({
      project: workspace.essayProject,
      source: "essay.md"
    });

    const result = await runBuildDraftPackage({
      project: workspace.essayProject,
      source: "essay.md"
    });

    assert.equal(result.ok, true);

    const packageDir = path.join(workspace.essayProject, "artifacts", "publish-draft-package");
    const required = ["substack.md", "lesswrong.md", "x-article.md", "metadata.json", "README.md"];

    for (const filename of required) {
      const filePath = path.join(packageDir, filename);
      const content = await readFile(filePath, "utf8");
      assert.ok(content.length > 0);
    }

    const metadataRaw = await readFile(path.join(packageDir, "metadata.json"), "utf8");
    const metadata = JSON.parse(metadataRaw) as { title?: string; diagramCount?: number };
    assert.equal(typeof metadata.title, "string");
    assert.equal(typeof metadata.diagramCount, "number");
  } finally {
    await cleanupFixtureWorkspace(workspace);
  }
});

test("build-draft-package defaults source to essay.md", async () => {
  const workspace = await createFixtureWorkspace();

  try {
    const result = await runBuildDraftPackage({
      project: workspace.essayProject
    });

    assert.equal(result.ok, true);
    const filePath = path.join(
      workspace.essayProject,
      "artifacts",
      "publish-draft-package",
      "substack.md"
    );
    const content = await readFile(filePath, "utf8");
    assert.match(content, /^# /);
  } finally {
    await cleanupFixtureWorkspace(workspace);
  }
});
