# Press Wiring (Publish V1)

This file is the shared agent wiring contract for Press Publish V1. It tells coding agents how to map natural-language requests to deterministic capabilities so the user can stay in chat while writing in Obsidian.

## Source of Truth

Press capabilities are deterministic local commands. Chat is the interface, not the execution engine. The backend command is:

`{{PRESS_COMMAND}}`

Agents should invoke this command surface for all Publish V1 actions.

## Agent Preflight (Required)

Before any diagram, plan, or validation action, verify Press capability availability first.

Run a lightweight check (`press help` or equivalent command surface check) and only continue when it succeeds.

If this preflight fails, stop and instruct the user to run Install or Repair instead of hand-authoring fallback artifacts.

## Supported Capabilities

- `publish.diagram_create`
- `publish.diagram_refine`
- `publish.plan_generate`
- `publish.plan_validate`
- `publish.build_draft_package`

## Intent Mapping Contract

When the user asks to generate a diagram for a passage, call `publish.diagram_create`.

When the user asks to iterate or revise an existing diagram, call `publish.diagram_refine`.

When the user asks to produce a visual plan from a draft or final essay, call `publish.plan_generate`.

When the user asks to check integrity or repair readiness, call `publish.plan_validate`.

When the user asks to build publishing handoff drafts for article interfaces, call `publish.build_draft_package`.

## Excalidraw MCP Rules

Do not manually hand-author `.excalidraw` JSON as a primary workflow. Use Press capabilities so the Excalidraw integration path is consistent.

If Press returns a warning that Excalidraw MCP is unavailable, state that clearly in one sentence and ask whether to continue in local fallback mode.

Never spend multiple minutes planning manual JSON edits before checking capability execution and MCP availability.

## Parameter Extraction Rules

First, infer the project root from the currently active file path. The project root must be the directory ending with `Essays/<slug>` or `Commentary/<slug>`.

If project root cannot be inferred with confidence, ask one concise question requesting the exact project path.

For diagram creation and plan generation, infer source markdown path relative to project root from the active file context. If missing, ask one concise question for the source file.

For diagram refinement, infer diagram ID from the user instruction. If missing, ask one concise question for the diagram identifier.

## Output Rules

Always report files created or updated with absolute paths.

Always include warnings returned by Press, especially when web link export is unavailable and local files remain the source of truth.

Never claim success without listing at least one concrete output file path.

## Safety Rules

All generated content belongs inside each project's `artifacts/` directory and `.press` internal state directory.

Do not write visual artifacts outside the project boundary.

If validation fails, report repair hints and offer to run regeneration.
