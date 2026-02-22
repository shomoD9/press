# press

Press is a chat-native creative production engine. You write in Obsidian, talk to your agent in natural language, and Press runs deterministic Publish capabilities behind the scenes.

## One-Time Setup

Run this from the repository root:

```bash
npm run bootstrap -- --vault "/absolute/path/to/creative"
```

This command installs dependencies, builds and tests the runtime, installs a local `press` shim, writes vault wiring in `_system/`, and runs doctor checks.

## Daily Usage

Use your agent in natural language. The wiring maps intent to deterministic capability calls:

- Generate diagram -> `publish.diagram_create`
- Refine diagram -> `publish.diagram_refine`
- Generate visual plan -> `publish.plan_generate`
- Validate plan -> `publish.plan_validate`

Output files are written inside each project's `artifacts/` directory.

## One-Command Upgrade (Stable Channel)

```bash
npm run update
```

This fetches stable tags, checks out the newest stable release, rebuilds, retests, and refreshes vault wiring.

## Health Check

```bash
npm run doctor -- --vault "/absolute/path/to/creative"
```

If vault path was saved during bootstrap, `npm run doctor` is enough.

## Maintainer Release Tag

```bash
npm run release:tag -- --version "vX.Y.Z"
```

This validates a clean tree, runs build/test, creates an annotated tag, pushes it, and creates a release-notes stub in `docs/releases/`.
