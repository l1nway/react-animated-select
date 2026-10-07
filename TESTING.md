# Test plan: full coverage, CI on push, publish gated by tests (temporary)

Handoff from the session of 2026-10-04 to the next agent, moved from the old sandbox into the monorepo on 2026-10-05. **This file is temporary.** Delete it once the work is done and its content lives in `packages/react-animated-select/CLAUDE.md`, `packages/react-animated-select/src/README.md`, `packages/react-animated-select/FEATURES.md` and `packages/react-animated-select/BUGS.md`.

Read the root `CLAUDE.md` and `packages/react-animated-select/CLAUDE.md` first: every rule there still applies (reply in Russian, analysis before code, iterate one layer per step, the package builds after every step, a changeset for every change to the published package). This file was written **without analysing the test setup**: nothing below has been checked against the `package.json` files or GitHub. Your first step is that analysis, shown to the user before any code.

## 1. What the user asked for (2026-10-04)

1. Cover the library with tests, as completely as is meaningful: behaviour, not a line-coverage number.
2. **Tests run automatically on GitHub on every push.**
3. **Publishing to npm happens only if the tests pass.** A red run must make publishing impossible; a green run lets it go.

## 2. Facts that shape the work (known, not re-checked)

- **One repo since 2026-10-05.** The library (`packages/react-animated-select`, source in `packages/react-animated-select/src`), the demo (`apps/demo`) and the backend (`apps/backend`) live in this monorepo; GitHub pushes and npm publishing happen from here. The test files, the `test` scripts and the CI steps therefore all live in this repo. **Ask the user where the tests live** (a `test` script in `packages/react-animated-select`, files next to the source or in their own folder) before writing any.
- **The local sandbox is not in git.** `apps/sandbox` (`npm run sandbox`, port 5174) is gitignored and exists only on the owner's machine. Its scenarios are a source of test cases, never a place for tests: a scenario worth keeping becomes a committed test.
- **Version 0.8.1** (the `preserveModules` build, `sideEffects`, `index.d.ts`; `packages/react-animated-select/src/README.md` Package Build). The test plan should test the build output, not only the source.
- **Runtime dependencies: none but `react` / `react-dom`.** The "no new dependencies" rule in `packages/react-animated-select/CLAUDE.md` is about runtime peers. Test tooling would be dev dependencies; that is a decision for the user (ask once, list exactly what and why).
- **React 19.2+**, JS only (`.js` / `.jsx`), Vite. The demo and the sandbox run Vite 7 (the sandbox dropped rolldown-vite in the migration).
- **jsdom has no layout, no Web Animations API, no real `ResizeObserver` and no `IntersectionObserver`.** A large part of the library's value lives exactly there: `Collapse` / `Presence` animations, the chip row hold and FLIP, the root height animation, the panel positioning and side flip, infinite scroll (`IntersectionObserver`, see README Paging). Those need a real browser.

## 3. Proposed layers (from the discussion with the user; refine after your analysis)

| Layer | What | Likely tool |
|---|---|---|
| Pure logic | `normalizeOptions`, `resolveSelection`, `sameValue` / `toJSON`, `rekey` (chip keys), `deepEqual`, `compactReducer`, `createStore`, `collectOptions`, `optionDomId`, `request` / `row` of `paging` | Vitest, node environment; table and property-style cases |
| Components | select / uncheck / clear, keyboard (every key in README Select Behavior, Highlight, Typeahead), controlled vs uncontrolled `value` and `open`, `onChange` ids, forms (submit, reset, `required`, `<fieldset disabled>`, `form='id'`), live region texts and debounce, dev warnings (`warnOnce` keys), `plugins` merge and toggling at runtime, `multiple` without `chips` (joined title) | Vitest + jsdom (or happy-dom) + Testing Library |
| SSR | `renderToString` of every mode, hydration without mismatch, deterministic ids | Vitest, node |
| Real browser | animations (timelines sampled per frame), chip row hold, swap out-then-in, chip resize, delete reserve, touch delete mode (long press, swipe), panel placement and flip, infinite scroll and load-ahead, reduced motion, CSS layer order, `ResizeObserver` counts | Playwright (or Vitest browser mode); Chromium at least, Firefox and WebKit to decide (the code has Firefox-specific slack: 0.25 px) |
| Runtime and perf | commit counts, observer counts, leaks, the built `dist` with production React; later the stress fixture in milliseconds | see "Runtime and perf layer" below |
| Bundle | **exists since 2026-10-07:** `npm run size` (`scripts/size.js`, doc-key `bundle-size` in `scripts/README.md`), in CI after the package build. Vite 7 + Rollup and webpack 5 (`css-loader` + `mini-css-extract-plugin`) consumer builds of core, `+ chips`, `+ paging`, all; byte budgets on the Vite build (webpack bytes informational); plugin markers absent from JS and CSS when not imported and the core CSS present in every entry, in both bundlers | `scripts/size.js` |
| Accessibility | ARIA attributes per role, axe | axe in Playwright or jest-axe |
| Visual (optional) | screenshots of the `#stress` scenarios | Playwright |

