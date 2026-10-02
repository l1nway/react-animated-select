# react-animated-select — demo site

Always reply to the user in Russian. Code and comments are in English; user-facing text on the site is in English unless the user says otherwise.

## Project

- This repo is the **demo and presentation page** for `react-animated-select`, an npm library with one deeply customizable `<Select/>` UI element (with `<Option/>` and `<OptGroup/>`). The library solves the well-known problems of selects on the web: native `<select>` is hard to style and animate, custom ones usually lack keyboard, touch and ARIA support.
- The site's job is to show the library: what it does, why it is better than the alternatives, live examples, code snippets and customization options.
- The site is a regular React app. Treat the library as a black box with a public API (props, classes, state attributes, CSS variables) and demo only what it really supports. Never claim a feature the library does not have.
- The site is the library's storefront: it must feel as fast, stable and polished as the library itself. A janky demo is a bug.

## Library link

- The library repo is the parent folder `..` (its own git repo; `demo/` is gitignored there). **It is read-only from here**: never edit, build or commit anything in `..`.
- The site consumes the published npm package `react-animated-select` (version in `package.json`), never `../src` directly. The library has its own sandbox for debugging; this site is for demonstration, interactive showcases and detailed guides.
- Release cycle: library changes → version release → the demo is adapted to the new version. Adapting the demo doubles as extra testing: anything surprising goes to `SYNC.md`.
- Sources of truth, read before demoing or describing a feature:
  - `../index.d.ts`: the public API (props, exports).
  - `../src/README.md`: design notes; its `##` headings are the doc-keys that `FEATURES.md` cites.
  - `FEATURES.md`: what each feature gives, how it works, its limits, a demo idea. `STYLES.md`: every class, state attribute, CSS variable and keyframe. Both are reference material for writing the site and are rarely edited from here; they will move to the library repo.
  - `../src/*`: the implementation, when the docs are not enough.
- If these disagree, the code in `../src` wins. Never paper over the difference on the site.
- Before a demo relies on something, check that `../package.json` `version` matches the installed package. If the source is ahead, demo only what the installed version does and tell the user.

## SYNC.md: library notes

- `SYNC.md` collects everything the demo finds that has to change in the library: bugs, API gaps, missing classes or variables, docs that disagree with the code, perf or a11y issues, ideas. The library session works through it later in its own repo.
- Add the entry in the same step it is found, and mention it in the reply. Never work around a library bug in the site silently: either show the limitation honestly, or add a minimal workaround and record it in the entry.
- Format and statuses are described at the top of `SYNC.md`.

## Workflow

- Iterate: one section, one demo or one component per step. No big-bang rewrites.
- Analysis before code for anything larger than a local fix: describe the problem and the plan, then implement once the user has seen it.
- The site must build and work after every step.
- Verify (lint, `npx vite build`, a browser check of the changed part, and `npm run perf` logged in `PERF.md` for loading, animation or scroll, see Performance) only after major changes or on a direct request. Small and local steps skip it; a multi-step task verifies once at the end.
- Project architecture may be refactored later. Do not build a map of the project or document its structure in this file unless the user asks.

## Site constraints

- JavaScript only (`.js`/`.jsx`).
- Target React 19.2+.
- Add dependencies only when the user agrees. Prefer what is already in `package.json`.
- Every demo must be realistic: it should be something a consumer could copy into their project. Show the code next to the live result where it helps.
- Demos must cover the states a visitor cares about: default, selected, disabled, multiple, groups, async loading, keyboard, touch, custom styles.
- The page must work on desktop and mobile, in light and dark themes if the site supports them.
- SSR-safe habits: touch `window` and `document` only inside effects and handlers.

## Code style

- As short, compact and declarative as possible. No layers, wrappers or abstractions that do not pay for themselves.
- Match the existing format: 4-space indent, no semicolons, single quotes (in JSX attributes too), `<Tag/>` with no space before `/>`.
- No spaces inside braces: `{variable}`, `{a, b}`, `import {x} from`. Never `{ variable }`.
- No ladders: keep props, params and destructuring on one line while it stays readable.

```jsx
export default function DemoCard({title, code, children}) {
```

