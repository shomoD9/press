/**
 * This file installs Press wiring into a creative vault's `_system` folder. It exists
 * so first-time setup and upgrades can keep agent behavior consistent without asking
 * users to manually copy instruction blocks.
 *
 * It talks to a markdown template, writes `press-wiring.md`, and injects marker blocks
 * into `_system/CLAUDE.md` and `_system/AGENTS.md` when those files exist.
 */
import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const MARKER_BEGIN = "<!-- PRESS_WIRING:BEGIN -->";
const MARKER_END = "<!-- PRESS_WIRING:END -->";

export interface InstallWiringOptions {
  vaultPath: string;
  pressCommand?: string;
  templatePath?: string;
  quiet?: boolean;
}

export interface InstallWiringResult {
  wiringFile: string;
  updatedFiles: string[];
  unchangedFiles: string[];
  skippedFiles: string[];
  backups: string[];
  warnings: string[];
}

interface ParsedCliArgs {
  vaultPath: string;
  pressCommand?: string;
  quiet: boolean;
}

function timestampForBackup(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readUtf8(filePath: string): Promise<string> {
  return readFile(filePath, "utf8");
}

function withTrailingNewline(value: string): string {
  return value.endsWith("\n") ? value : `${value}\n`;
}

function buildInjectedBlock(relativeWiringPath: string): string {
  return [
    MARKER_BEGIN,
    "Press Publish V1 Wiring",
    "",
    `Always load and follow \`${relativeWiringPath}\` before handling publish requests.`,
    "When user intent matches diagram creation/refinement, plan generation, or validation, invoke the mapped `publish.*` capability defined in that file.",
    "If required parameters are missing, ask one concise clarifying question, then execute.",
    MARKER_END
  ].join("\n");
}

async function backupFile(filePath: string): Promise<string> {
  const backupPath = `${filePath}.${timestampForBackup()}.bak`;
  await copyFile(filePath, backupPath);
  return backupPath;
}

function upsertMarkerBlock(currentContent: string, block: string): {
  nextContent: string;
  conflict: boolean;
} {
  const beginIndex = currentContent.indexOf(MARKER_BEGIN);
  const endIndex = currentContent.indexOf(MARKER_END);

  if (beginIndex === -1 && endIndex === -1) {
    const spacer = currentContent.trim().length === 0 ? "" : "\n\n";
    return {
      nextContent: `${currentContent.trimEnd()}${spacer}${block}\n`,
      conflict: false
    };
  }

  if (beginIndex !== -1 && endIndex !== -1 && endIndex > beginIndex) {
    const before = currentContent.slice(0, beginIndex).trimEnd();
    const after = currentContent.slice(endIndex + MARKER_END.length).trimStart();
    const merged = `${before}${before ? "\n\n" : ""}${block}${after ? `\n\n${after}` : ""}`;

    return {
      nextContent: `${merged.trimEnd()}\n`,
      conflict: false
    };
  }

  // A single marker indicates manual damage. We keep original text and append a fresh block.
  const appended = `${currentContent.trimEnd()}\n\n${block}\n`;
  return {
    nextContent: appended,
    conflict: true
  };
}

async function ensureWritableSystemDir(systemDir: string): Promise<void> {
  if (!(await pathExists(systemDir))) {
    throw new Error(`Vault is missing required _system directory: ${systemDir}`);
  }

  await mkdir(systemDir, { recursive: true });
}

function parseCliArgs(argv: string[]): ParsedCliArgs {
  let vaultPath = "";
  let pressCommand: string | undefined;
  let quiet = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--vault") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("Missing value for --vault");
      }
      vaultPath = value;
      index += 1;
      continue;
    }

    if (token === "--press-command") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("Missing value for --press-command");
      }
      pressCommand = value;
      index += 1;
      continue;
    }

    if (token === "--quiet") {
      quiet = true;
      continue;
    }

    if (token === "--help" || token === "help") {
      console.log(
        "Usage: node --import tsx scripts/install-wiring.ts --vault <creative-vault-path> [--press-command \"node /path/to/dist/index.js\"] [--quiet]"
      );
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  if (!vaultPath.trim()) {
    throw new Error("--vault is required.");
  }

  return {
    vaultPath,
    pressCommand,
    quiet
  };
}

