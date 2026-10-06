# CLAUDE.md

Migration in progress: follow `MONOREPO_MIGRATION.md` (local file, not in git).

Reply to the owner in Russian. Code, comments and docs stay in English.

## Monorepo map

```
react-animated-select/                 git root, github.com/l1nway/react-animated-select
├─ package.json                        private, npm workspaces, root scripts, shared devDependencies
├─ package-lock.json                   one lock for both workspaces
├─ README.md, LICENSE                  canonical; copied into the package on pack (the copies are gitignored)
├─ TESTING.md                          test plan
├─ .changeset/                         config.json and pending changesets
├─ .github/workflows/                  ci.yml, pages.yml, release.yml, backend.yml
├─ scripts/                            copyMeta.js, checkPack.js
├─ packages/react-animated-select/     the npm package: src/, index.d.ts, vite.config.js, CLAUDE.md, FEATURES.md, STYLES.md, BUGS.md
├─ apps/demo/                          the demo site, https://l1nway.github.io/react-animated-select/ (CLAUDE.md, SYNC.md)
├─ apps/backend/                       the LLM backend, own lock, .env local only (CLAUDE.md, KNOWLEDGE.md, BUGS.md)
└─ apps/sandbox/                       GITIGNORED: local stress playground, never pushed
```

Each workspace has its own `CLAUDE.md`; read it before working there.

## Commands

- `npm run dev`: the demo on http://localhost:5173/react-animated-select/, running the library source with HMR, against the local backend.
- `npm run dev:remote`: the demo against the production backend.
- `npm run dev:api`: the backend on port 3000.
- `npm run sandbox`: the local playground on port 5174.
- `npm run build`: the package, then the demo.
- `npm run lint`, `npm test`, `npm run check:pack` (the npm tarball holds exactly `package.json`, `README.md`, `LICENSE`, `index.d.ts` and `dist/**`).

Local development needs two terminals: `npm run dev` and `npm run dev:api`; optionally a third, `npm run sandbox`.

## General rules

- The package is published on npm. Treat every change as something that ships to real users.
- Do not make speculative, exploratory or "while I'm here" edits. Change only what the task asks for. When unsure whether a change is in scope, ask first.
- Do not refactor, rename, reformat or restructure code unless asked.
- Do not add dependencies (runtime or dev) without explicit approval.
- Never commit secrets. Secrets live only in `apps/backend/.env` (local) and in AWS; never in git or GitHub.
- Do not push, change GitHub settings, or touch npmjs.com or AWS without explicit approval.

## Browsers and platforms

The library and the demo must work in every current browser on desktop, iOS and Android. Rules learned from the mobile bugs of 2026-10 (scroll jumps, the keyboard flash, the bottom bar):

