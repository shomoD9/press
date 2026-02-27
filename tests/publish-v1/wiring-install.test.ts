/**
 * This file verifies vault wiring installation behavior. It exists because Press only
 * feels chat-native when marker-based wiring stays reliable, idempotent, and safe
 * across repeated installs and imperfect manual edits.
 *
 * It talks directly to the install-wiring script API using temporary vault fixtures.
 */
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { installWiring } from "../../scripts/install-wiring.ts";

interface WiringWorkspace {
  root: string;
  creative: string;
  system: string;
}

async function createWiringWorkspace(options: {
  withClaude?: boolean;
  withAgents?: boolean;
}): Promise<WiringWorkspace> {
  const root = await mkdtemp(path.join(os.tmpdir(), "press-wiring-"));
  const creative = path.join(root, "creative");
  const system = path.join(creative, "_system");

  await mkdir(system, { recursive: true });
  await writeFile(path.join(system, "visual-trigger-ruleset.md"), "rules", "utf8");

  if (options.withClaude !== false) {
    await writeFile(path.join(system, "CLAUDE.md"), "# CLAUDE\n", "utf8");
  }

  if (options.withAgents !== false) {
    await writeFile(path.join(system, "AGENTS.md"), "# AGENTS\n", "utf8");
  }

  return { root, creative, system };
}

async function cleanup(workspace: WiringWorkspace): Promise<void> {
  await rm(workspace.root, { recursive: true, force: true });
}

async function markerCount(filePath: string): Promise<number> {
  const content = await readFile(filePath, "utf8");
  const matches = content.match(/PRESS_WIRING:BEGIN/g);
  return matches ? matches.length : 0;
}

test("install-wiring writes press-wiring.md and updates CLAUDE/AGENTS files", async () => {
  const workspace = await createWiringWorkspace({ withClaude: true, withAgents: true });

  try {
    const result = await installWiring({
      vaultPath: workspace.creative,
      pressCommand: "node /custom/press/dist/index.js"
    });

    assert.ok(result.updatedFiles.some((file) => file.endsWith("press-wiring.md")));
    assert.ok(result.updatedFiles.some((file) => file.endsWith("_system/CLAUDE.md")));
    assert.ok(result.updatedFiles.some((file) => file.endsWith("_system/AGENTS.md")));

    const wiring = await readFile(path.join(workspace.system, "press-wiring.md"), "utf8");
    assert.match(wiring, /node \/custom\/press\/dist\/index\.js/);
    assert.match(wiring, /publish\.build_draft_package/);
    assert.match(wiring, /Agent Preflight/);

    const claude = await readFile(path.join(workspace.system, "CLAUDE.md"), "utf8");
    const agents = await readFile(path.join(workspace.system, "AGENTS.md"), "utf8");

    assert.match(claude, /PRESS_WIRING:BEGIN/);
    assert.match(agents, /PRESS_WIRING:BEGIN/);
  } finally {
    await cleanup(workspace);
  }
});

test("install-wiring creates root-level agent files for multi-agent discovery", async () => {
  const workspace = await createWiringWorkspace({ withClaude: true, withAgents: true });

  try {
    const result = await installWiring({ vaultPath: workspace.creative });

    for (const fileName of ["CLAUDE.md", "AGENTS.md", "WARP.md", "CODEX.md", "CURSOR.md"]) {
      const filePath = path.join(workspace.creative, fileName);
      const content = await readFile(filePath, "utf8");
      assert.match(content, /PRESS_WIRING:BEGIN/);
      assert.ok(result.updatedFiles.includes(filePath));
    }

    assert.ok(result.createdFiles.some((file) => file.endsWith("WARP.md")));
  } finally {
    await cleanup(workspace);
  }
});

test("install-wiring is idempotent and does not duplicate marker blocks", async () => {
  const workspace = await createWiringWorkspace({ withClaude: true, withAgents: true });

  try {
    await installWiring({ vaultPath: workspace.creative });
    const second = await installWiring({ vaultPath: workspace.creative });

    assert.equal(second.updatedFiles.length, 0);

    const claudePath = path.join(workspace.system, "CLAUDE.md");
    const agentsPath = path.join(workspace.system, "AGENTS.md");
    const rootWarpPath = path.join(workspace.creative, "WARP.md");

    assert.equal(await markerCount(claudePath), 1);
    assert.equal(await markerCount(agentsPath), 1);
    assert.equal(await markerCount(rootWarpPath), 1);
  } finally {
    await cleanup(workspace);
  }
});

test("install-wiring succeeds when only one _system instruction file exists", async () => {
  const workspace = await createWiringWorkspace({ withClaude: true, withAgents: false });

  try {
    const result = await installWiring({ vaultPath: workspace.creative });

    assert.ok(result.updatedFiles.some((file) => file.endsWith("_system/CLAUDE.md")));
    assert.ok(result.skippedFiles.some((file) => file.endsWith("_system/AGENTS.md")));
  } finally {
    await cleanup(workspace);
  }
});

test("install-wiring creates backup and warning when marker conflict is detected", async () => {
  const workspace = await createWiringWorkspace({ withClaude: true, withAgents: false });

  try {
    const claudePath = path.join(workspace.system, "CLAUDE.md");

    // We deliberately break marker structure to verify conflict backup behavior.
    await writeFile(
      claudePath,
      "# CLAUDE\n\n<!-- PRESS_WIRING:BEGIN -->\npartial block without end marker\n",
      "utf8"
    );

    const result = await installWiring({ vaultPath: workspace.creative });
    assert.ok(result.warnings.length > 0);
    assert.ok(result.backups.some((file) => file.endsWith(".bak")));

    const files = await readdir(workspace.system);
    assert.ok(files.some((file) => file.includes("CLAUDE.md") && file.endsWith(".bak")));

    const repaired = await readFile(claudePath, "utf8");
    assert.equal((repaired.match(/PRESS_WIRING:BEGIN/g) || []).length, 2);
  } finally {
    await cleanup(workspace);
  }
});
