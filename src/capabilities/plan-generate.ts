/**
 * This file generates the complete visual plan from a chosen markdown source. It is
 * separated from lower-level utilities because this is the orchestration layer where
 * trigger interpretation, diagram generation, and markdown output come together.
 *
 * It talks to markdown parsing, state persistence, the diagram capability, and the
 * visual-plan renderer.
 */
import path from "node:path";
import { type CapabilityResult, type PlanRow, type VisualType } from "../contracts/types.js";
import { findDiagramForPlan } from "./diagram-create.js";
import {
  buildExcerpt,
  readMarkdownFile,
  splitIntoPassages,
  suggestSearchTerms
} from "../io/markdown.js";
import { writeVisualPlan } from "../io/plan-render.js";
import { resolveProjectPaths, resolveSourcePath } from "../io/project-paths.js";
import {
  appendWarnings,
  computeContentHash,
  loadPlanState,
  savePlanState,
  writeDiagramLinks
} from "../io/state.js";

export interface PlanGenerateArgs {
  project: string;
  source: string;
}

interface Classification {
  visualType?: VisualType;
  emphasisPattern?: string;
  reasoning: string;
}

function hashToId(seed: string): string {
  const hash = computeContentHash(seed);
  return `row-${hash.slice(0, 10)}`;
}

function detectEmphasisPattern(text: string): string | undefined {
  const compact = text.replace(/\s+/g, " ").trim();
  const wordCount = compact.split(" ").filter(Boolean).length;

  // Emphasis should be a landing line, so we only consider relatively concise statements.
  if (wordCount > 28) {
    return undefined;
  }

  if (/\bnot\b.+\bbut\b/i.test(compact)) {
    return "Reframe";
  }

  if (/^(therefore|in short|in conclusion|to conclude)\b/i.test(compact)) {
    return "Conclusion after a chain";
  }

  if (/\b(this essay argues|i argue|the thesis|discipline is not)\b/i.test(compact)) {
    return "Thesis declaration";
  }

  if (/!/.test(compact) && wordCount <= 20) {
    return "Provocation";
  }

  if (wordCount <= 14 && /\bis\b/i.test(compact)) {
    return "Distillation";
  }

  return undefined;
}

function looksLikeSpecificReference(text: string): boolean {
  const compact = text.replace(/\s+/g, " ");

  // Specific references need explicit source-like language, not just cultural names.
  const explicitMediaSignals = /\b(episode|podcast|interview|scene|clip|trailer|timestamp|minute mark)\b/i;
  const yearSignal = /\b(19|20)\d{2}\b/;
  const personPairSignal = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/;

  if (explicitMediaSignals.test(compact)) {
    return true;
  }

  if (yearSignal.test(compact) && personPairSignal.test(compact)) {
    return true;
  }

  return false;
}

function looksLikeDiagramCandidate(text: string): boolean {
  const keywords = [
    "system",
    "architecture",
    "model",
    "process",
    "relationship",
    "framework",
    "flow",
    "infrastructure",
    "depends",
    "loop"
  ];

  const lowered = text.toLowerCase();
  const hasKeyword = keywords.some((keyword) => lowered.includes(keyword));
  return hasKeyword;
}

function looksLikeAtmosphericPassage(text: string): boolean {
  const keywords = [
    "film",
    "book",
    "historical",
    "culture",
    "cinema",
    "world",
    "atmosphere",
    "aesthetic",
    "era",
    "kubrick"
  ];

  const lowered = text.toLowerCase();
  return keywords.some((keyword) => lowered.includes(keyword));
}

function classifyPassage(text: string): Classification {
  const emphasisPattern = detectEmphasisPattern(text);
  if (emphasisPattern) {
    return {
      visualType: "Emphasis",
      emphasisPattern,
      reasoning: "Detected a concise landing sentence that matches emphasis criteria."
    };
  }

  if (looksLikeSpecificReference(text)) {
    return {
      visualType: "B-Roll B (Specific)",
      reasoning: "Detected a specific external reference likely tied to a known source moment."
    };
  }

  if (looksLikeDiagramCandidate(text)) {
    return {
      visualType: "Diagram",
      reasoning: "Detected structural language about relationships or systems."
    };
  }

  if (looksLikeAtmosphericPassage(text)) {
    return {
      visualType: "B-Roll A (Atmospheric)",
      reasoning: "Detected world-building language that benefits from tonal imagery."
    };
  }

  return {
    reasoning: "No visual trigger detected; keep default on-camera state."
  };
}

function buildContextLabel(index: number, total: number, visualType: VisualType): string {
  const ratio = total === 0 ? 0 : index / total;

  if (ratio <= 0.2) {
    return "Opening hook";
  }

  if (ratio >= 0.8) {
    return "Conclusion";
  }

  if (visualType === "Diagram") {
    return "Core argument";
  }

  if (visualType === "B-Roll A (Atmospheric)") {
    return "World-building";
  }

  if (visualType === "B-Roll B (Specific)") {
    return "Specific reference";
  }

  return "Argument landing";
}

