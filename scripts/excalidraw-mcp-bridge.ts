/**
 * This file is Press's first-party bridge to an Excalidraw MCP server. It exists so
 * Press can perform diagram create/refine operations through MCP protocol instead of
 * assuming agents will manually author `.excalidraw` JSON.
 *
 * The Press runtime invokes this bridge as an external command. The bridge discovers a
 * configured MCP server command, performs JSON-RPC initialization over stdio, resolves
 * suitable tool names, and returns normalized JSON back to Press.
 */
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface BridgeOutput {
  content: string;
  webUrl?: string;
  warnings?: string[];
}

interface McpTool {
  name: string;
  description?: string;
}

interface PressLocalConfig {
  excalidrawMcpCommand?: string;
}

interface RpcResponse {
  id?: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

class McpStdioClient {
  private readonly child: ChildProcessWithoutNullStreams;
  private readonly pending = new Map<
    number,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
    }
  >();
  private nextId = 1;
  private buffer = Buffer.alloc(0);

  constructor(command: string) {
    // We use shell execution because users may configure MCP commands with inline args.
    this.child = spawn(command, {
      shell: true,
      stdio: ["pipe", "pipe", "pipe"]
    });

    this.child.stdout.on("data", (chunk: Buffer) => {
      this.onData(chunk);
    });

    this.child.stderr.on("data", () => {
      // Stderr is intentionally not fatal by itself; toolchains may log diagnostics.
    });

    this.child.on("exit", (code) => {
      if (code === 0) {
        return;
      }

      const message = `MCP server exited with code ${code ?? "unknown"}.`;
      for (const { reject } of this.pending.values()) {
        reject(new Error(message));
      }
      this.pending.clear();
    });
  }

  async initialize(): Promise<void> {
    await this.request("initialize", {
      protocolVersion: "2024-11-05",
      clientInfo: {
        name: "press",
        version: "0.1.0"
      },
      capabilities: {}
    });

    // MCP expects this notification after initialize handshake.
    this.notify("notifications/initialized", {});
  }

  async listTools(): Promise<McpTool[]> {
    const result = (await this.request("tools/list", {})) as { tools?: McpTool[] };
    return result.tools || [];
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    return this.request("tools/call", {
      name,
      arguments: args
    });
  }

  close(): void {
    this.child.kill();
  }

  private notify(method: string, params: Record<string, unknown>): void {
    const payload = {
      jsonrpc: "2.0",
      method,
      params
    };

    const body = JSON.stringify(payload);
    const header = `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n`;
    this.child.stdin.write(`${header}${body}`);
  }

  private async request(method: string, params: Record<string, unknown>): Promise<unknown> {
    const id = this.nextId;
    this.nextId += 1;

    const payload = {
      jsonrpc: "2.0",
      id,
      method,
      params
    };

    const body = JSON.stringify(payload);
    const header = `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n`;

    const promise = new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });

    this.child.stdin.write(`${header}${body}`);
    return promise;
  }

  private onData(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    while (true) {
      const separator = this.buffer.indexOf("\r\n\r\n");
      if (separator === -1) {
        return;
      }

      const headerText = this.buffer.slice(0, separator).toString("utf8");
      const lengthMatch = headerText.match(/Content-Length:\s*(\d+)/i);
      if (!lengthMatch) {
        throw new Error("Received MCP message without Content-Length header.");
      }

      const bodyLength = Number(lengthMatch[1]);
      const messageStart = separator + 4;
      const messageEnd = messageStart + bodyLength;

      if (this.buffer.length < messageEnd) {
        return;
      }

      const body = this.buffer.slice(messageStart, messageEnd).toString("utf8");
      this.buffer = this.buffer.slice(messageEnd);

      const parsed = JSON.parse(body) as RpcResponse;
      if (typeof parsed.id !== "number") {
        continue;
      }

      const pending = this.pending.get(parsed.id);
      if (!pending) {
        continue;
      }

      this.pending.delete(parsed.id);

      if (parsed.error) {
        pending.reject(new Error(`MCP error ${parsed.error.code}: ${parsed.error.message}`));
        continue;
      }

      pending.resolve(parsed.result);
    }
  }
}

async function readLocalConfig(repoRoot: string): Promise<PressLocalConfig | null> {
  const configPath = path.join(repoRoot, ".press-local.json");

  try {
    const raw = await readFile(configPath, "utf8");
    return JSON.parse(raw) as PressLocalConfig;
  } catch {
    return null;
  }
}

function scoreToolName(toolName: string, operation: "create" | "refine"): number {
  const normalized = toolName.toLowerCase();
  const diagramSignal = Number(
    normalized.includes("diagram") || normalized.includes("excalidraw")
  );

  if (operation === "create") {
    const createSignal = Number(normalized.includes("create") || normalized.includes("generate"));
    return createSignal * 10 + diagramSignal;
  }

  const refineSignal = Number(
    normalized.includes("refine") || normalized.includes("update") || normalized.includes("edit")
  );
  return refineSignal * 10 + diagramSignal;
}