Coverage: measure with v8, set thresholds **per layer** (pure logic near 100 %, components high, browser by scenario list), never one global number.

### Runtime and perf layer (plan, per `~/projects/claude-rules/perf-lib.md`)

Counts, not milliseconds, everywhere but the last item: counts do not jitter, so they can fail CI. Every case also fails on an uncaught error. Runs in a real browser (Vitest browser mode with Playwright: jsdom has no layout, no Web Animations API, no real observers); tooling is a dev-dependency decision for the owner.

- **Re-renders.** A `<Profiler onRender>` around each case counts React commits per interaction. Start from the baseline in section 5 (220 Selects: open 2, hover over 5 options 4, paged 7, ArrowDown ×5 6, pick 4–5, close 0–3), re-measure it once per case on one Select of each kind (single, multiple with `chips`, paged), and assert the exact numbers; the ranges become exact counts per case. Also: a `memo` row or chip does not render when a sibling or the parent changes; no commit on hover or scroll where the design notes promise it (the highlight lives in a `createStore`, `src/README.md` Store, Highlight). No `StrictMode` in these cases (it doubles renders).
- **Runtime work.** Count live observers by wrapping the `ResizeObserver` / `IntersectionObserver` constructors and `disconnect`: the baseline is 100 `ResizeObserver`s for 220 Selects (one per Select with `chips`, none without); `IntersectionObserver` only while a paged panel is open. Listeners on `document` / `window` per open panel, and forced layouts (`getBoundingClientRect` / `offsetHeight` spies) where `src/README.md` promises a number (the delete-button probe measured once).
- **Leaks.** N mount / unmount cycles of every mode, plus an unmount in the middle of an animation (open, pick, chip remove, plugin morph): afterwards `document.getAnimations()` is empty, every observer is disconnected, the added listeners are removed and no timer is pending (wrap `setTimeout` / `clearTimeout`).
- **Built output.** At least one test imports the built `dist` (ESM `dist/index.js` and CJS `dist/index.cjs`) and renders with production React (`NODE_ENV=production`), after `npm run build -w packages/react-animated-select`.
- **Scale (local only, owner decision 2026-10-07: never in git, never in a bundle).** `apps/sandbox/stress.html` renders 220 Selects (100 single, 100 multiple with `chips` and 3 picks, 20 paged) against the package `dist` (the sandbox config aliases the source only in dev). Run from `apps/sandbox` after `npm run build -w packages/react-animated-select`: `node ../../node_modules/vite/bin/vite.js build`, then `node scripts/perf.mjs` (the shared engine, symlinked; `perf.config.mjs` serves `vite preview`; journal `apps/sandbox/PERF.md`). The web-page budgets of the engine do not fit a 220-Select fixture, so it exits 1 until the owner sets fixture budgets. Baseline 2026-10-07 (`c6caf4f+`, medians of 3): mobile FCP 1872 ms, TBT 926 ms, longest task 668 ms, 59 / 354 scroll frames over 33 ms; desktop FCP 200 ms, TBT 47 ms, 2 / 119 slow frames; CLS 0, idle 5 ms, 3094 DOM nodes, 81.8 KB first-load JS gzip, no errors. It is the only place where milliseconds are the metric.

## 4. CI and publish gating (the user's hard requirement)

- One GitHub Actions workflow in this repo: on every push (and pull request) run lint, build, every test layer, the bundle checks. The monorepo migration sets up `ci.yml` with lint, the package build, `npm run check:pack` and `npm test --workspaces --if-present`, so a `test` script in a workspace runs there; check `.github/workflows/` first.
- Publishing is a separate job (or workflow) that **depends on the test job** (`needs:`). Decided in the migration: changesets open a "Version Packages" PR, merging it publishes (`release.yml`, `needs: ci`). If any test fails, the publish job never starts.
- Also guard local publishing: a `prepublishOnly` script that runs the tests, so `npm publish` from a laptop cannot skip them (today `prepublishOnly` in `packages/react-animated-select/package.json` only builds).
- Auth for npm: decided in the migration, npm trusted publishing (OIDC, with provenance). Do not invent secrets.
- Browser tests in CI need the Playwright browsers installed in the job (cache them).
- Decide how flaky timing tests are handled: compare shapes, order and end states, not absolute milliseconds; no retries that hide real failures.

## 5. Valuable context from this session (reuse it)