- **Standards first, progressive enhancement.** Layer a feature from the newest, least supported at the top down to the one that works everywhere at the bottom; every layer is feature-detected (`@supports`, `'api' in object`, `CSS.supports`), and the bottom layer is a complete, ordinary experience (a translucent bar falls back to an opaque one). Sniff the user agent only as a last resort, never alone, and say why in a comment. Do not hardcode a browser or a device into a layout.
- **iOS Safari is the reference for look and feel; Android follows.** Every browser on iOS (Firefox, Chrome, Edge) is WKWebView, so "Firefox on iPhone" shares WebKit's focus, keyboard, viewport and scroll behaviour, not Gecko's. A bug seen in one iOS browser is a WebKit bug until shown otherwise.
- **Let the platform do what it already does.** Do not rebuild native behaviour in JS. Before adding JS, check whether the default already gives the result, and in which browsers it really does: `resizes-visual` hides a fixed bar under the keyboard in iOS 18 Safari but not in iOS 26 Safari (WebKit bug) or Firefox for iOS (it shrinks the web view), so the bar is hidden by a focus flag instead (`data-typing` on `<html>`, set from document `focusin`/`focusout`, never a `:has()` on `body`; `apps/demo/src/menu/README.md`). Never add `interactive-widget=resizes-content` to the viewport meta: it lifts the fixed bar above the keyboard, the opposite of the wanted pattern.
- **Do not trust folklore about browsers.** "iOS ignores `inputmode=none`" was true for a few months of 2019 and false since. Check a claim against MDN, the WebKit / Chromium / Gecko trackers or the engine source, name the source, and mark in the reply what was *observed* and what was *reasoned*.
- **Nothing in the library may scroll or widen the page.** Programmatic `focus()` passes `{preventScroll: true}`; `scrollIntoView()` is not used on anything that sits inside a scroll container (it walks every scroll ancestor, the document included): scroll the one element that should move. A portalled panel must never make `documentElement.scrollWidth` exceed `clientWidth`; it spans only the visible part of a trigger that a container clips.
- **Check browser support on every feature you add or change.** Before writing it, look up the CSS property, JS API or HTML behaviour on MDN / caniuse / the engine tracker for Chrome, Safari (iOS 18 and iOS 26), Firefox (desktop and iOS) and Android Chrome. Say in the reply which browsers it covers and what the fallback is. A feature without a working fallback does not ship.
- **Safari 26 colours the area under its toolbar from fixed elements near the bottom edge, and remembers the choice** (`LocalFrameView::fixedContainerEdges`, `Page::updateFixedContainerEdges` in WebKit). A fixed or sticky box within 4px of the bottom edge (or ≥ 90% wide, reported as 80% in shipped builds) with a `backdrop-filter` or a background makes Safari replace its native glass with a solid slab, and it keeps that element until the element gets `visibility: hidden` / `display: none` or is removed. One frame at the edge is enough, so no entrance animation, bounce or transform may carry a bottom bar across the edge. The demo's mobile bar is a floating pill 8px above the bottom for this reason (`apps/demo/src/menu/README.md`). `theme-color` is ignored by Safari 26.
- **Firefox for iOS shows its toolbars on every same-origin URL change** (`history.replaceState` included). The demo keeps URL sync on purpose (owner decision, 2026-10-05); do not add more URL writes, and prefer one write on `scrollend` over writes mid-scroll.
- **Slot-based indicators need equal slots.** An indicator that moves by `100% / count` only centres if every item is `flex: 1; min-width: 0`.
- **`env(safe-area-inset-*)` is not a stable number on iOS.** Safari reports 0 with its toolbar expanded and a positive value once it collapses, and flips as the visitor scrolls. Use it as padding inside the element that needs it, never inside a variable that reserves layout space (`--rac-nav-h` stays a plain length).
- **Hidden form anchors stay real text inputs** (so native validation and its bubble work): `tabIndex={-1}`, `aria-hidden`, and `inputMode='none'` so the browser never raises a soft keyboard for them. Not `type='hidden'`, not `readOnly`: both are barred from constraint validation.
- **Verification has a limit.** No iOS device is in the loop and headless Chromium shows no compositor-thread scrolling, rubber-banding or soft keyboard. Prove what can be proved on desktop (a mobile-width viewport, `scrollWidth` against `clientWidth`, `matches()` on a built fixture), state plainly what only a phone can confirm, and ask the owner to test it. The owner's devices: iPhone SE2 with Safari (A13, iOS 26 Liquid Glass, no home indicator, floating toolbar), iPhone XR with Firefox and Safari (A12, iOS 18 at most, home indicator, toolbar that collapses). Frames from a screen recording are good evidence: extract them with ffmpeg into the scratchpad, never into the repo, and measure rather than eyeball.

## Published contract

- Keep the contract in sync with the code. If a task changes something the contract mirrors (a new or removed export, a prop, a build output file), update `packages/react-animated-select/index.d.ts` and the matching fields of `packages/react-animated-select/package.json` (`exports`, `files`, `main`, `module`, `types`) in the same change, and list those edits in the reply. Before finishing, check that `index.d.ts` matches the exports of `src/index.js` and the props of `<Select/>`.
- Do not change the contract on your own initiative: no new, removed or renamed public API, no changes to `peerDependencies`, `sideEffects` or `version` without explicit approval. A breaking change for consumers needs approval.
- `react` and `react-dom` are externals and peer dependencies. They are never bundled.
- The build (`npm run build -w packages/react-animated-select`, Vite library mode, `preserveModules`) outputs per-module ESM (`dist/*.js`, entry `dist/index.js`) and CJS (`dist/*.cjs`, entry `dist/index.cjs`), plus `dist/index.d.cts`. CSS is split per module and imported by the ES files; the CJS files have the CSS imports stripped. The combined `dist/style.css` (starts with `@layer rac.base, rac.theme;`, then base, theme, chip) is exported as `react-animated-select/style.css`.

