# Press V1 Animation Engine

Press V1 is a deterministic, spec-driven motion graphics engine built on Remotion.

## Command Surface

Use the `press` command through npm scripts:

- `npm run press -- validate <project-spec-path-or-project-id>`
- `npm run press -- preview --project <id> --scene <scene-id|all>`
- `npm run press -- render:scene --project <id> --scene <scene-id> [--force]`
- `npm run press -- render:full --project <id> [--force]`

Shortcuts:

- `npm run validate`
- `npm run preview`
- `npm run render:scene`
- `npm run render:full`

## Demo Artifacts

The default example lives in `artifacts/projects/demo-v1/`.

- Project spec: `project.spec.json`
- Style tokens: `style.tokens.json`

## Quality Gates

Rendering commands run craft lint checks by default.

- If lint emits errors, render is blocked.
- Use `--force` only when intentionally overriding.

## Output

Rendered videos and manifests are written to timestamped paths:

`renders/<project-id>/<timestamp>/`

Each render includes `render-manifest.json` with metadata and spec hash.
