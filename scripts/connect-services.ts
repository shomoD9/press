/**
 * This file configures external service connections for Press from one guided command.
 * It exists so plugin/UI flows can update Excalidraw MCP settings without manual file
 * editing and immediately verify whether the configured command is usable.
 *
 * It talks to `.press-local.json` for persisted settings and to the first-party MCP
 * bridge for runtime health validation.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

interface ConnectArgs {
  vaultPath?: string;
  excalidrawMcpCommand: string;
}

interface LocalConfig {
  vaultPath?: string;
  channel?: string;
  excalidrawMcpCommand?: string;
  [key: string]: unknown;
}

function parseArgs(argv: string[]): ConnectArgs {
  let vaultPath: string | undefined;
  let excalidrawMcpCommand = "";

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--vault") {
      vaultPath = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--excalidraw-mcp-command") {
      excalidrawMcpCommand = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (token === "--help" || token === "help") {
      console.log(
        "Usage: node --import tsx scripts/connect-services.ts --excalidraw-mcp-command \"<server command>\" [--vault \"/absolute/path/to/creative\"]"
      );
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  if (!excalidrawMcpCommand.trim()) {
    throw new Error("Missing required --excalidraw-mcp-command value.");
  }

  return {
    vaultPath,
    excalidrawMcpCommand: excalidrawMcpCommand.trim()
  };
}

async function loadConfig(configPath: string): Promise<LocalConfig> {
  try {
    const raw = await readFile(configPath, "utf8");
    return JSON.parse(raw) as LocalConfig;
  } catch {
    return {};
  }
}

function runBridgeCheck(repoRoot: string, excalidrawMcpCommand: string): { ok: boolean; error?: string } {
  const bridge = path.join(repoRoot, "scripts", "excalidraw-mcp-bridge.ts");
  const check = spawnSync("node", ["--import", "tsx", bridge, "--check"], {
    encoding: "utf8",
    env: {
      ...process.env,
      PRESS_EXCALIDRAW_MCP_SERVER_CMD: excalidrawMcpCommand
    }
  });

  if (check.status !== 0) {
    const errorOutput = (check.stderr || check.stdout || "").trim();
    return {
      ok: false,
      error: errorOutput || "Bridge check failed."
    };
  }

  return { ok: true };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const configPath = path.join(repoRoot, ".press-local.json");

  const current = await loadConfig(configPath);
  const next: LocalConfig = {
    ...current,
    channel: "stable",
    excalidrawMcpCommand: args.excalidrawMcpCommand,
    lastServiceConnectAt: new Date().toISOString()
  };

  if (args.vaultPath?.trim()) {
    next.vaultPath = path.resolve(args.vaultPath);
  }

  await writeFile(configPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");

  // We validate immediately so UI flows can show a clear green/red state.
  const check = runBridgeCheck(repoRoot, args.excalidrawMcpCommand);
  if (!check.ok) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          status: "NOT READY",
          fixAction: "Re-open Press: Connect Services and provide a working Excalidraw MCP command.",
          error: check.error
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        status: "READY",
        message: "Excalidraw service connection saved and validated."
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.log(
    JSON.stringify(
      {
        ok: false,
        status: "NOT READY",
        fixAction: "Re-open Press: Connect Services and retry with a valid command.",
        error: message
      },
      null,
      2
    )
  );
  process.exit(1);
});
