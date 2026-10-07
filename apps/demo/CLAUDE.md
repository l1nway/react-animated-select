# react-animated-select â€” demo site

@~/projects/claude-rules/core.md
@~/projects/claude-rules/react.md
@~/projects/claude-rules/web.md
@~/projects/claude-rules/web-platforms.md
@~/projects/claude-rules/css.md
@~/projects/claude-rules/arch-features.md


The repo root `CLAUDE.md` has the map, the commands and the links between workspaces (rule 1: library and backend findings; rules 2 and 3: `SYNC.md`); this file adds the demo.

## Project

- This is the **demo and presentation page** for `react-animated-select`, an npm library with one deeply customizable `<Select/>` UI element (with `<Option/>` and `<OptGroup/>`). The library solves the well-known problems of selects on the web: native `<select>` is hard to style and animate, custom ones usually lack keyboard, touch and ARIA support.
- The site's job is to show the library: what it does, why it is better than the alternatives, live examples, code snippets and customization options.
- The site is a regular React app (Vite SPA, JavaScript only). Treat the library as a black box with a public API (props, classes, state attributes, CSS variables) and demo only what it really supports. Never claim a feature the library does not have.
- The site is the library's storefront: it must feel as fast, stable and polished as the library itself. A janky demo is a bug.

## Architecture

- Feature-driven (`arch-features.md`), with the feature folders at the root of `src/`: `start`, `header`, `menu`, `features`, `animations`, `customization`, `plugins`, `dev` (each a page section or a part of the chrome). Shared: `src/components/` (components, helpers, the store) and `src/hooks/` (hooks; the folder is created with the first shared hook). `src/rac.css` is the legacy global file (see Styles). Imports are relative (no alias is configured).
- Project architecture may be refactored later. Do not build a map of the project or document its structure in this file unless the owner asks. Folder READMEs describe one folder's reasoning; they are not that map.

## Library link

- The demo depends on the library through the workspace: `"react-animated-select": "*"` in `package.json` resolves to `../../packages/react-animated-select`, never to an npm registry copy.
- The dev server (`npm run dev` at the repo root, `http://localhost:5173/react-animated-select/`) aliases `react-animated-select` to `../../packages/react-animated-select/src/index.js`, so library source edits show with HMR. `vite build` uses the package's `dist`, so the library must be built first: `npm run build` at the root builds the package, then the demo; or `npm run build -w packages/react-animated-select`, then `npm run build -w apps/demo`.
- The demo always runs the library source of the current commit, but uses only the public API: imports from `react-animated-select`, as typed in `../../packages/react-animated-select/index.d.ts`, never deep imports or paths into the package. The library's own debugging happens in `apps/sandbox`; this site is for demonstration, interactive showcases and detailed guides.
- Sources of truth, read before demoing or describing a feature: `index.d.ts` (the public API), `src/README.md` (design notes; its `##` headings are the doc-keys `FEATURES.md` cites), `FEATURES.md` (what each feature gives, how it works, its limits, a demo idea), `STYLES.md` (every class, state attribute, CSS variable and keyframe), all in `../../packages/react-animated-select/`; then `src/*` when the docs are not enough. The demo keeps no copies of them. If they disagree, the code wins. Never paper over the difference on the site.

## Site, backend URL and commands

- Site: `https://l1nway.github.io/react-animated-select/` (Vite `base` `/react-animated-select/`). GitHub Actions (`.github/workflows/pages.yml`) builds and deploys it on every push to `main` that touches the library or the demo. There is no `gh-pages` branch and no deploy script.
- The "Ask a question" URL comes from `import.meta.env.VITE_API_URL` (read in `src/start/useLLM.jsx`): `.env.development` â†’ `http://localhost:3000/ask` (the local backend, `npm run dev:api`); `.env.production` â†’ `https://react-animated-select-backend.online/ask` (AWS); `.env.remote` â†’ the production URL, for `npm run dev:remote`. A personal override goes into `.env.development.local` (gitignored).
- Commands, from the repo root: `npm run dev`, `npm run dev:remote`, `npm run dev:api`, `npm run lint -w apps/demo`, `npm run build` (library, then demo), `npm run perf -w apps/demo`.
- Full check: `npm run lint -w apps/demo`, `npm run build` at the root, a browser check of the changed part, and `npm run perf -w apps/demo` logged in `PERF.md` for loading, animation or scroll (see Performance).

