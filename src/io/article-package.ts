/**
 * This file renders the V1.5 article draft package. It exists so package assembly
 * logic stays centralized and deterministic instead of being spread across command
 * handlers.
 *
 * It talks to project path guards and filesystem writes, and it exports one function
 * that turns a source essay plus known artifacts into platform-ready draft files.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { type ProjectPaths } from "../contracts/types.js";
import { assertWriteTarget } from "./project-paths.js";

export interface DraftPackageInput {
  sourceFile: string;
  sourceText: string;
  diagramFiles: string[];
  visualPlanPresent: boolean;
}

export interface DraftPackageOutput {
  packageDir: string;
  files: {
    substack: string;
    lesswrong: string;
    xArticle: string;
    metadata: string;
    readme: string;
  };
}

function firstHeading(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+?)\s*$/m);
  return match ? match[1].trim() : null;
}

function fallbackTitleFromSource(sourceFile: string): string {
  const base = path.basename(sourceFile, path.extname(sourceFile));
  return base
    .split(/[-_]/g)
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function summaryParagraph(markdown: string): string {
  const blocks = markdown
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/g)
    .map((entry) => entry.trim())
    .filter(Boolean);

  // We skip headings so summary reflects prose, not section labels.
  const prose = blocks.find((entry) => !entry.startsWith("#"));
  return prose || "Summary unavailable. Review full draft body.";
}

function normalizeBody(markdown: string): string {
  return markdown.trim().endsWith("\n") ? markdown.trim() : `${markdown.trim()}\n`;
}

function artifactsSection(diagramFiles: string[], visualPlanPresent: boolean): string {
  const lines: string[] = [];
  lines.push("## Visual Artifacts");
  lines.push("");

  if (visualPlanPresent) {
    lines.push("- Visual plan: `artifacts/visual-plan.md`");
  } else {
    lines.push("- Visual plan: not found in this run.");
  }

  if (diagramFiles.length === 0) {
    lines.push("- Diagrams: none linked yet.");
  } else {
    for (const filename of diagramFiles) {
      lines.push(`- Diagram: \`artifacts/${filename}\``);
    }
  }

  return `${lines.join("\n")}\n`;
}

function buildSubstackDraft(
  title: string,
  summary: string,
  body: string,
  artifactSection: string
): string {
  return [
    `# ${title}`,
    "",
    `> ${summary}`,
    "",
    body.trim(),
    "",
    artifactSection.trim(),
    "",
    "_Prepared by Press V1.5 draft package._"
  ].join("\n");
}

function buildLesswrongDraft(
  title: string,
  summary: string,
  body: string,
  artifactSection: string
): string {
  return [
    `# ${title}`,
    "",
    "**Abstract:**",
    "",
    summary,
    "",
    "---",
    "",
    body.trim(),
    "",
    artifactSection.trim(),
    "",
    "_Prepared by Press V1.5 draft package._"
  ].join("\n");
}

function buildXArticleDraft(title: string, summary: string, body: string): string {
  const compactBody = body.replace(/\s+/g, " ").trim();
  const teaser = compactBody.length > 1400 ? `${compactBody.slice(0, 1400)}...` : compactBody;

  return [
    `# ${title}`,
    "",
    "## Hook",
    "",
    summary,
    "",
    "## Long-Form Draft",
    "",
    teaser,
    "",
    "_Prepared by Press V1.5 draft package._"
  ].join("\n");
}

export async function writeDraftPackage(
  paths: ProjectPaths,
  input: DraftPackageInput
): Promise<DraftPackageOutput> {
  const packageDir = path.join(paths.artifactsDir, "publish-draft-package");
  assertWriteTarget(paths, packageDir);
  await mkdir(packageDir, { recursive: true });

  const title = firstHeading(input.sourceText) || fallbackTitleFromSource(input.sourceFile) || "Untitled";
  const summary = summaryParagraph(input.sourceText);
  const body = normalizeBody(input.sourceText);
  const artifactSection = artifactsSection(input.diagramFiles, input.visualPlanPresent);

  const files = {
    substack: path.join(packageDir, "substack.md"),
    lesswrong: path.join(packageDir, "lesswrong.md"),
    xArticle: path.join(packageDir, "x-article.md"),
    metadata: path.join(packageDir, "metadata.json"),
    readme: path.join(packageDir, "README.md")
  };

  assertWriteTarget(paths, files.substack);
  assertWriteTarget(paths, files.lesswrong);
  assertWriteTarget(paths, files.xArticle);
  assertWriteTarget(paths, files.metadata);
  assertWriteTarget(paths, files.readme);

  const metadata = {
    title,
    sourceFile: input.sourceFile,
    summary,
    wordCount: body.split(/\s+/).filter(Boolean).length,
    visualPlanPresent: input.visualPlanPresent,
    diagramCount: input.diagramFiles.length,
    diagramFiles: input.diagramFiles,
    generatedAt: new Date().toISOString()
  };

  const readme = [
    "# Publish Draft Package",
    "",
    "This folder was generated by Press V1.5.",
    "",
    "Copy guidance:",
    "1. `substack.md` -> Substack draft body.",
    "2. `lesswrong.md` -> LessWrong draft body.",
    "3. `x-article.md` -> X long-form/article draft body.",
    "4. `metadata.json` -> title, summary, and artifact index for manual review.",
    "",
    "All file paths are local-first; review and edit before publishing."
  ].join("\n");

  await writeFile(files.substack, `${buildSubstackDraft(title, summary, body, artifactSection)}\n`, "utf8");
  await writeFile(files.lesswrong, `${buildLesswrongDraft(title, summary, body, artifactSection)}\n`, "utf8");
  await writeFile(files.xArticle, `${buildXArticleDraft(title, summary, body)}\n`, "utf8");
  await writeFile(files.metadata, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  await writeFile(files.readme, `${readme}\n`, "utf8");

  return {
    packageDir,
    files
  };
}
