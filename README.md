# press

Press is an Obsidian-first, chat-native creative production engine. You write in Obsidian, talk to your agent in natural language, and Press runs deterministic Publish capabilities behind the scenes.

## Obsidian-First Quick Start (V1.5)

Install the private plugin from this repo:

1. Copy `/Users/shomo/development/build/press/plugins/obsidian-press-v15` into `<creative-vault>/.obsidian/plugins/press-v15-private`.
2. Enable **Press V1.5 (Private)** in Obsidian community plugins.
3. Open plugin settings and set:
   - Press repository path
   - Creative vault path
   - Excalidraw MCP command
4. Run command palette actions in this order:
   - `Press: Install or Repair`
   - `Press: Connect Services`
   - `Press: Ready Check`

After this, normal usage is command-palette only (no terminal required).

## Daily Commands in Obsidian

Use your agent in natural language. The wiring maps intent to deterministic capability calls:

- Generate diagram -> `publish.diagram_create`
- Refine diagram -> `publish.diagram_refine`
- Generate visual plan -> `publish.plan_generate`
- Validate plan -> `publish.plan_validate`
- Build article draft package -> `publish.build_draft_package`

Output files are written inside each project's `artifacts/` directory.

## CLI Backend (Optional)

The plugin runs these backend commands under the hood. Keep them as fallback/debug tools:

```bash
npm run bootstrap -- --vault "/absolute/path/to/creative" --excalidraw-mcp-command "<your excalidraw mcp server command>"
npm run update
npm run rollback
npm run doctor -- --vault "/absolute/path/to/creative"
npm run connect-services -- --excalidraw-mcp-command "<your excalidraw mcp server command>"
```

## Maintainer Release Tag

```bash
npm run release:tag -- --version "vX.Y.Z"
```

This validates a clean tree, runs build/test, creates an annotated tag, pushes it, and creates a release-notes stub in `docs/releases/`.
