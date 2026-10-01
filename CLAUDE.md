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
- Verify after each change: lint and `npx vite build`, then check the changed part in the browser. Changes to loading, animation or scroll are also measured with `npm run perf` and logged in `PERF.md` (see Performance).
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
- No scattered `useState` and no duplicate helpers. Search the project for an existing helper before writing a new one.
- Use `useLayoutEffect` for synchronous DOM or state fixes before paint (prevents flicker). Use `useEffect` for everything else.

## State

- More than 3 state fields → `useReducer` with a merge reducer. Declare the reducer once and reuse it; never re-declare it locally.
- `dispatch({field})` merges a partial. Pass an updater, `setState(prev => ({list: prev.list.filter(...)}))`, only when the next value reads the previous one.
- Validate before dispatch, never inside the reducer. The reducer stays synchronous; async code dispatches from effects or handlers.
- State holds what the user picked (ids, flags), never a copy of a constant or a catalogue. Static demo data (option lists, snippets) lives outside components.

## Re-renders

- Hooks return stable references: functions via `useCallback`, objects via `useMemo`. Refs, `dispatch` and setters are stable — leave them out of deps.
- Options arrays and style objects passed to the library are declared outside the component or memoized, so demos do not re-render the Select on every parent render.
- A component rendered in a list is wrapped in `memo` when it is non-trivial. No closures created inside `.map()` for memoized children.
- Every `setTimeout`/`setInterval`/listener is stored and cleaned on unmount and before re-arming.

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
- A part reserves no height up front. Parts above the viewport are compensated by scroll anchoring. If the target chunk is slow (mobile slow 4G) the 3 s restore guard in `boot()` shows the page anyway, so keep the target part's chunk small.
- After each rebuilt section, run `npm run perf` and log it. `M long` must not grow; the goal for the rework is ≤ 200 ms.

**Navigation and scroll**
- Any element below the first screen may not exist yet. Navigate only via `setStore({scrollTo: id})`. The menu shows the missing parts, waits for them to settle (framer resets scroll while it measures new mounts), then scrolls.
- Scroll restoration is manual. `boot()` restores reload and `#hash` positions, and `.rac-main[data-restoring]` stays hidden until the target part is in place. Entrance animations start only once `data-restoring` is gone; the header intro is skipped while restoring.
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
- Any file-structure proposal lists the approximate line count of every resulting file.
- No barrel files. Relative imports only.

## Styles

- Keep the site's own classes clearly separate from the library's classes (`rac-*`). Do not restyle library internals with overrides that a real consumer could not reasonably write — customization demos use the library's documented classes, state attributes and variables.
- Prefer classes over inline styles. Inline styles only for values computed at runtime.
- A CSS variable only for a value shared by several rules or read by JS. A single-use value is a plain property.

## Comments

- Keep comments minimal. Allowed: short tags of at most 5 lowercase English words that name a line or group without explaining it (`// stale guard`, `// demo data`).
- Not allowed: explanations of *why*, bug notes, history, JSDoc, commented-out code. If something needs an explanation, tell the user in the reply.
- Code snippets shown to visitors on the site are content, not comments: keep them accurate and in sync with the live demo next to them.

## Accessibility

- The site is a showcase of an accessible component, so it must be accessible itself: semantic landmarks and headings, visible focus, keyboard reachability, `aria-label` on icon-only buttons, `aria-hidden` on decorative icons, sufficient contrast.
- Keyboard parity: nothing on the page is reachable only by mouse or only by touch.
- Respect `prefers-reduced-motion` for the site's own animations.

## Layout stability

- Demo blocks keep one size while their content changes (placeholder, value, chips, loading, empty). Reserve space with shared CSS values, not with content that appears later.
- Animations never shift surrounding layout unexpectedly. Measure in `useLayoutEffect`, before paint.

## Context & token policy

- Never read `node_modules/`, `dist/` or lock files.
- Read only the files the task needs, and do not dump whole files into replies.
- Refactor anti-patterns carefully: functionality first, then style. An easy clear fix is made. A large one is proposed first.