- One-line effects stay on one line: `useEffect(() => {fetchData()}, [id])`.
- No copy-paste: markup that repeats with small differences becomes data plus one `.map()` (header cells from a `columns` array, `[text, Icon]` pairs chosen by a condition) or one small component with props. Two near-identical branches become one branch driven by a value, with the difference as a `data-*` attribute styled in CSS, not as an inline style or a duplicate element.
- Shared values are named constants at module level: animation presets (`slide`, `pop`), long texts (`desc`), column lists, icon maps. Order inside a file: imports, demo data and constants, small helpers, sub-components (`memo`), the main component, the export.
- Keep an element's attributes on one line while it stays readable (about 120 characters), as with props. A tag split over many lines for a few short attributes is a ladder.
- Pick the shortest correct form: `<Icon/>` from a variable instead of a ternary of two icons, `a || undefined` for optional attributes, shared helpers (`merge` reducer, `Spinner`, `SlideDown`) instead of local copies.
- When editing a file, refactor it toward these rules in the same step: remove copy-paste, hoist constants, extract the repeated part, drop state that does not need to be shared. Behavior and markup stay identical; verify with a build.
- No scattered `useState` and no duplicate helpers. Search the project for an existing helper before writing a new one.
- Use `useLayoutEffect` for synchronous DOM or state fixes before paint (prevents flicker). Use `useEffect` for everything else.

## State

- More than 3 state fields → `useReducer` with a merge reducer. Declare the reducer once and reuse it; never re-declare it locally.
- `dispatch({field})` merges a partial. Pass an updater, `setState(prev => ({list: prev.list.filter(...)}))`, only when the next value reads the previous one.
- Validate before dispatch, never inside the reducer. The reducer stays synchronous; async code dispatches from effects or handlers.
- State holds what the user picked (ids, flags), never a copy of a constant or a catalogue. Static demo data (option lists, snippets) lives outside components.

## Re-renders

- Hooks return stable references: functions via `useCallback`, objects via `useMemo`, and the returned object itself via `useMemo`. Refs, `dispatch` and setters are stable — leave them out of deps. A hook that composes an unmemoized hook loses its own stability, so check what it calls.
- Deps that arrive as inline literals (`['a', 'b']`, `{}`) are new on every render and defeat the memo: move them outside the component or depend on a derived key (`list.join()`).
- A prop read only once at mount (a stagger index, an initial value) should stop changing afterwards, so it does not re-render memoized rows when the list shifts.
- Callbacks for list rows take the row's id as an argument instead of closing over it, so one stable function serves every row.
- Options arrays and style objects passed to the library are declared outside the component or memoized, so demos do not re-render the Select on every parent render.
- A component rendered in a list is wrapped in `memo` when it is non-trivial. No closures created inside `.map()` for memoized children.
- Every `setTimeout`/`setInterval`/listener is stored and cleaned on unmount and before re-arming.
- State that only one small child needs (hover, open, focus) lives in that child (`memo`), not in the section's reducer, so the section and its `Select` do not re-render on it. Give such a child a stable callback (`useCallback`) for what it reports upward.
- An object or array built from state and passed as a prop (`texts`, `icons`, `style`) is `useMemo`'d on its primitive parts; a constant one is declared at module level.

## Performance

The site is the library's storefront, so it has to load and run like one. Every change keeps these budgets (mirrored in `COLUMNS` in `scripts/perf.mjs`).

| Metric | Mobile (CPU ×4, slow 4G) | Desktop |
|---|---|---|
| FCP / LCP | ≤ 1.6 s | ≤ 200 ms |
| TBT | ≤ 450 ms | ≤ 50 ms |
| Longest task | ≤ 300 ms (target ≤ 200 ms after the section rework) | — |
| CLS on load and full scroll | ≤ 0.01 (the menu sub-list animation is excluded) | same |
| Idle after the intro | ≤ 50 ms per 5 s, no style or layout work | same |
| Entry JS (entry + preloaded chunks) | ≤ 120 KB gzip | — |

**Measuring: `npm run perf`**
- Builds, starts `vite preview` and headless Chrome/Edge (no extra deps; `BROWSER=<path>` if not found), runs 3 cold loads per profile plus idle and full-scroll passes, and prints every metric against its budget and the last `PERF.md` row. It exits 1 when a budget is broken or the page throws.
- Run it at the end of any session that touched loading, animation, scroll, a part or dependencies, and before a release adaptation. Optionally run it before starting, to have a clean baseline.
- Then log the result: `npm run perf -- --log "what changed and why"`. This appends a row to `PERF.md`, the performance journal (format at its top). Log only states worth keeping; never log a regression without saying why it was worth it. A broken budget is fixed or raised with the user, never logged silently.
- Mobile numbers vary about ±10 % between runs. Re-run before chasing a small change.

