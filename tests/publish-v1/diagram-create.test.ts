/**
 * This file verifies diagram creation behavior, including idempotent reuse and support
 * for multiple markdown sources within one project. It is separate from refine tests
 * so creation semantics remain explicit.
 */
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { runDiagramCreate } from "../../src/capabilities/diagram-create.js";
import {
  cleanupFixtureWorkspace,
  createFixtureWorkspace,
  listDiagramFiles,
  readText
} from "./test-helpers.js";

test("diagram-create creates a first artifact and reuses it for the same excerpt", async () => {
  const workspace = await createFixtureWorkspace();

  try {
    const first = await runDiagramCreate({
      project: workspace.essayProject,
      source: "discovery/thread-01.md",
      excerpt: "\"Discipline is a system...becomes the default path.\"",
      intent: "Map the system relationship"
    });

    assert.equal(first.ok, true);
    assert.equal(first.data?.filename, "diagram-01.excalidraw");

    const second = await runDiagramCreate({
      project: workspace.essayProject,
      source: "discovery/thread-01.md",
      excerpt: "\"Discipline is a system...becomes the default path.\""
    });

    assert.equal(second.ok, true);
    assert.equal(second.data?.reused, true);

    const diagrams = await listDiagramFiles(workspace.essayProject);
    assert.deepEqual(diagrams, ["diagram-01.excalidraw"]);
  } finally {
    await cleanupFixtureWorkspace(workspace);
  }
});

test("diagram-create supports additional sources and increments naming", async () => {
  const workspace = await createFixtureWorkspace();

  try {
    await runDiagramCreate({
      project: workspace.essayProject,
      source: "discovery/thread-01.md",
      excerpt: "\"Discipline is a system...becomes the default path.\""
    });

    const second = await runDiagramCreate({
      project: workspace.essayProject,
      source: "drafts/draft-01.md",
      excerpt: "\"When a system includes cues...behavior becomes repeatable.\""
    });

    assert.equal(second.ok, true);
    assert.equal(second.data?.filename, "diagram-02.excalidraw");

    const linksPath = path.join(workspace.essayProject, "artifacts", "diagram-links.md");
    const links = await readText(linksPath);
    assert.match(links, /diagram-01\.excalidraw/);
    assert.match(links, /diagram-02\.excalidraw/);
  } finally {
    await cleanupFixtureWorkspace(workspace);
  }
});
