/**
 * This file is the boundary between Press and Excalidraw tooling. It exists so the
 * rest of Publish V1 can stay deterministic even as MCP/server details evolve.
 *
 * Capabilities call this adapter for diagram create/refine operations. The adapter
 * first tries a configured external command, then defaults to Press's first-party MCP
 * bridge script, and finally falls back to local placeholder output when no MCP path
 * is available.
 */
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type ExcalidrawOperationResult } from "../contracts/types.js";

interface CreateDiagramInput {
  title: string;
  excerpt: string;
  intent?: string;
  sourceText: string;
}

interface RefineDiagramInput {
  diagramId: string;
  existingContent: string;
  instruction: string;
}

interface ExcalidrawAdapter {
  createDiagram(input: CreateDiagramInput): Promise<ExcalidrawOperationResult>;
  refineDiagram(input: RefineDiagramInput): Promise<ExcalidrawOperationResult>;
}

interface ExternalToolResponse {
  content: string;
  webUrl?: string;
  warnings?: string[];
}

interface ExternalCommandConfig {
  executable: string;
  args: string[];
  source: "explicit-env" | "first-party-bridge";
}

function safeParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function buildFallbackDiagramContent(metadata: Record<string, unknown>): string {
  return JSON.stringify(
    {
      type: "excalidraw",
      version: 2,
      source: "https://press.local",
      elements: [],
      appState: {
        viewBackgroundColor: "#ffffff",
        gridSize: null
      },
      files: {},
      press: metadata
    },
    null,
    2
  );
}

function parseArgsString(raw: string): string[] {
  return raw
    .split(" ")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function resolveExternalCommand(): ExternalCommandConfig | null {
  const explicitExecutable = process.env.PRESS_EXCALIDRAW_EXEC?.trim();
  if (explicitExecutable) {
    return {
      executable: explicitExecutable,
      args: parseArgsString(process.env.PRESS_EXCALIDRAW_ARGS || ""),
      source: "explicit-env"
    };
  }

  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const bridgePath = path.join(repoRoot, "scripts", "excalidraw-mcp-bridge.ts");

  if (!existsSync(bridgePath)) {
    return null;
  }

  // First-party bridge is our default integration path for Excalidraw MCP.
  return {
    executable: "node",
    args: ["--import", "tsx", bridgePath],
    source: "first-party-bridge"
  };
}

function runExternalTool(operation: string, payload: unknown): ExternalToolResponse | null {
  const command = resolveExternalCommand();
  if (!command) {
    return null;
  }

  const result = spawnSync(command.executable, [...command.args, operation, JSON.stringify(payload)], {
    encoding: "utf8",
    env: { ...process.env }
  });

  if (result.error) {
    return {
      content: "",
      warnings: [
        `Excalidraw ${command.source} command failed to start for ${operation}. Falling back to local placeholder output.`
      ]
    };
  }

  if (result.status !== 0) {
    return {
      content: "",
      warnings: [
        `Excalidraw ${command.source} command failed for ${operation}. Falling back to local placeholder output.`
      ]
    };
  }

  const parsed = safeParseJson<ExternalToolResponse>(result.stdout || "");
  if (!parsed || typeof parsed.content !== "string") {
    return {
      content: "",
      warnings: [
        `Excalidraw ${command.source} command returned invalid JSON for ${operation}. Falling back to local placeholder output.`
      ]
    };
  }

  return parsed;
}

export function createExcalidrawAdapter(): ExcalidrawAdapter {
  return {
    async createDiagram(input: CreateDiagramInput): Promise<ExcalidrawOperationResult> {
      const external = runExternalTool("create", input);

      if (external && external.content) {
        return {
          content: external.content,
          webUrl: external.webUrl,
          warnings: external.warnings || []
        };
      }

      // We keep a local artifact even when MCP wiring is absent so writing flow never blocks.
      return {
        content: buildFallbackDiagramContent({
          createdAt: new Date().toISOString(),
          title: input.title,
          excerpt: input.excerpt,
          intent: input.intent || "",
          sourceSummary: input.sourceText.slice(0, 200)
        }),
        warnings: [
          "Excalidraw MCP was unavailable in this run; local .excalidraw file remains the source of truth."
        ]
      };
    },

    async refineDiagram(input: RefineDiagramInput): Promise<ExcalidrawOperationResult> {
      const external = runExternalTool("refine", input);

      if (external && external.content) {
        return {
          content: external.content,
          webUrl: external.webUrl,
          warnings: external.warnings || []
        };
      }

      const parsedExisting = safeParseJson<Record<string, unknown>>(input.existingContent);
      const base = parsedExisting || {
        type: "excalidraw",
        version: 2,
        source: "https://press.local",
        elements: [],
        appState: { viewBackgroundColor: "#ffffff", gridSize: null },
        files: {}
      };

      const pressMetadata =
        typeof base.press === "object" && base.press !== null
          ? (base.press as Record<string, unknown>)
          : {};

      // We annotate fallback revisions so the local artifact still reflects iteration history.
      const merged = {
        ...base,
        press: {
          ...pressMetadata,
          lastRefineInstruction: input.instruction,
          lastRefinedAt: new Date().toISOString(),
          fallbackRefine: true
        }
      };

      return {
        content: `${JSON.stringify(merged, null, 2)}\n`,
        warnings: [
          "Excalidraw MCP was unavailable in this refine run; local .excalidraw file remains the source of truth."
        ]
      };
    }
  };
}
