# Press

## What This Is

Press is a creative production engine for Shomo (@armchairdescending). It takes a finished essay and turns it into published content — video and written — across all platforms with minimal manual effort.

Press has two modules:
- **Write module** — Helps Shomo get from idea to finished essay. (Future — not yet scoped.)
- **Publish module** — Takes the finished essay and produces all published outputs. V1 is the Visual Plan Generator.

## Who Shomo Is

A Product Manager and philosophical content creator. He writes essays in Obsidian, records himself reading them on camera, and publishes to YouTube, Substack, LessWrong, and X Articles. He uses AI coding agents as his engineering team. He does not write code.

## How Shomo Works

- Essays live in Obsidian, one folder per piece, with all research and drafts alongside.
- He uses a code editor (Cursor/Claude Code) open on the same Obsidian vault.
- He already uses MCP tools and custom AI workflows within this setup.
- Press V1 lives as agent tooling within this existing workflow — a CLAUDE.md and rules file at the vault root.

## Current Build: V1 — Visual Plan Generator

The agent reads a finished essay and generates a `visual-plan.md` file in the essay's folder. This file is a 4-column markdown table specifying what should appear on screen during the video and when.

### Key files:
- `docs/spec-v1-visual-plan.md` — The full V1 spec. Read this first.
- `docs/visual-trigger-ruleset.md` — The rules for what triggers each visual type. Referenced by the spec.
- `docs/roadmap.md` — The full product roadmap from V1 through V5.

### V1 does:
- Generate a visual plan table from a finished essay.
- Auto-generate diagrams via Excalidraw MCP.
- Provide search terms and pre-filled YouTube URLs for B-roll sourcing.
- Flag emphasis moments (captions on dark screen) per the trigger ruleset.

### V1 does NOT:
- Push anything to Descript.
- Assemble video.
- Generate metadata.
- Publish to any platform.
- Generate Remotion animations.
- Assist with essay writing.

## Rules for Coding Agents

- Read the spec before building. The spec describes *what* and *why*. Implementation decisions are yours.
- The visual trigger ruleset is a separate file and may be updated independently. Do not hardcode trigger logic — reference the ruleset.
- All generated artifacts (diagrams, visual plan files) go in the essay's folder, not in a global location.
- Shomo reviews and iterates on the visual plan. The workflow must support back-and-forth refinement, not just one-shot generation.
