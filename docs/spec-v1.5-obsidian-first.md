# Press — Publish Module — V1.5: Obsidian-First, Zero-Terminal UX

## What V1.5 Is

V1.5 is a usability-hardening release for Publish. The core capability engine from V1 remains the source of truth, but the primary user experience moves into Obsidian command palette so normal usage does not require terminal commands.

## Plain-Language Scope

V1.5 ships one-click install/repair, guided service connection, ready check, update, rollback, diagram creation/refinement, visual-plan generation, and article draft package generation through a private Obsidian plugin shell.

V1.5 keeps deterministic path safety and local-first artifacts exactly as in V1. The release does not add direct API posting to Substack, LessWrong, or X; it generates handoff-ready draft package files.

## In Scope

1. Obsidian command palette actions for install/connect/check/update/rollback and publish actions.
2. Unified agent wiring contract with root + `_system` instruction file support.
3. Excalidraw service connection command with immediate validation feedback.
4. Binary ready-check output (`READY` / `NOT READY`) with one clear first fix action.
5. New `publish.build_draft_package` capability and output package under `artifacts/publish-draft-package/`.

## Out of Scope

1. Direct publishing API calls to article platforms.
2. Obsidian community marketplace distribution in this release.
3. New Write-module behavior.
4. Full video assembly automation.

## User-Facing Commands (Plugin)

1. `Press: Install or Repair`
2. `Press: Connect Services`
3. `Press: Ready Check`
4. `Press: Generate Diagram (Current File/Selection)`
5. `Press: Refine Diagram`
6. `Press: Generate Visual Plan`
7. `Press: Build Article Draft Package`
8. `Press: Update Press`
9. `Press: Rollback Press`

## Backend Capability Surface

1. `publish.diagram_create`
2. `publish.diagram_refine`
3. `publish.plan_generate`
4. `publish.plan_validate`
5. `publish.build_draft_package`

## Acceptance Gate

1. First-time user can complete install flow in Obsidian and generate first diagram quickly.
2. Normal usage requires no terminal.
3. Diagram flow does not default to manual raw JSON.
4. Ready check returns clear pass/fail and first fix action.
5. Update and rollback run from Obsidian and preserve project artifacts.
6. Article draft package files are produced in expected locations.