- **Verification already done by hand** (2026-10-03/04, Playwright scripts comparing the new library against a frozen copy of the old one). These checklists are ready-made test cases:
  - chips: pick / unpick timelines, row wrap with the row hold, whole-value swap (out then in, `duration / 2` each, root height never grows to the sum), root height on row count change, `deleteInline` (no row flicker while hovering), `deleteAlways`, the delete-button probe measured once, touch delete mode (long press enters, tap removes, Escape / blur / tap on the root exits, exits when chips run out, shake), swipe reveals delete, Backspace removes the last chip, duplicates `[1, 1, 1]` remove exactly the clicked one, a catalogue change keeps the chips without animation, `valueAsOption` chip resize, `selectedText`, `popup={false}`, form reset with chips, title / chips cross-fade, reduced motion, `multiple` without `chips`, toggling plugins at runtime, `ResizeObserver` counts;
  - paging: scroll loads within `loadOffset`, keyboard load-ahead (`loadAhead` 3 and 0), one request per burst (lock), `loadButton` row (click, Enter, pending label, no checkbox), rejected promise and sync throw release the lock (no loop), `no loadMore` and `no paging` warnings, `aria-busy`, live region "n more options loaded", error / loading rows, `keepMounted` closed loads nothing, no keyboard wrap while more pages exist, zero options, keyboard retry after a failed load; and since 2026-10-04 a short first page loads by itself (README Paging).
- **The `#stress` tab** of the local sandbox (`apps/sandbox/src/scenarios.jsx`, `apps/sandbox/src/formScenarios.jsx`, `apps/sandbox/src/a11yScenarios.jsx`, `apps/sandbox/src/syncScenarios.jsx`, shown by `apps/sandbox/src/App.jsx`): one card per known bug or behaviour, each with steps and the expected result. Every card is a regression test to automate. `apps/sandbox` is not in git, so the cards live only on the owner's machine: turn the ones worth keeping into committed tests.
- **`packages/react-animated-select/BUGS.md`** (Done section): every fixed bug deserves a regression test.
- **Runtime baseline** (React dev build, 220 Selects: 100 single, 100 multiple with chips, 20 paged): mount render about 233 ms, 100 `ResizeObserver`s, commits per interaction: open 2, hover over 5 options 4 (paged 7), ArrowDown ×5 6, pick 4–5, close 0–3. A perf test can assert commit counts and observer counts (stable), not milliseconds (noisy).
- **Bundle facts** (README Plugins, Styles Layer): esbuild keeps every CSS file reachable from JS by design, so judge CSS drops with rolldown-vite / Rollup / webpack. `index.js` must stay pure re-exports and the core CSS is imported by `select.jsx`, otherwise Rollup / rolldown / webpack drop the base CSS (an unstyled Select). Sizes (2026-10-07, `npm run size`: Vite 7.3 + Rollup 4.60 consumer of the built package, min / gzip, KB = 1024 B): core 39.5 / 15.6 KB JS + 6.4 / 1.8 KB CSS; `chips` +15.7 / +5.6 KB JS + 2.3 / 0.5 KB CSS; `paging` +1.5 / +0.5 KB JS. The 2026-10-04 numbers (rolldown-vite consumer of the source: core 37.5 / 14.4, `chips` +9.5 / +3.3) are superseded; the bundler and the input differ, so they are not a delta.
- **Tooling locations** (memory note "sandbox-verification-tooling", stored for the old sandbox folder in `~/.claude/projects/c--Users-l1nway-projects-sandbox-sandbox/memory/`, so it is not loaded in this repo until copied; its paths and ports predate the monorepo): Playwright + Chromium in the npx cache, esbuild 0.28 in the npx cache, webpack 5 inside a global `@nestjs/cli` (now a root dev dependency), Vite 7 + Rollup in the root `node_modules`. The session scratchpad that held the harnesses (`measure.cjs`, `runtime.cjs`, the bundler matrix, the Playwright scripts) is gone; the size harness is now committed (`scripts/size.js`), the runtime ones are rebuilt as tests from the descriptions above, never in a scratchpad again (`perf.md`, Principles).
- **Playwright traps** (same memory note): a `force: true` click hits whatever covers the target; chip delete buttons appear on hover only; rAF runs before `ResizeObserver` in a frame; a tap right after a fast CDP swipe can be swallowed by Chromium (pause 400 ms before releasing the swipe).

## 6. Order of work

0. Analysis (show it to the user, then wait): what test tooling exists now in the workspaces, where the tests live, which dev dependencies, which browsers. List every decision as a question with a recommendation.
1. CI skeleton with lint + build + an empty test run, and the publish job gated by it (so the gate exists from day one). Set up by the monorepo migration (`ci.yml`, `release.yml` with `needs: ci`); check it, then add the test script.
2. Pure logic layer.
3. Component layer.
4. SSR layer.
5. Browser layer (scenarios from section 5 and `#stress`), with the runtime and perf layer.
6. Bundle layer: done (`npm run size`, Vite and webpack consumers since 2026-10-07).
7. Accessibility, then visual if the user wants it.

After each layer: the tests pass, the package builds, the docs are updated, the user accepts. Verify from the repo root: `npm run lint`, `npm run build`, `npm run check:pack`, `npm run size`, `npm test`.