function buildBrollYoutubeUrl(searchTerms: string): string {
  const encoded = encodeURIComponent(searchTerms.trim());
  return `https://youtube.com/results?search_query=${encoded}`;
}

function buildNotes(
  visualType: VisualType,
  passageText: string,
  excerpt: string,
  options: { diagramFilename?: string; emphasisPattern?: string }
): string {
  const searchTerms = suggestSearchTerms(passageText) || suggestSearchTerms(excerpt);

  if (visualType === "Diagram") {
    return `\`${options.diagramFilename || "diagram-pending.excalidraw"}\` - Diagram generated from a structural passage (${searchTerms || "core model"}).`;
  }

  if (visualType === "B-Roll A (Atmospheric)") {
    const terms = searchTerms || "cinematic atmosphere";
    return `Search: \`${terms}\` - YouTube: ${buildBrollYoutubeUrl(
      terms
    )} - Descript stock: \`${terms}\` - Look for: immersive, tonal imagery that supports the mood instead of literal explanation.`;
  }

  if (visualType === "B-Roll B (Specific)") {
    const terms = searchTerms || "specific clip reference";
    return `Source cue: ${excerpt} - Search: \`${terms}\` - YouTube: ${buildBrollYoutubeUrl(
      terms
    )} - Descript stock: \`${terms}\`.`;
  }

  return `Captions on dark screen. Emphasis type: ${options.emphasisPattern || "Distillation"}.`;
}

function collectEmphasisDensityWarnings(rows: PlanRow[]): string[] {
  const emphasisIndices = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.visualType === "Emphasis")
    .map(({ index }) => index);

  if (emphasisIndices.length < 3) {
    return [];
  }

  let currentCluster = 1;

  for (let index = 1; index < emphasisIndices.length; index += 1) {
    if (emphasisIndices[index] === emphasisIndices[index - 1] + 1) {
      currentCluster += 1;
      if (currentCluster >= 3) {
        return [
          "Emphasis entries appear in a dense cluster. Re-check whether each line is a true landing versus a climb sentence."
        ];
      }
    } else {
      currentCluster = 1;
    }
  }

  return [];
}

export async function runPlanGenerate(args: PlanGenerateArgs): Promise<CapabilityResult> {
  const paths = await resolveProjectPaths(args.project);
  const sourcePath = await resolveSourcePath(paths, args.source);
  const sourceFile = path.relative(paths.projectRoot, sourcePath);
  const sourceText = await readMarkdownFile(sourcePath);
  const rulesText = await readMarkdownFile(paths.rulesFile);
  const passages = splitIntoPassages(sourceText);
  const essayHash = computeContentHash(sourceText);

  const rows: PlanRow[] = [];
  const collectedWarnings: string[] = [];

  for (const passage of passages) {
    const classification = classifyPassage(passage.text);
    if (!classification.visualType) {
      continue;
    }

    const excerpt = buildExcerpt(passage.text);
    let diagramFilename: string | undefined;

    if (classification.visualType === "Diagram") {
      const diagramResult = await findDiagramForPlan(
        args.project,
        args.source,
        excerpt,
        "Auto-generated during plan generation."
      );
      diagramFilename = diagramResult.filename;
      collectedWarnings.push(...diagramResult.warnings);
    }

    const context = buildContextLabel(passage.index, passages.length, classification.visualType);
    const notesArtifacts = buildNotes(classification.visualType, passage.text, excerpt, {
      diagramFilename,
      emphasisPattern: classification.emphasisPattern
    });

    rows.push({
      id: hashToId(`${excerpt}:${classification.visualType}:${sourceFile}`),
      excerpt,
      visualType: classification.visualType,
      notesArtifacts,
      context,
      sourceFile
    });
  }

  // The rules file is read as a dependency signal, and we log if it appears unexpectedly empty.
  if (!rulesText.trim()) {
    collectedWarnings.push("Visual trigger ruleset file is empty; heuristic fallback was used.");
  }

  const emphasisWarnings = collectEmphasisDensityWarnings(rows);
  collectedWarnings.push(...emphasisWarnings);

  // We reload state after diagram operations so we do not overwrite diagram mappings.
  const state = await loadPlanState(paths, sourceFile, essayHash);
  state.projectPath = paths.projectRoot;
  state.sourceFile = sourceFile;
  state.essayHash = essayHash;
  state.rows = rows;
  appendWarnings(state, collectedWarnings);

  await writeVisualPlan(paths, rows);
  await writeDiagramLinks(paths, state);
  await savePlanState(paths, state);

  return {
    ok: true,
    message: `Generated visual plan with ${rows.length} departures.`,
    data: {
      visualPlanFile: paths.visualPlanFile,
      rowCount: rows.length,
      sourceFile
    },
    warnings: collectedWarnings
  };
}
