# Publish V1 Capability Guide

Publish V1 is intentionally chat-first. You continue writing inside Obsidian while Claude/Codex invokes deterministic Press commands under the hood.

## How to Think About It

Press provides four capabilities. `diagram-create` and `diagram-refine` are for visual iteration while writing. `plan-generate` creates the full visual plan when a source draft is ready. `plan-validate` checks whether manual edits broke structure.

All generated files stay inside the target project's `artifacts/` directory.

## Capability Entry Points

Use these canonical names when mapping agent skills:

- `publish.diagram_create`
- `publish.diagram_refine`
- `publish.plan_generate`
- `publish.plan_validate`

## CLI Backing Commands

```bash
node dist/index.js publish diagram-create --project <project-path> --source <relative-md-file> --excerpt "<excerpt>" --intent "<optional-intent>"
node dist/index.js publish diagram-refine --project <project-path> --diagram <diagram-id-or-filename> --instruction "<instruction>"
node dist/index.js publish plan-generate --project <project-path> --source <relative-md-file>
node dist/index.js publish plan-validate --project <project-path>
```

## Chat Phrases To Capability Mapping

When you say "make a diagram for this paragraph," the wrapper should call `publish.diagram_create`.

When you say "refine diagram-03 to simplify labels," the wrapper should call `publish.diagram_refine`.

When you say "generate visual plan for this essay," the wrapper should call `publish.plan_generate`.

When you say "check if my plan is still valid," the wrapper should call `publish.plan_validate`.

## Expected Files Per Project

Press writes:

- `artifacts/visual-plan.md`
- `artifacts/diagram-XX.excalidraw`
- `artifacts/diagram-links.md`
- `artifacts/.press/plan-state.json`

If Excalidraw web links are unavailable in a run, Press continues with local files and records a warning.
