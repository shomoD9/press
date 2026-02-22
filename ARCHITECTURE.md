# Press Architecture

## The Opening

Press is a local production engine that turns writing decisions into publishing artifacts without forcing a creator to leave the writing environment. The core idea is that the creative act should remain in Obsidian while the operational act of planning visuals becomes structured, repeatable, and inspectable. Publish V1 exists to eliminate the blank-canvas moment in video assembly by producing a concrete `visual-plan.md` and a stable set of diagram artifacts in each project folder.

The system is intentionally chat-native and file-native at the same time. Chat is where intent is expressed in plain language, while files are where state and outputs live so they can be reviewed, versioned, and reused. This dual shape matters because conversational tools are excellent at intent capture, but production reliability requires deterministic storage contracts and explicit command behavior.

## The Ontology

The fundamental object in Publish V1 is a project workspace, represented as an essay or commentary folder under the creative vault. A project has source markdown files that contain argument material, an `artifacts/` directory that stores generated outputs, and a hidden `.press` state document that remembers continuity between runs. The system treats each source passage as a candidate departure from the default on-camera state. When a passage meets a trigger pattern, it becomes a visual plan row.

A visual plan row is a concrete commitment: this excerpt gets this kind of visual treatment with these notes and this context label. A diagram record is the persistent identity of one `.excalidraw` artifact, including revision count and optional web link. The plan state is the memory object that ties rows and diagrams together so regeneration is stable and manual iteration does not create duplicate artifacts.

## The Geography

The repository root contains `README.md` for product framing, `CLAUDE.md` for agent context, `ARCHITECTURE.md` for this living systems narrative, `package.json` for runtime and test scripts, `tsconfig.json` for TypeScript compilation boundaries, and `.gitignore` for local build hygiene. The `docs/` directory holds product intent. The existing spec files such as `docs/spec-v1-visual-plan.md`, `docs/spec-v2-write-module.md`, `docs/roadmap.md`, and `docs/visual-trigger-ruleset.md` define scope and sequencing, while `docs/capabilities/publish-v1.md` explains how agent-facing capabilities map to deterministic runtime commands.

All implementation code lives in `src/`. The file `src/index.ts` is the CLI dispatch surface that normalizes command names and routes them to capability modules. The directory `src/contracts/` contains `types.ts` and `schema.ts`, which define and validate the shared vocabulary used everywhere else. The directory `src/io/` contains `project-paths.ts` for path safety and project resolution, `markdown.ts` for passage and excerpt extraction, `state.ts` for persistence and idempotency logic, and `plan-render.ts` for markdown table rendering and parsing. The directory `src/integrations/` contains `excalidraw.ts`, the adapter boundary that calls an external Excalidraw executable when configured and otherwise produces local fallback artifacts so workflow continuity remains intact. The directory `src/capabilities/` contains `diagram-create.ts`, `diagram-refine.ts`, `plan-generate.ts`, and `plan-validate.ts`, which are the user-facing operations invoked from chat wrappers or direct command calls.

Test coverage lives in `tests/`. The directory `tests/fixtures/creative/` models a realistic vault shape with `_system/visual-trigger-ruleset.md` plus representative `Essays` and `Commentary` projects. The directory `tests/publish-v1/` contains behavioral tests for creation, refinement, generation, validation, and path safety, with `tests/publish-v1/test-helpers.ts` providing isolated workspace setup so every test run mutates its own temporary copy.

## The Flow

When a user asks for a pre-plan diagram, the runtime enters through `src/index.ts`, resolves the project and source file using `src/io/project-paths.ts`, reads the source text via `src/io/markdown.ts`, and loads continuity state from `src/io/state.ts`. The capability in `src/capabilities/diagram-create.ts` either reuses an existing diagram mapped to the same excerpt or requests a new one through `src/integrations/excalidraw.ts`. The resulting artifact is written to `artifacts/diagram-XX.excalidraw`, the diagram registry in state is updated, and `artifacts/diagram-links.md` is regenerated so link availability and warnings stay visible.

When a user asks for a full visual plan, `src/capabilities/plan-generate.ts` parses passages from the selected markdown source, classifies each passage into trigger types, and keeps only departures from the default on-camera baseline. Diagram passages are delegated back through the diagram creation path so diagram naming and reuse remain consistent. Rows are rendered into a strict four-column table through `src/io/plan-render.ts`, written to `artifacts/visual-plan.md`, and mirrored into state for deterministic iteration and validation.

When a user asks to validate, `src/capabilities/plan-validate.ts` parses the existing plan table, checks column contract integrity, verifies visual types, verifies diagram references on disk, and cross-checks state integrity through `src/contracts/schema.ts`. The result is a structured success or failure payload with repair hints, allowing chat workflows to guide the user toward safe correction instead of silent drift.

## The Philosophy

This architecture favors local-first reliability over tool-perfect integration. Excalidraw web links are treated as optional enrichment, not as a prerequisite, because writing flow must continue even when external integrations are unavailable. The project therefore chooses deterministic filesystem outputs as the source of truth and records warnings instead of failing hard in non-critical integration gaps.

The design also separates intent interpretation from execution mechanics. Capability files express workflow intent in human terms, IO modules enforce hard boundaries, contracts define the semantic model, and the integration layer isolates external volatility. This separation keeps the system adaptable as tooling changes, while preserving one stable promise to the user: chat commands produce predictable artifacts in the right project folder with revision continuity.