**Loading**
- The first screen is the header, the aside and the `start` part (intro, usage, question). Everything else is a lazy part: `<Part id/>` (`src/components/deferred.jsx`), listed in `PARTS` (`src/components/store.js`) and `LOAD`. The root element of a part carries the part id. Parts mount one per idle callback, nearest to the visitor first, and chunks are preloaded right after first paint.
- A new section is a new part, never an eager import in `app.jsx`.
- Heavy libraries never enter the entry chunk:
  - `gsap`: dynamic `import()`, started after the first frame (as in `header.jsx`).
  - `framer-motion`: only inside lazy parts, as `m.*` under `<Motion>` from `src/components/motion.jsx`. Never import it in first-screen code.
  - `lottie-react` and its JSON: the lazy player from `catEyes.jsx`.
  - `prism-react-renderer`: `CodeBlock`, with its plain twin.
  - `react-live`: lazy in Playground.
- Run `vite build` after such changes and check that the entry chunk did not grow.

**Sections and parts (pending rework)**
- The sections are going to be rebuilt for the new library version (`FEATURES.md` lists the reworked and new features). Today `features` mounts about 775 DOM nodes in one task (~195 ms on mobile), and that is the main thing to fix. Every new or rebuilt section follows these rules from the start.
- Size a part by its mount cost. Rough guide: one part mounts in ≤ 150 ms on mobile (≈ 300 DOM nodes, a few `Select`s). A heavier section becomes a thin container part that renders one nested `<Part id/>` per subsection.
- A nested part follows the same contract: its id is the menu item id and the id of its root element, it goes into `PARTS` in document order, gets its parent in `PARENT` and its own chunk in `LOAD`. Restore, `#hash`, menu jumps and nearest-first mounting then work without other changes. Re-check them after a split anyway.
- Ids are public (`#hash` links, saved scroll anchors). Keep existing ids when rebuilding a section.
- Inside a part, defer what the visitor does not see yet: dropdown content, long option lists, code panels and tabs mount on first open or on visibility, not with the part.
- A part reserves no height up front. Parts above the viewport are compensated by native scroll anchoring, or by `hold`/`release` in `store.js` where it is missing (Safari, see `src/components/README.md`). If the target chunk is slow (mobile slow 4G) the 3 s restore guard in `boot()` shows the page anyway, so keep the target part's chunk small.
- After a rebuilt section (or a batch of them, verified once at the end), run `npm run perf` and log it. `M long` must not grow; the goal for the rework is ≤ 200 ms.

**Navigation and scroll**
- Any element below the first screen may not exist yet. Navigate only via `setStore({scrollTo: id})`. The menu shows the missing parts, waits for them to settle (framer resets scroll while it measures new mounts), then scrolls.
- Scroll restoration is manual. `boot()` restores reload and `#hash` positions, and `.rac-main[data-restoring]` stays hidden until the target part is in place. Entrance animations start only once `data-restoring` is gone; the header intro is skipped while restoring.
- Restore code computes the target position only as `getBoundingClientRect().top + scrollY - dy`, never from summed `offsetTop` (integers): Firefox at a fractional scale snaps scroll to device pixels and the target jitters by 1 px. A target near the page bottom cannot reach its offset, so restore also ends on `settled`. Without `overflow-anchor` (Safari) the page is revealed only after every part above the target is mounted, and no insert above the viewport may happen after the reveal (blank-tile flicker). Details and traps: `src/components/README.md` (Scroll restore, Manual scroll anchor).
- Check load jitter in more than Chrome at 100 %: Firefox at 125 % scale, Chrome with anchoring disabled (414×896, CPU ×4), and for Safari a real iPhone against `vite preview --host`, not the dev server. Log the target's `top` per frame with 2 decimals and any `scrollTo`/`scrollBy` after the reveal; the target must not move by more than 1 px.
- Scroll-linked logic uses `IntersectionObserver`. No scroll listeners, no `ScrollTrigger` (it keeps a `requestAnimationFrame` loop running forever).

**Animation**
- Prefer CSS transitions and keyframes; `gsap` is for text effects only.
- Infinite animations run only while visible: an `IntersectionObserver` toggles `data-visible` (`Spinner` in `icons.jsx`). Use `steps()` where 60 fps is not visible anyway.
- Text effects never move layout: reserve the final box (ghost text), fix glyph slots, and keep words `nowrap` (the header title).
- No layout thrash: batch DOM reads before writes, and use passive listeners.

