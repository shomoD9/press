# DEVLOG

## 2026-02-28
Initialized implementation work for V1 animation engine.
Created root `ARCHITECTURE.md` to establish system narrative and topology before scaffolding.
Created runtime/tooling foundation files: `package.json`, `.gitignore`, `tsconfig.json`, `vitest.config.ts`, and `remotion.config.ts`.
Created schema layer: `schemas/style-tokens.ts`, `schemas/scene-spec.ts`, `schemas/project-spec.ts`, `schemas/validate-project.ts`, and `schemas/index.ts`.
Created deterministic motion utilities: `engine/motion/frame-math.ts`, `engine/motion/deterministic.ts`, and `engine/motion/index.ts`.
Created shared visual kit components: `scene-kits/common/backdrop.tsx` and `scene-kits/common/typography-block.tsx`.
Created scene runtime contracts and five treatment implementations in `engine/scenes/` plus scene registry mapping.
Created compiler module: `engine/compiler/compile-project.ts` and `engine/compiler/index.ts`.
Created quality modules: `engine/quality/contrast.ts`, `engine/quality/lint-craft.ts`, and `engine/quality/index.ts`.
Created Remotion runtime modules: `engine/remotion/types.ts`, `engine/remotion/project-composition.tsx`, `engine/remotion/scene-composition.tsx`, `engine/remotion/root.tsx`, and `engine/remotion/index.ts`.
Created render orchestration modules: `engine/render/render-utils.ts`, `engine/render/render-project.ts`, `engine/render/render-scene.ts`, and `engine/render/index.ts`.
Created CLI and shared script utilities: `scripts/press.ts`, `scripts/shared/io.ts`, and `scripts/shared/load-project.ts`.
Created demo artifact set: `artifacts/projects/demo-v1/project.spec.json` and `artifacts/projects/demo-v1/style.tokens.json`.
Created test suite files: `tests/validate-project.test.ts`, `tests/compiler.test.ts`, `tests/deterministic.test.ts`, and `tests/lint-craft.test.ts`.
Created `public/placeholder.txt` for static-asset routing expectations.
Patched `engine/scenes/types.ts` to include explicit React type import for JSX typing.
Executed `npm run typecheck` and `npm test`; both failed because dependencies are not installed (`tsc` and `vitest` not found).
Attempted dependency/version network check (`npm view remotion version`); failed with `ENOTFOUND registry.npmjs.org` due restricted network.
Rewrote `ARCHITECTURE.md` to reflect the implemented file-level geography and flow.
Added `README.md` with command surface, quality gate behavior, and output path semantics.
Updated render manifest contract to include `durationInFrames` in `engine/render/render-utils.ts`, `engine/render/render-project.ts`, and `engine/render/render-scene.ts`.
Added `engine/remotion/composition-ids.ts` and redirected CLI/render imports to avoid loading composition modules only to access identifier constants.
Expanded `tests/lint-craft.test.ts` with a focal-concurrency failure case to verify `FOCAL_DENSITY_EXCEEDED` behavior.
Added `renders/.gitkeep` to preserve the output directory in repository layout.
Added `artifacts/projects/demo-v1/index.ts` to expose schema-validated typed demo artifacts for runtime and tests.
Updated `tsconfig.json` include list to cover `artifacts/**/*.ts`.
Updated `remotion.config.ts` to import `Config` from `@remotion/cli/config` (Remotion v4 API surface).
Updated `engine/remotion/types.ts` so `PressInputProps` extends `Record<string, unknown>` for renderer/Composition compatibility.
Updated `engine/remotion/root.tsx` to use typed demo artifacts and safe cast pattern in metadata callbacks.
Updated render bundling imports in `engine/render/render-project.ts` and `engine/render/render-scene.ts` to use `bundle` from `@remotion/bundler`.
Added explicit `@remotion/bundler` dependency in `package.json`.
Updated tests to consume typed demo artifacts via `artifacts/projects/demo-v1/index.ts`.
Updated npm scripts in `package.json` to use `node --import tsx` instead of `tsx` binary to avoid IPC pipe restrictions in sandboxed environments.
Executed verification after fixes: `npm run typecheck` passed, `npm test` passed (8 tests), and `npm run press -- validate demo-v1` passed.
Attempted live scene rendering and identified Remotion frame-advance timeout (`delayRender Setting the current frame`) in video render mode while still renders succeeded.
Installed missing native dependencies via Homebrew (`libx11`, `sdl2`) to satisfy Remotion compositor linkage.
Installed Homebrew `ffmpeg` for a robust frame-sequence stitching fallback path.
Added `engine/render/render-fallback.ts` implementing automatic fallback: render PNG frames via `renderStill()` and stitch to MP4 with `ffmpeg`.
Updated `engine/render/render-project.ts` and `engine/render/render-scene.ts` to use timeout+swiftshader defaults and automatically fallback when renderMedia frame-advance errors are detected.
Updated `engine/render/index.ts` exports to include fallback renderer utilities.
Observed fallback run stall caused by `openBrowser()` session instability in this environment; refactored fallback to avoid browser reuse and call `renderStill()` per frame.
Validated that direct Remotion CLI render succeeds reliably when forcing `--concurrency 1`; used this to set `concurrency: 1` in `engine/render/render-project.ts` and `engine/render/render-scene.ts`.
Cleaned stale failed render directories: `renders/demo-v1/2026-02-28T13-38-39-694Z` and `renders/demo-v1/2026-02-28T14-47-02-570Z`.
Executed scene render successfully via `press`:
`/Users/shomo/development/build/press/renders/demo-v1/2026-02-28T14-55-52-927Z/demo-v1-beat-01-thesis.mp4`
and manifest:
`/Users/shomo/development/build/press/renders/demo-v1/2026-02-28T14-55-52-927Z/render-manifest.json`.
Executed full render successfully via `press`:
`/Users/shomo/development/build/press/renders/demo-v1/2026-02-28T14-57-02-608Z/demo-v1-full.mp4`
and manifest:
`/Users/shomo/development/build/press/renders/demo-v1/2026-02-28T14-57-02-608Z/render-manifest.json`.
Verified post-render test suite: `npm test` passed (8 tests).
