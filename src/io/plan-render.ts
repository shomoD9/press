/**
 * This file translates between structured plan rows and markdown tables. It exists so
 * the human-facing file format stays stable even if internal data structures evolve.
 *
 * It talks to typed plan rows and is used by both generation and validation commands.
 */
import { readFile, writeFile } from "node:fs/promises";
import { type PlanRow, type ProjectPaths } from "../contracts/types.js";
import { assertWriteTarget } from "./project-paths.js";

const REQUIRED_HEADER = ["Excerpt", "Visual Type", "Notes & Artifacts", "Context"];

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>").trim();
}

function splitTableRow(row: string): string[] {
  const stripped = row.trim().replace(/^\|/, "").replace(/\|$/, "");
  const parts = stripped.split(/(?<!\\)\|/g);
  return parts.map((part) => part.replace(/\\\|/g, "|").trim());
}

export function renderVisualPlan(rows: PlanRow[]): string {
  const lines: string[] = [];
  lines.push("# Visual Plan");
  lines.push("");
  lines.push(
    "This table only contains departures from the default on-camera state. Any passage not listed here remains on camera."
  );
  lines.push("");
  lines.push(`| ${REQUIRED_HEADER.join(" | ")} |`);
  lines.push("| --- | --- | --- | --- |");

  for (const row of rows) {
    lines.push(
      `| ${escapeCell(row.excerpt)} | ${escapeCell(row.visualType)} | ${escapeCell(
        row.notesArtifacts
      )} | ${escapeCell(row.context)} |`
    );
  }

  return `${lines.join("\n")}\n`;
}

export async function writeVisualPlan(paths: ProjectPaths, rows: PlanRow[]): Promise<void> {
  const markdown = renderVisualPlan(rows);
  assertWriteTarget(paths, paths.visualPlanFile);
  await writeFile(paths.visualPlanFile, markdown, "utf8");
}

export interface ParsedPlanTable {
  headers: string[];
  rows: string[][];
  errors: string[];
}

export function parseVisualPlan(markdown: string): ParsedPlanTable {
  const lines = markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));

  const errors: string[] = [];

  if (lines.length < 2) {
    return {
      headers: [],
      rows: [],
      errors: ["Visual plan table was not found or is incomplete."]
    };
  }

  const headers = splitTableRow(lines[0]);
  if (headers.length !== REQUIRED_HEADER.length) {
    errors.push("Visual plan table header has an unexpected number of columns.");
  }

  // We validate exact header names so external tooling can rely on stable table semantics.
  for (let index = 0; index < REQUIRED_HEADER.length; index += 1) {
    if (headers[index] !== REQUIRED_HEADER[index]) {
      errors.push(
        `Header mismatch at column ${index + 1}: expected "${REQUIRED_HEADER[index]}", received "${headers[index] || ""}".`
      );
    }
  }

  const rows: string[][] = [];
  for (const line of lines.slice(2)) {
    const cells = splitTableRow(line);
    if (cells.length !== REQUIRED_HEADER.length) {
      errors.push(`Malformed row detected: ${line}`);
      continue;
    }

    rows.push(cells);
  }

  return { headers, rows, errors };
}

export async function readAndParseVisualPlan(paths: ProjectPaths): Promise<ParsedPlanTable> {
  const markdown = await readFile(paths.visualPlanFile, "utf8");
  return parseVisualPlan(markdown);
}
