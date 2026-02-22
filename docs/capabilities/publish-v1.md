# Publish V1 Capability Guide

Publish V1 is intentionally chat-first. You keep writing inside Obsidian while Claude/Codex invokes deterministic Press capabilities behind the scenes.

## No-Manual-CLI Operating Mode

After bootstrap wiring is installed, users should not need to run raw capability commands in normal workflow. Natural language requests are mapped to capability entrypoints by the `_system/press-wiring.md` contract.

Manual commands remain available as a fallback debugging surface.

## Capability Entry Points

- `publish.diagram_create`
- `publish.diagram_refine`
- `publish.plan_generate`
- `publish.plan_validate`

## Agent Mapping Contract

When the user asks to generate a diagram for a passage, route to `publish.diagram_create`.

When the user asks to iterate or revise a known diagram, route to `publish.diagram_refine`.

When the user asks to generate a visual plan from a draft or final essay, route to `publish.plan_generate`.

When the user asks to check consistency or readiness, route to `publish.plan_validate`.

If required parameters are missing, ask one concise clarifying question, then execute.

## Required Parameter Extraction

Project root should be inferred from active file context and must resolve to `Essays/<slug>` or `Commentary/<slug>`.

Source file should be relative to project root and must be a markdown file.

Diagram refinement must target a diagram ID or filename.

## Output Contract

Always report created or updated files with absolute paths.

Always include warnings from Press (for example, when Excalidraw web links are unavailable and local files stay authoritative).

Never report success without at least one concrete output file path.

## Expected Files Per Project

Press writes:

- `artifacts/visual-plan.md`
- `artifacts/diagram-XX.excalidraw`
- `artifacts/diagram-links.md`
- `artifacts/.press/plan-state.json`

## Lifecycle Commands

Install once:

```bash
npm run bootstrap -- --vault "/absolute/path/to/creative"
```

Upgrade to latest stable release:

```bash
npm run update
```

Run health checks:

```bash
npm run doctor
```

## Manual Command Surface (Fallback)

```bash
node dist/index.js publish diagram-create --project <project-path> --source <relative-md-file> --excerpt "<excerpt>" --intent "<optional-intent>"
node dist/index.js publish diagram-refine --project <project-path> --diagram <diagram-id-or-filename> --instruction "<instruction>"
node dist/index.js publish plan-generate --project <project-path> --source <relative-md-file>
node dist/index.js publish plan-validate --project <project-path>
```
