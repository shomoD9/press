/**
 * This file is the boundary between Press and Excalidraw tooling. It exists so the
 * rest of Publish V1 can stay deterministic even if the MCP implementation changes.
 *
 * Capabilities call this adapter for diagram create/refine operations. The adapter can
 * invoke an external executable when configured, or fall back to a local placeholder
 * representation that keeps the workflow unblocked.
 */
import { spawnSync } from "node:child_process";
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

function runExternalTool(operation: string, payload: unknown): ExternalToolResponse | null {
  const executable = process.env.PRESS_EXCALIDRAW_EXEC;
  if (!executable) {
    return null;
  }

  const argumentString = process.env.PRESS_EXCALIDRAW_ARGS || "";
  const extraArgs = argumentString
    .split(" ")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const result = spawnSync(executable, [...extraArgs, operation, JSON.stringify(payload)], {
    encoding: "utf8"
  });

  if (result.status !== 0) {
    return {
      content: "",
      warnings: [
        `Excalidraw executable failed for ${operation}. Falling back to local placeholder output.`
      ]
    };
  }

  const parsed = safeParseJson<ExternalToolResponse>(result.stdout || "");
  if (!parsed || typeof parsed.content !== "string") {
    return {
      content: "",
      warnings: [
        `Excalidraw executable returned invalid JSON for ${operation}. Falling back to local placeholder output.`
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
          "Excalidraw web link unavailable in this run; local .excalidraw file remains the source of truth."
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
          "Excalidraw web link unavailable in this refine run; local .excalidraw file remains the source of truth."
        ]
      };
    }
  };
}