function applyTemplate(template: string, pressCommand: string): string {
  return template.replaceAll("{{PRESS_COMMAND}}", pressCommand);
}

export async function installWiring(options: InstallWiringOptions): Promise<InstallWiringResult> {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const templatePath = options.templatePath || path.join(repoRoot, "templates", "press-wiring.md");
  const vaultPath = path.resolve(options.vaultPath);
  const systemDir = path.join(vaultPath, "_system");

  await ensureWritableSystemDir(systemDir);

  const result: InstallWiringResult = {
    wiringFile: path.join(systemDir, "press-wiring.md"),
    updatedFiles: [],
    unchangedFiles: [],
    skippedFiles: [],
    backups: [],
    warnings: []
  };

  const pressCommand =
    options.pressCommand || `node ${path.join(repoRoot, "dist", "index.js")}`;

  const templateRaw = await readUtf8(templatePath);
  const renderedTemplate = withTrailingNewline(applyTemplate(templateRaw, pressCommand));

  const wiringExists = await pathExists(result.wiringFile);
  if (wiringExists) {
    const current = await readUtf8(result.wiringFile);
    if (current !== renderedTemplate) {
      const backup = await backupFile(result.wiringFile);
      result.backups.push(backup);
      await writeFile(result.wiringFile, renderedTemplate, "utf8");
      result.updatedFiles.push(result.wiringFile);
    } else {
      result.unchangedFiles.push(result.wiringFile);
    }
  } else {
    await writeFile(result.wiringFile, renderedTemplate, "utf8");
    result.updatedFiles.push(result.wiringFile);
  }

  const candidateDocs = [
    path.join(systemDir, "CLAUDE.md"),
    path.join(systemDir, "AGENTS.md")
  ];

  const relativeWiringPath = path.relative(systemDir, result.wiringFile) || "press-wiring.md";
  const block = buildInjectedBlock(relativeWiringPath);

  for (const docPath of candidateDocs) {
    if (!(await pathExists(docPath))) {
      result.skippedFiles.push(docPath);
      continue;
    }

    const current = await readUtf8(docPath);
    const { nextContent, conflict } = upsertMarkerBlock(current, block);

    if (nextContent === current) {
      result.unchangedFiles.push(docPath);
      continue;
    }

    // We back up edited instruction files so user customizations are always recoverable.
    const backup = await backupFile(docPath);
    result.backups.push(backup);

    if (conflict) {
      result.warnings.push(
        `Detected malformed Press markers in ${docPath}. Appended a fresh marker block and kept backup at ${backup}.`
      );
    }

    await writeFile(docPath, nextContent, "utf8");
    result.updatedFiles.push(docPath);
  }

  return result;
}

function printSummary(result: InstallWiringResult): void {
  console.log("Press wiring installed.");
  console.log(`- Wiring file: ${result.wiringFile}`);
  console.log(`- Updated: ${result.updatedFiles.length}`);
  console.log(`- Unchanged: ${result.unchangedFiles.length}`);
  console.log(`- Skipped: ${result.skippedFiles.length}`);
  console.log(`- Backups: ${result.backups.length}`);

  if (result.warnings.length > 0) {
    console.log("- Warnings:");
    for (const warning of result.warnings) {
      console.log(`  - ${warning}`);
    }
  }
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));
  const result = await installWiring({
    vaultPath: args.vaultPath,
    pressCommand: args.pressCommand,
    quiet: args.quiet
  });

  if (!args.quiet) {
    printSummary(result);
  }
}

const isDirectRun =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectRun) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`install-wiring failed: ${message}`);
    process.exit(1);
  });
}
