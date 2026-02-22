/**
 * This file converts markdown text into plan-friendly units. It exists so capability
 * files can focus on workflow decisions while this module handles parsing and excerpt
 * behavior in one place.
 *
 * It talks to the filesystem for source reads and exports helpers used by both diagram
 * and plan generation routines.
 */
import { readFile } from "node:fs/promises";
import { type Passage } from "../contracts/types.js";

export async function readMarkdownFile(filePath: string): Promise<string> {
  return readFile(filePath, "utf8");
}

export function splitIntoPassages(markdown: string): Passage[] {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const chunks = normalized
    .split(/\n\s*\n/g)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);

  // We intentionally preserve source order because context labels depend on sequence.
  return chunks.map((text, index) => ({ index, text }));
}

export function buildExcerpt(passageText: string, edgeWords = 6): string {
  const flattened = passageText.replace(/\s+/g, " ").trim();
  if (!flattened) {
    return "\"\"";
  }

  const words = flattened.split(" ");
  if (words.length <= edgeWords * 2) {
    return `\"${flattened}\"`;
  }

  const opening = words.slice(0, edgeWords).join(" ");
  const closing = words.slice(-edgeWords).join(" ");
  return `\"${opening}...${closing}\"`;
}

export function normalizeSearchString(value: string): string {
  return value
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function extractExcerptParts(excerpt: string): { start: string; end: string } {
  const stripped = excerpt.replace(/^"|"$/g, "").trim();
  const [startPart, endPart] = stripped.split("...");
  return {
    start: (startPart || "").trim(),
    end: (endPart || startPart || "").trim()
  };
}

export function sourceContainsExcerpt(sourceText: string, excerpt: string): boolean {
  const source = normalizeSearchString(sourceText);
  const { start, end } = extractExcerptParts(excerpt);

  if (!start) {
    return false;
  }

  const startIndex = source.indexOf(normalizeSearchString(start));
  if (startIndex === -1) {
    return false;
  }

  const endIndex = source.indexOf(normalizeSearchString(end), startIndex);
  return endIndex !== -1;
}

export function suggestSearchTerms(passageText: string, limit = 6): string {
  const tokens = passageText
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const stopWords = new Set([
    "the",
    "and",
    "that",
    "with",
    "this",
    "from",
    "into",
    "about",
    "there",
    "because",
    "while",
    "where",
    "when",
    "which",
    "your",
    "their",
    "then",
    "than",
    "have",
    "just",
    "been",
    "were"
  ]);

  const filtered = tokens.filter((token) => token.length > 2 && !stopWords.has(token));
  return filtered.slice(0, limit).join(" ");
}
