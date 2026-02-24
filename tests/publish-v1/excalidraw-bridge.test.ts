/**
 * This file verifies Press first-party Excalidraw MCP bridge behavior. It exists so
 * we can guarantee that diagram operations route through MCP protocol when configured,
 * instead of silently regressing to ad-hoc local JSON workflows.
 *
 * It talks to the bridge script via child process calls and uses a deterministic mock
 * MCP server fixture for protocol-level assertions.
 */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);

function bridgeScriptPath(): string {
  return path.resolve("scripts", "excalidraw-mcp-bridge.ts");
}

function mockServerCommand(): string {
  return `node ${path.resolve("tests", "fixtures", "mcp", "mock-excalidraw-mcp-server.js")}`;
}

test("excalidraw bridge check succeeds against configured MCP command", async () => {
  const { stdout } = await execFileAsync(
    "node",
    ["--import", "tsx", bridgeScriptPath(), "--check"],
    {
      env: {
        ...process.env,
        PRESS_EXCALIDRAW_MCP_SERVER_CMD: mockServerCommand()
      }
    }
  );

  const parsed = JSON.parse(stdout);
  assert.equal(parsed.ok, true);
  assert.ok(Array.isArray(parsed.tools));
  assert.ok(parsed.tools.includes("create_excalidraw_diagram"));
});

test("excalidraw bridge create operation returns normalized content payload", async () => {
  const payload = {
    title: "diagram-01",
    excerpt: "\"opening...closing\"",
    sourceText: "some source text"
  };

  const { stdout } = await execFileAsync(
    "node",
    ["--import", "tsx", bridgeScriptPath(), "create", JSON.stringify(payload)],
    {
      env: {
        ...process.env,
        PRESS_EXCALIDRAW_MCP_SERVER_CMD: mockServerCommand()
      }
    }
  );

  const parsed = JSON.parse(stdout);
  assert.equal(typeof parsed.content, "string");
  assert.match(parsed.content, /"source": "mock-mcp"/);
  assert.equal(parsed.webUrl, "https://example.com/mock-diagram");
});