function chooseToolName(
  tools: McpTool[],
  operation: "create" | "refine",
  explicitName?: string
): string {
  if (explicitName) {
    return explicitName;
  }

  let best: { name: string; score: number } | null = null;

  for (const tool of tools) {
    const score = scoreToolName(tool.name, operation);
    if (!best || score > best.score) {
      best = {
        name: tool.name,
        score
      };
    }
  }

  if (!best || best.score < 11) {
    throw new Error(
      `Could not infer an Excalidraw ${operation} tool from MCP server tools list.`
    );
  }

  return best.name;
}

function coerceBridgeOutput(raw: unknown): BridgeOutput {
  const warnings: string[] = [];

  const object = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};

  const structured =
    typeof object.structuredContent === "object" && object.structuredContent !== null
      ? (object.structuredContent as Record<string, unknown>)
      : null;

  if (structured && typeof structured.content === "string") {
    return {
      content: structured.content,
      webUrl: typeof structured.webUrl === "string" ? structured.webUrl : undefined,
      warnings: Array.isArray(structured.warnings)
        ? structured.warnings.filter((entry): entry is string => typeof entry === "string")
        : warnings
    };
  }

  if (typeof object.content === "string") {
    return {
      content: object.content,
      webUrl: typeof object.webUrl === "string" ? object.webUrl : undefined,
      warnings
    };
  }

  const contentArray = Array.isArray(object.content)
    ? object.content.filter((entry): entry is Record<string, unknown> => typeof entry === "object")
    : [];

  const textEntries = contentArray
    .map((entry) => entry.text)
    .filter((entry): entry is string => typeof entry === "string");

  if (textEntries.length > 0) {
    // Many MCP servers return textual payloads. We try JSON first, then raw text.
    const first = textEntries[0];

    try {
      const parsed = JSON.parse(first) as Record<string, unknown>;
      if (typeof parsed.content === "string") {
        return {
          content: parsed.content,
          webUrl: typeof parsed.webUrl === "string" ? parsed.webUrl : undefined,
          warnings: Array.isArray(parsed.warnings)
            ? parsed.warnings.filter((entry): entry is string => typeof entry === "string")
            : warnings
        };
      }
    } catch {
      return {
        content: first,
        warnings
      };
    }
  }

  throw new Error("MCP tool response did not include diagram content.");
}

async function resolveServerCommand(repoRoot: string): Promise<string> {
  if (process.env.PRESS_EXCALIDRAW_MCP_SERVER_CMD?.trim()) {
    return process.env.PRESS_EXCALIDRAW_MCP_SERVER_CMD.trim();
  }

  if (process.env.EXCALIDRAW_MCP_SERVER_CMD?.trim()) {
    return process.env.EXCALIDRAW_MCP_SERVER_CMD.trim();
  }

  const localConfig = await readLocalConfig(repoRoot);
  if (localConfig?.excalidrawMcpCommand?.trim()) {
    return localConfig.excalidrawMcpCommand.trim();
  }

  throw new Error(
    "Excalidraw MCP command is not configured. Set PRESS_EXCALIDRAW_MCP_SERVER_CMD or configure excalidrawMcpCommand in .press-local.json."
  );
}

async function runCheck(repoRoot: string): Promise<void> {
  const command = await resolveServerCommand(repoRoot);
  const client = new McpStdioClient(command);

  try {
    await client.initialize();
    const tools = await client.listTools();

    console.log(
      JSON.stringify(
        {
          ok: true,
          toolCount: tools.length,
          tools: tools.map((tool) => tool.name)
        },
        null,
        2
      )
    );
  } finally {
    client.close();
  }
}

async function runOperation(
  repoRoot: string,
  operation: "create" | "refine",
  payload: Record<string, unknown>
): Promise<void> {
  const command = await resolveServerCommand(repoRoot);
  const client = new McpStdioClient(command);

  const explicitToolName =
    operation === "create"
      ? process.env.PRESS_EXCALIDRAW_MCP_CREATE_TOOL
      : process.env.PRESS_EXCALIDRAW_MCP_REFINE_TOOL;

  try {
    await client.initialize();
    const tools = await client.listTools();
    const toolName = chooseToolName(tools, operation, explicitToolName);
    const result = await client.callTool(toolName, payload);
    const output = coerceBridgeOutput(result);

    console.log(
      JSON.stringify(
        {
          ...output,
          warnings: output.warnings || []
        },
        null,
        2
      )
    );
  } finally {
    client.close();
  }
}

async function main(): Promise<void> {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const argv = process.argv.slice(2);

  if (argv[0] === "--help" || argv[0] === "help") {
    console.log(
      "Usage: node --import tsx scripts/excalidraw-mcp-bridge.ts <create|refine> '<json-payload>'\n       node --import tsx scripts/excalidraw-mcp-bridge.ts --check"
    );
    return;
  }

  if (argv[0] === "--check") {
    await runCheck(repoRoot);
    return;
  }

  const operation = argv[0];
  if (operation !== "create" && operation !== "refine") {
    throw new Error(`Unknown operation: ${operation || "(missing)"}`);
  }

  const payloadRaw = argv[1];
  if (!payloadRaw) {
    throw new Error("Missing JSON payload argument.");
  }

  const payload = JSON.parse(payloadRaw) as Record<string, unknown>;
  await runOperation(repoRoot, operation, payload);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