## SYNC.md and findings

- `SYNC.md` is the demo's inbox: what the library and the backend changed that the demo still has to show or adapt to. A demo session reads it, does the work, and removes done entries. Entry format and statuses are at its top.
- Link rule 1 covers everything the demo finds that has to change in the library or the backend, not only bugs: API gaps, missing classes or variables, docs that disagree with the code, perf or a11y issues, ideas. `backend.md` holds the backend request contract the site relies on and the backend problems found from the site so far.
- Record a finding in the same step it is found, and mention it in the reply. Never work around a library bug in the site silently: either show the limitation honestly, or add a minimal workaround and record it in the entry.
- Adapting the demo to a library or backend change doubles as extra testing: anything surprising is a finding under rule 1.

## Where each feature is shown

The `##` features of `../../packages/react-animated-select/FEATURES.md` and the demo sections (`#id`) that show them. Keep it current when a section starts or stops showing a feature.

| Feature | Demo section |
|---|---|
| Options panel in a portal | `#layout` |
| Accessibility (ARIA combobox) | `#a11y` |
| Native form fields | `#forms` |
| Zero-dependency animations | `#animations` (`keepMounted` in `#debug`) |
| Fine-grained re-renders | `#performance` |
| Options as JSX or data | `#usage`, `#grouping`, `#custom` |
| Any data, never broken | `#safety` |
| Selected options in the value area | `#custom` |
| Controlled or uncontrolled | `#debug` |
| Multiple selection with chips | `#multiple` |
| Touch delete mode | `#multiple`, `#a11y` |
| Async loading | `#loading` |
| States and layout stability | `#states` |
| Grows with its content, truncates at the limit | `#layout` |
| Deep customization | `#styling` (icons in `#icons`, `texts` in `#states` and `#loading`) |

Not mapped yet: Server rendering (SSR) (the demo has `#ssr`) and Tree-shakable plugins (the demo has `#plugins`, `#bundle`).

## Demos

- Every demo is realistic: something a consumer could copy into their project. Show the code next to the live result where it helps. Code snippets shown to visitors are content, not comments: keep them accurate and in sync with the live demo next to them.
- Demos cover the states a visitor cares about: default, selected, disabled, multiple, groups, async loading, keyboard, touch, custom styles.
- Options arrays and style objects passed to the library are declared outside the component or memoized, so demos do not re-render the Select on every parent render.
- Shared helpers before local copies: the `merge` reducer, `Spinner`, `SlideDown`.
- The site is a showcase of an accessible component, so it is accessible itself.

## Performance

Budgets of this site (they override the defaults of `web.md`, and are mirrored in `COLUMNS` in `scripts/perf.mjs`):

| Metric | Mobile (CPU Ã—4, slow 4G) | Desktop |
|---|---|---|
| FCP / LCP | â‰¤ 1.6 s | â‰¤ 200 ms |
| TBT | â‰¤ 450 ms | â‰¤ 50 ms |
| Longest task | â‰¤ 300 ms (target â‰¤ 200 ms after the section rework) | â€” |
| CLS on load and full scroll | â‰¤ 0.01 (the menu sub-list animation is excluded) | same |
| Idle after the intro | â‰¤ 50 ms per 5 s, no style or layout work | same |
| Entry JS (entry + preloaded chunks) | â‰¤ 120 KB gzip | â€” |