**State and rendering**
- No global state library. A flag shared across sections goes into `src/components/store.js` (`useStore(select)`/`setStore(partial)` on `useSyncExternalStore`), and the selector returns a primitive so that only its readers re-render. Everything else is local state.
- Rows rendered from a list are `memo` with stable props (`Link` in `menu.jsx`).

## Files

- Hard limit: 200 lines per file (210 tolerated, never more). Past that, split.
- No half-empty files: a file of ~20–70 lines exists only with a real reason. Otherwise merge it into the cohesive neighbour; keep the file count low.
- Keep helpers, constants and sub-components in the file of their only consumer.
- Shared code lives in shared folders: a hook, component or helper used by two or more other files goes to `src/hooks/` (hooks) or `src/components/` (components, helpers), never into one of its consumers and never copied. When a second consumer appears, move it there in the same step and update the imports. Search both folders before writing a new one.
- Any file-structure proposal lists the approximate line count of every resulting file.
- No barrel files. Relative imports only.

## Styles

- Keep the site's own classes clearly separate from the library's classes (`rac-*`). Do not restyle library internals with overrides that a real consumer could not reasonably write — customization demos use the library's documented classes, state attributes and variables.
- Prefer classes over inline styles. Inline styles only for values computed at runtime.
- A CSS variable only for a value shared by several rules or read by JS. A single-use value is a plain property.
- One style file per sub-block (a section or component such as `loading`, `performance`, `forms`): `features/loading.css` next to `loading.jsx`, imported by it (`import './loading.css'`). The class prefix of the block matches the file name.
- Small sub-blocks may share one file only while the merged file stays under about 100–120 lines. Past that, each gets its own file.
- A component small enough that its `.jsx` and its styles together stay under 200 lines may keep the styles inside the `.jsx` file itself instead of a separate `.css` file, as a `<style>{CSS}</style>` constant rendered once by the component. Prefer this over generating a near-empty companion file. If later edits push the combined size past 200 lines, split the styles back into their own file in the same step (`slider.jsx`/`slider.css` is the example: merged while the slider was simple, split back out once its drag physics pushed it past the threshold).
- `src/rac.css` is the legacy shared file. It keeps only truly global rules (resets, tokens, `.rac-sr-only`, classes used by many blocks). Never add a new sub-block's styles to it.
- Whenever you edit the styles of a sub-block that still lives in `rac.css`, move all of that block's rules into its own file in the same step, without waiting to be asked: cut the whole block (including its media queries and keyframes), import the file from the block's component, check that no other file uses those classes (grep), and mention the move in the reply. Keep selectors and values identical during the move; cascade order is the only thing to re-check.
- A reusable pattern (semantic table, `rac-tick`) keeps its styles in the file of the block that owns it, documented in that folder's README. Other blocks import or copy from there; they do not move it back to `rac.css`.

## Comments

- Keep comments minimal. Allowed: short tags of at most 5 lowercase English words that name a line or group without explaining it (`// stale guard`, `// demo data`), and doc-key tags (see Folder docs).
- Not allowed in source files: explanations of *why*, bug notes, history, JSDoc, commented-out code, anything over ~7 words. A non-obvious *why* goes to the folder `README.md` behind a doc-key; a one-off remark goes to the user in the reply.
- Code snippets shown to visitors on the site are content, not comments: keep them accurate and in sync with the live demo next to them.

## Folder docs

