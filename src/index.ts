/**
 * This file is the runtime entrypoint for Publish V1 capabilities. It exists so chat
 * workflows and terminal calls can invoke the same deterministic operations through a
 * single command surface.
 *
 * It talks to the capability modules and only handles argument parsing, dispatch, and
 * response formatting. Business logic stays inside capability files.
 */
import { runDiagramCreate } from "./capabilities/diagram-create.js";
import { runDiagramRefine } from "./capabilities/diagram-refine.js";
import { runPlanGenerate } from "./capabilities/plan-generate.js";
import { runPlanValidate } from "./capabilities/plan-validate.js";
import { type CapabilityResult } from "./contracts/types.js";

interface ParsedArgs {
  command: string;
  flags: Record<string, string>;
}

function printHelp(): void {
  const message = `
Press Publish V1

Usage:
  press publish diagram-create --project <path> --source <relative.md> --excerpt <text> [--intent <text>]
  press publish diagram-refine --project <path> --diagram <diagram-id-or-file> --instruction <text>
  press publish plan-generate --project <path> --source <relative.md>
  press publish plan-validate --project <path>

Alias commands:
  publish.diagram_create
  publish.diagram_refine
  publish.plan_generate
  publish.plan_validate
`.trim();

  console.log(message);
}

function parseFlags(args: string[]): Record<string, string> {
  const flags: Record<string, string> = {};

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const value = args[index + 1];

    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    flags[key] = value;
    index += 1;
  }

  return flags;
}

function normalizeCommand(argv: string[]): ParsedArgs {
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "help") {
    return { command: "help", flags: {} };
  }

  // We support both nested CLI syntax and dotted capability aliases.
  if (argv[0] === "publish" && argv.length >= 2) {
    const subCommand = argv[1].replace(/-/g, "_");
    return {
      command: `publish.${subCommand}`,
      flags: parseFlags(argv.slice(2))
    };
  }

  return {
    command: argv[0].replace(/-/g, "_"),
    flags: parseFlags(argv.slice(1))
  };
}

function requireFlag(flags: Record<string, string>, name: string): string {
  const value = flags[name];
  if (!value) {
    throw new Error(`Missing required flag: --${name}`);
  }

  return value;
}

async function dispatch(parsed: ParsedArgs): Promise<CapabilityResult> {
  switch (parsed.command) {
    case "help":
      return {
        ok: true,
        message: "Printed help."
      };

    case "publish.diagram_create":
      return runDiagramCreate({
        project: requireFlag(parsed.flags, "project"),
        source: requireFlag(parsed.flags, "source"),
        excerpt: requireFlag(parsed.flags, "excerpt"),
        intent: parsed.flags.intent
      });

    case "publish.diagram_refine":
      return runDiagramRefine({
        project: requireFlag(parsed.flags, "project"),
        diagram: requireFlag(parsed.flags, "diagram"),
        instruction: requireFlag(parsed.flags, "instruction")
      });

    case "publish.plan_generate":
      return runPlanGenerate({
        project: requireFlag(parsed.flags, "project"),
        source: requireFlag(parsed.flags, "source")
      });

    case "publish.plan_validate":
      return runPlanValidate({
        project: requireFlag(parsed.flags, "project")
      });

    default:
      throw new Error(`Unknown command: ${parsed.command}`);
  }
}

async function main(): Promise<void> {
  const parsed = normalizeCommand(process.argv.slice(2));

  if (parsed.command === "help") {
    printHelp();
    return;
  }

  try {
    const result = await dispatch(parsed);
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) {
      process.exitCode = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failure: CapabilityResult = {
      ok: false,
      message: "Command failed.",
      errors: [message]
    };
    console.log(JSON.stringify(failure, null, 2));
    process.exitCode = 1;
  }
}

await main();