**Measuring: `npm run perf -w apps/demo`**
- Builds only the demo, against the library `dist` as it is: build the library first (`npm run build -w packages/react-animated-select`).
- Builds, starts `vite preview` and headless Chrome/Edge (no extra deps; `BROWSER=<path>` if not found), runs 3 cold loads per profile plus idle and full-scroll passes, and prints every metric against its budget and the last `PERF.md` row. It exits 1 when a budget is broken or the page throws.
- Run it at the end of any session that touched loading, animation, scroll, a part or dependencies, and after adapting the demo to a library change that affects them. Optionally run it before starting, for a clean baseline.
- Then log the result: `npm run perf -- --log "what changed and why"`. This appends a row to `PERF.md`, the performance journal (format at its top). Log only states worth keeping; never log a regression without saying why it was worth it.

**Loading**
- The first screen is the header, the aside and the `start` part (intro, usage, question). Everything else is a lazy part: `<Part id/>` (`src/components/deferred.jsx`), listed in `PARTS` (`src/components/store.js`) and `LOAD`. The root element of a part carries the part id. Parts mount one per idle callback, nearest to the visitor first, and chunks are preloaded nearest first, in small batches, after the first contentful paint (`afterPaint`, `src/components/README.md`). The first-screen CSS is inlined into the HTML at build time; nothing render-blocking may be added back.
- The first screen is prerendered into `index.html` at build time and hydrated (`src/components/README.md`, Prerender). Check a first-screen change with JS disabled against the hydrated page: same pixels.
- A new section is a new part, never an eager import in `app.jsx`.
- Heavy libraries never enter the entry chunk: `gsap` by dynamic `import()` after hydration behind `afterPaint` (as in `header.jsx`); `framer-motion` only inside lazy parts, as `m.*` under `<Motion>` from `src/components/motion.jsx`, never in first-screen code; `lottie-react` and its JSON through the lazy player from `catEyes.jsx`; `prism-react-renderer` through `CodeBlock`, with its plain twin; `react-live` lazy in Playground. Run `vite build` after such changes and check that the entry chunk did not grow.
- `gsap` is for text effects only.

**Sections and parts (pending rework)**
- The sections are going to be rebuilt for the current library (`FEATURES.md` lists the reworked and new features; `SYNC.md` lists what the demo still has to show). Today `features` mounts about 775 DOM nodes in one task (~195 ms on mobile), and that is the main thing to fix. Every new or rebuilt section follows these rules from the start.
- Size a part by its mount cost. Rough guide: one part mounts in â‰¤ 150 ms on mobile (â‰ˆ 300 DOM nodes, a few `Select`s). A heavier section becomes a thin container part that renders one nested `<Part id/>` per subsection.
- A nested part follows the same contract: its id is the menu item id and the id of its root element, it goes into `PARTS` in document order, gets its parent in `PARENT` and its own chunk in `LOAD`. Restore, `#hash`, menu jumps and nearest-first mounting then work without other changes. Re-check them after a split anyway.
- Ids are public (`#hash` links, saved scroll anchors). Keep existing ids when rebuilding a section.
- Inside a part, defer what the visitor does not see yet: dropdown content, long option lists, code panels and tabs mount on first open or on visibility, not with the part.
- A part reserves no height up front. Parts above the viewport are compensated by native scroll anchoring, or by `hold`/`release` in `store.js` where it is missing (Safari, see `src/components/README.md`). If the target chunk is slow (mobile slow 4G) the 3 s restore guard in `boot()` shows the page anyway, so keep the target part's chunk small.
- After a rebuilt section (or a batch of them, verified once at the end), run `npm run perf` and log it. `M long` must not grow; the goal for the rework is â‰¤ 200 ms.

**Navigation and scroll**
- Any element below the first screen may not exist yet. Navigate only via `setStore({scrollTo: id})`. The menu shows the missing parts, waits for them to settle (framer resets scroll while it measures new mounts), then scrolls.
- Scroll restoration is manual. `boot()` restores reload and `#hash` positions, and `.rac-main[data-restoring]` stays hidden until the target part is in place. Entrance animations start only once `data-restoring` is gone; the header intro is skipped while restoring.
- A target near the page bottom cannot reach its offset, so restore also ends on `settled`. Without `overflow-anchor` (Safari) the page is revealed only after every part above the target is mounted, and no insert above the viewport may happen after the reveal (blank-tile flicker). Details and traps: `src/components/README.md` (Scroll restore, Manual scroll anchor).
- Load jitter: log the target's `top` per frame with 2 decimals and any `scrollTo`/`scrollBy` after the reveal; the target must not move by more than 1 px.