- Context that does not fit in the code (invariants, workarounds, why a pattern was chosen, known limits, how the files of a folder relate) lives in a `README.md` in the same folder, written for a future reader who has not seen the code for weeks.
- A README must earn its place: only for a folder with several interrelated files, non-obvious logic or a critical invariant (the lazy parts and scroll restore in `src/components/`, a section with its own tricks). No README for small files, plain data, styles or self-explanatory helpers. Do not create one preemptively.
- Doc-key: replace the extracted comment with `// [DOC: key-name]` (lowercase kebab-case, descriptive). The key matches a `##` heading of that README (`## Key name`), the same convention as `../src/README.md` and `FEATURES.md`. Code and README are then found and updated together.
- On every edit that changes behavior, structure or logic (not a rename, a style tweak or an import): check for a `README.md` in the folder and fix whatever became stale, plus any stale comment or doc-key you notice, in the same step. If unsure, update.
- Moving a heavy comment out of a file you are editing anyway is part of the edit. Do not sweep other files for it.
- Component instructions: a component or section with non-obvious or special logic (a reusable pattern, an invariant, a CSS trick, a coupling between files, a known trap) gets a `## <Component name>` heading in the folder `README.md`, plus a `// [DOC: key-name]` tag at the spot in code. Each entry holds, in this order and only what applies: purpose (one line); files and who uses it; the contract (props, data attributes, classes, CSS variables); invariants and "do not" rules; known traps and limits; where else the pattern is used or should be. Keep it short and factual, written so another agent can edit the component without reading all its code, and update it in the same step as the code. A plain component with obvious logic gets no entry.
- Keeping instructions current is mandatory, not optional. Every step that touches a documented component updates its README entry in the same step, including fixes of small bugs and tweaks of values (sizes, cursors, selectors) that the entry mentions. A stale instruction is a bug.
- Write instructions aggressively and in detail, continuously: whenever you learn a nuance that another agent could trip on (a specificity fight, a hit-target quirk, a browser behaviour, a value that was tuned and why, a rejected approach), add it to the entry right away. Prefer too much concrete detail over too little; trim only duplicates.
- Reusable patterns (the semantic table, the `rac-tick` checkbox, `.rac-sr-only`, the CSS line clamp) are documented once in the README of the folder that owns them, and other sections link to that entry instead of repeating it.
- This is not the project map that Workflow forbids: READMEs describe one folder's reasoning, they are not an index of the structure. Library-side findings still go to `SYNC.md`, not to a README.

## Accessibility

- The site is a showcase of an accessible component, so it must be accessible itself: semantic landmarks and headings, visible focus, keyboard reachability, `aria-label` on icon-only buttons, `aria-hidden` on decorative icons, sufficient contrast.
- Keyboard parity: nothing on the page is reachable only by mouse or only by touch.
- Respect `prefers-reduced-motion` for the site's own animations.

## Semantics

- Native tags first: `section` + `h3` for a section, `table`/`caption`/`thead`/`th scope` for tabular data, `label` around an input, `fieldset`/`legend` or `role='radiogroup'` for a group of choices, `button` for actions, `ol`/`ul` for lists. ARIA roles only where a native tag cannot be used, and always when CSS changes `display` of table elements (Safari drops their semantics).
- Every table is `Table` from `src/components/section.jsx`; never write `<table>`, `<caption>` or `<thead>` by hand. Its parts are props: `icon` (visible title, else an sr-only caption), `desc` (description row), `columns` (header with icons, `head={false}` hides it visually), `region={false}` (no scroll wrapper), `rows` + `state` + `onChange` (props rows, own value cells via `cells`) or `children` (own rows). A section built around a table takes its heading from `Table`; any other section uses `Heading` or `Title` from `src/components/helpers.jsx`. Never retype the heading markup.
- Rows of props (name, type, value control, description) are a table, not a list of labels. Checkboxes are always `Tick`. Description cells are `td.rac-table-text > p`. One table look and one hover (`--rac-line` on `table:hover`) for every table; no table changes `display` of its elements.
- Reference implementation: `src/features/loading.jsx`; contracts, invariants and traps: `src/components/README.md` (Section heading, Semantic table, rac-tick, Props table).

## Layout stability

- Demo blocks keep one size while their content changes (placeholder, value, chips, loading, empty). Reserve space with shared CSS values, not with content that appears later.
- The reference size is the fullest state (longest text, most chips, every optional row), not the average or the emptiest one. Skeleton, empty, error and loaded states all render at that one size.
- Sizes come from shared named CSS values (one per line of content or row), used by the real element and its placeholder alike, never retyped pixel guesses. A row that is meaningless in one state still occupies its space.
- Prefer reusing the real element's styles for a placeholder or empty state over a parallel skeleton-only copy.
- A placeholder for a lazy or `Suspense` element renders the same markup, classes and content as the real one, never a fixed height typed next to it: the sizes then match by construction (`src/dev/README.md`, Playground holder). Check both heights at desktop and 390 px. Near the page bottom the scroll is clamped, so even a few pixels of difference move everything above.
- Animations never shift surrounding layout unexpectedly. Measure in `useLayoutEffect`, before paint.

## Context & token policy

- Never read `node_modules/`, `dist/` or lock files.
- Read only the files the task needs, and do not dump whole files into replies.
- Work only with source files (`src/`, `scripts/`, `public/`, config and the project `.md` files). Skip build output and caches.
- Refactor anti-patterns carefully: functionality first, then style. An easy clear fix is made, gradually and without a big rewrite, checking behavior after each step. A large one is proposed first, with an estimate of whether it is worth it. Never break functionality for the sake of style.