## Releases

- Library source: `packages/react-animated-select/src`. Edit it directly; there is no sync step and no second copy.
- **Changesets.** A change to the published package (code, `index.d.ts`, `package.json` contract, root `README.md`) adds `.changeset/<kebab-slug>.md`, written by hand because the CLI is interactive:
  ```
  ---
  'react-animated-select': patch
  ---

  One line for the changelog, written for library users.
  ```
  Before 1.0: `minor` for a breaking change or a new feature, `patch` for a fix. Internal changes (tests, docs only, demo, backend) need no changeset.
- **Before a library release,** re-measure the bundle sizes (Rolldown-Vite consumer build, React external) and write the current numbers into `SIZES` in `apps/demo/src/plugins/bundle.jsx`.
- Never run `npm publish`, `changeset publish`, `npm version` or `git tag` by hand. Releases happen only by merging the "Version Packages" pull request that CI opens.
- The demo deploys to GitHub Pages on every push to `main` that touches the library or the demo. Backend-only pushes do not rebuild it.

## Links between workspaces

The library and the backend each relate only to the demo; the demo relates to both. The library and the backend never depend on each other (the backend only reads the library source to build its LLM context).

1. Working on the demo, a bug found in the library or the backend is always reported to the owner. It is fixed in place only with the owner's approval or on a direct instruction (then right away, so the context is not lost, following that workspace's `CLAUDE.md`). Otherwise it is recorded in that workspace's `BUGS.md`: `packages/react-animated-select/BUGS.md`, or `apps/backend/BUGS.md` (created with its first entry).
2. Working on the library, a change the site should reflect is made in `apps/demo` in the same change, or recorded in `apps/demo/SYNC.md`.
3. Working on the backend, a change that affects the demo is made in `apps/demo` in the same change, or recorded in `apps/demo/SYNC.md`.

For 2 and 3, if the task does not say which, ask the owner.

4. Working anywhere, a change the "Ask a question" assistant should know (a prop, default, `texts` or `icons` key, export, class, state attribute, variable, plugin, behaviour) adds one short line to the "Knowledge queue" of `apps/backend/BUGS.md` in the same change (see Model roles).

## Model roles

The owner works with two agents: Claude Code for code and precise, complex work; Gemini in Google Antigravity for bulk text work.

- **Gemini owns the backend assistant's texts:** the prompts (`apps/backend/src/data/prompts/`) and the knowledge digests (`apps/backend/src/data/documentation.md`, `styling.md`). It writes them from scratch and applies bulk updates, following `apps/backend/KNOWLEDGE.md`.
- **Claude does not edit those files**, not even for a small fix: syncing them change by change leaks tokens. Claude appends one line to the "Knowledge queue" of `apps/backend/BUGS.md` (format in that file) and goes on; Gemini applies the whole queue in one batch later. Only a direct request from the owner overrides this.
- **Everything else is unchanged:** code, comments and doc-keys, `src/README.md`, `README.md`, `FEATURES.md`, `STYLES.md`, the `CLAUDE.md` files, `BUGS.md` entries and the backend code that loads the texts (`src/llm.js`, `scripts/`) stay Claude's, under the same rules as before.
- `npm run build-data --prefix apps/backend` also runs the knowledge check (`scripts/checkData.js`, no LLM, no tokens): it lists what the digests miss against `index.d.ts` and the library CSS. Warnings it prints during Claude's work go to the queue, not into the digests.

- `apps/sandbox` is local and gitignored: never reference it from tracked code. A scenario worth keeping becomes a test.
- `@l1nway/collapse` is a demo dependency only. The library never imports it; it keeps its own `motion.jsx`.

## Verify

`npm run lint`, `npm run build`, `npm run check:pack`, `npm test`.