**State**
- A flag shared across sections goes into `src/components/store.js` (`useStore(select)`/`setStore(partial)`); everything else is local state. Rows rendered from a list are `memo` with stable props (`Link` in `menu.jsx`).

## Styles

- Keep the site's own classes clearly separate from the library's classes (`rac-*`). Do not restyle library internals with overrides that a real consumer could not reasonably write: customization demos use the library's documented classes, state attributes and variables.
- One style file per sub-block: `plugins/loading.css` next to `loading.jsx`, imported by it (`import './loading.css'`).
- A small component may keep its styles in the `.jsx` file as a `<style>{CSS}</style>` constant rendered once by the component (`css.md`, Where styles live). `slider.jsx`/`slider.css` is the example: merged while the slider was simple, split back out once its drag physics pushed it past 200 lines.
- `src/rac.css` is the legacy global file. It keeps only truly global rules (resets, tokens, `.rac-sr-only`, classes used by many blocks).
- The shared layer at the top of `rac.css`: variables (`--rac-muted`, `--rac-line`, `--rac-focus`, `--rac-mono`), shared classes (`rac-panel` card frame, `rac-desc` justified text, `rac-btn-bare` text button, `rac-btn-glow` gradient button, `rac-split` two-column grid, `rac-iconed` container whose `svg` icons get `--rac-icon`, default `1em`), and rules on HTML tags / `:where()` selectors (section frame, heading margins, focus ring).
- A reusable pattern (semantic table, `rac-tick`) keeps its styles in the file of the block that owns it, documented in that folder's README.

## Semantics

- **Planned refactor: heading levels** (owner decision, 2026-10-06; its own step, not on edit). Today: `h1` in `header.jsx`, a single `h2` ("Getting started", `start.jsx`), every section `h3` (`Title`, `track.jsx`, `Table`), inner blocks `h4`. In the outline the Features, Plugins, Customization and Dev sections therefore nest under "Getting started", against `web.md`. Target: every `Part` (`start`, `features`, `plugins`, `customization`, `dev`) gets an `h2` (the menu labels; visually hidden where the design has no visible title), sections stay `h3` through `Title`, inner blocks `h4`. Check the outline and the `[DOC: section-heading]` entry in `src/components/README.md` in the same step.
- Every table is `Table` from `src/components/section.jsx`; never write `<table>`, `<caption>` or `<thead>` by hand. Its parts are props: `icon` (visible title, else an sr-only caption), `desc` (description row), `columns` (header with icons, `head={false}` hides it visually), `region={false}` (no scroll wrapper), `rows` + `state` + `onChange` (props rows, own value cells via `cells`) or `children` (own rows). A section built around a table takes its heading from `Table`; any other section uses `Heading` or `Title` from `src/components/helpers.jsx`. Never retype the heading markup.
- Rows of props (name, type, value control, description) are a table, not a list of labels. Checkboxes are always `Tick`. Description cells are `td.rac-table-text > p`. One table look and one hover (`--rac-line` on `table:hover`) for every table; no table changes `display` of its elements.
- Reference implementation: `src/plugins/loading.jsx`; contracts, invariants and traps: `src/components/README.md` (Section heading, Semantic table, rac-tick, Props table). Reusable patterns (the semantic table, `rac-tick`, `.rac-sr-only`, the CSS line clamp) are documented there once.

## Layout stability

- A placeholder for a lazy or `Suspense` element renders the same markup, classes and content as the real one (`src/dev/README.md`, Playground holder). Check both heights at desktop and 390 px. Near the page bottom the scroll is clamped, so even a few pixels of difference move everything above.

## Context

- Work only with source files (`src/`, `scripts/`, `public/`, config and the project `.md` files).
