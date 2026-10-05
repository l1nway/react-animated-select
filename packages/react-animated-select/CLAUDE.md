# react-animated-select — library

Always reply to the user in Russian. Code, doc-keys and README files are in English.

## Project

- `react-animated-select` is an npm library: one deeply customizable `<Select/>` with `<Option/>` and `<OptGroup/>` — single/multiple choice, groups, JSX or array options, async loading, chips, animations, keyboard and touch support.
- This folder is the published package, `packages/react-animated-select` of the monorepo (the repo root `CLAUDE.md` has the map, the commands and the release rules). Library source is `src/` — that is what we edit, directly: there is no second copy and no sync step. The package files next to it (`index.d.ts`, `package.json`, `vite.config.js`, `eslint.config.js`) live here too and follow the contract rules of the root `CLAUDE.md`.
- The local sandbox `apps/sandbox` (gitignored, never committed; `npm run sandbox` from the repo root, `http://localhost:5174/`) imports the library as `react-animated-select`, aliased to `src/index.js`, and demos it live (animations, states, keyboard, custom styles, performance) without `npm link`.
- Treat every change as a change to a reusable npm module, not to an app: consumers render many Selects, wrap them, restyle them, and control them from outside.
- Since 0.8 the package is a core plus tree-shakable plugins, all imported from the package root (`import {Select, chips} from 'react-animated-select'`, `<Select plugins={[chips]}/>`). See "Plugins & tree-shaking".

## Cross-workspace rules

The library and the backend each relate only to the demo; the demo relates to both. The library never depends on the backend or the demo.

1. An agent working on the demo that finds a bug in the library reports it to the owner. It fixes the library in place only with the owner's approval or on a direct instruction (then right away, so the context is not lost, following this `CLAUDE.md`). Otherwise it records the bug in [BUGS.md](BUGS.md).
2. Working on the library, a change the site should reflect (a fix, a new feature or prop, a changed default or style hook): update `apps/demo` in the same change, or add an entry to [apps/demo/SYNC.md](../../apps/demo/SYNC.md). If the task does not say which, ask the owner.

The library session reads [BUGS.md](BUGS.md), fixes, and marks entries done.

## Releases

- **Changesets.** A change to the published package (code, `index.d.ts`, the `package.json` contract, the root `README.md`) adds `.changeset/<kebab-slug>.md` at the repo root, written by hand (the CLI is interactive):
  ```
  ---
  'react-animated-select': patch
  ---

  One line for the changelog, written for library users.
  ```
  Before 1.0: `minor` for a breaking change or a new feature, `patch` for a fix. Internal changes (tests, docs only, demo, backend) need none.
- Never run `npm publish`, `changeset publish`, `npm version` or `git tag` by hand. Releases happen only by merging the "Version Packages" PR.

## Workflow

- Iterate: one module or theme per step. No big-bang rewrites.
- Analysis before code: for each module, first describe the problems and the plan, then implement once the user has seen it.
- The package must build and the sandbox must behave the same after every step.
- File reorganization is in progress: flat `src/` (no subfolders), camelCase file names, `.js` for files without JSX. The JSX-structure refactor is deferred until the user starts it, except the trigger, done on 2026-09-30 (flat tree, `@layer rac`, state attributes, renamed classes). The styles refactor was done on 2026-09-30 (`base.css` / `theme.css`, tokens). The title and chip ellipsis and the content-sized trigger were done on 2026-10-01 (doc-key `trigger-width`; animation frames clip the ellipsis and lift the size limits while they run). The title change animation (a slide of the width today) is due for a separate step on animations, together with keying the title by its state instead of its text: today any text change (typing a placeholder, `selectedText`, switching `texts`) replays the title animation (doc-key `value`, "Known issue"). That step reviews every animation trigger in the project: animate on a change of option or state, never on a mere text change. The chip row spacer was reworked into the row hold (doc-key `chip-hold`), and the inline delete spacer into the delete reserve on the same breaks (`delete-reserve`, `collapse-group`). Delete-mode changes (`deleteInline`, `deleteAlways`, touch delete mode) hold the rows and animate the chip widths since 2026-10-04 (doc-key `delete-mode`).
- Tree-shaking was done on 2026-10-04: the `chips` and `paging` plugins, version 0.8.0 (README Plugins, Paging; FEATURES "Tree-shakable plugins"; the package-side build changes shipped in 0.8.1, see [BUGS.md](BUGS.md) "Carried over in the monorepo migration"). Measurement harnesses live in the scratchpad only: rebuild them from README Plugins when needed (esbuild for size, rolldown-vite / webpack consumers for CSS drops, Playwright for runtime).
- Tests (asked on 2026-10-04, not started): full behavioural coverage, run by GitHub on every push, npm publishing blocked unless they pass. The handoff plan is the temporary [TESTING.md](../../TESTING.md) at the repo root.
- Next library edits (agreed on 2026-10-01, not started): the animation rework (a `motion` prop by role), chip reordering by drag with haptics, the virtualized option list, and search on top of it. Plans, decisions and open questions are in the FEATURES.md "Planned" section. Suggested order: virtualization, search, animations, drag. Each step starts with an analysis shown to the user.
- Animations keep animating the real `width` / `height` of the box. Replacing them with a negative margin, `clip-path` or `transform` was rejected: cheaper, but it looks cheap. Transforms are for FLIP moves and purely visual effects.
- Verify after each change, from the repo root: `npm run lint -w packages/react-animated-select` and `npm run build -w packages/react-animated-select`, then check the relevant demo in `apps/sandbox/src/App.jsx` (`npm run sandbox`).
- Every new feature or prop gets a demo case in `apps/sandbox/src/App.jsx` (local), and reaches the demo site through cross-workspace rule 2 (`apps/demo` in the same change, or `apps/demo/SYNC.md`).

## Map

- `index.js` — the package entry, pure re-exports only: `Select`, `Option`, `OptGroup`, `defineOption`, and the plugin objects `chips`, `paging`. No CSS and no code of its own (README Plugins, Styles Layer).
- `base.css` — `@layer rac.base`: only what the Select needs to work (layout, chip mechanics, panel scrolling, state motion, cursors). `theme.css` — `@layer rac.theme`: the neutral default look and the tokens.
- `select.jsx` — imports `base.css` and `theme.css` (it is the one module every consumer uses). Every public component: `Select`, `Option`, `OptGroup`. `DEFAULT_PROPS` is **the single declaration of the public API**. `MODEL_KEYS` lists the props kept out of the config context. `collectOptions` reads `<Option/>`/`<OptGroup/>` from `children` during render; they are data markers and render `null`.
- `useSelect.js` — owns the Select's reducer, merges the plugins (`usePlugins` → `ext`), and composes `useSelectModel.js` (option model, selection, title, commit) with `useSelectBehavior.js` (keyboard, focus, highlight, loading).
- `model.js` — the pure option model: `normalizeOptions`, `resolveSelection`, and the public `defineOption` factory.
- `state.js` — state plumbing, imports nothing from the library. The contexts, split by how often they change: `Config` (merged props plus static handles), `Actions` (stable, identity never changes), `State` (interaction plus the derived model). Also `compactReducer`, `createStore` (values that change very often: highlight, chip; only subscribers re-render), `useStableActions`, `useShallowStable`, `useDeepStable`, `deepEqual`.
- `motion.jsx` — the animation system. `Collapse` is the one primitive (Web Animations API): the whole box (size, padding, border, margins) on one axis, optional fade, reversible mid-way, any tag via `as`, no permanent CSS. `Presence` keeps leaving children mounted until their `Collapse` finishes exiting (it replaces `TransitionGroup`). `PresenceContext` is private to the file. This file stays **the select's own copy**: the owner's separate shared mini-library (`@l1nway/collapse`, its own repo; a dependency of the demo only) is never a dependency of the select. Do not import it and do not extract `motion.jsx` into a package.
- `utils.jsx` — leaf helpers: default `icons`, `renderIcon`, `optionDomId` (collision-free DOM ids), `flag` (valueless `data-*` flag), `withClass`, `dots` (the shared loading-dots element), `warnOnce` (dev-only, one warning per key), `stopEvent`, `followHeight` (the root height animation), `reducedMotion` / `watchMotion`.
- `dropdown.jsx` — the portal panel with the listbox, the side flip, and the footer: the `Footer` plugin slot or the core `StatusRow` (error / loading row, also used by `paging`). `Select` renders it next to `Trigger`.
- `dropdownPosition.js` — `useDropdownPosition`, used only by `dropdown.jsx`: closed-state direction, placement in document coordinates, following the trigger, hysteresis, the clipped-trigger pin and fade (`--rac-visible`) (own file: a hook cannot be exported next to a component).
- `optionList.jsx` — `OptionList`, `OptionItem`, `GroupHeader`.
- `trigger.jsx` — `Trigger` (the combobox root, clear button, arrow), `Value` (`.rac-value`: the `chips` slot in multiple mode, otherwise a `Title` or the `Picks`; owns the root height memo and keeps the old slot during the plugin switch morph, doc-key `plugin-morph`), `Title` (the title Presence, also used by the chips plugin) and `FormField` (the hidden inputs of `name` / `required`).
- `liveRegion.jsx` — `LiveRegion`: the hidden polite region (client only) that diffs the state and announces removals, clearing, multiple picks, loaded pages and the error; also the error text for `aria-describedby`.
- **The `chips` plugin** (`chip.jsx`, `useChipLayout.js`, `chipGeometry.js`, `chipMotion.js`, `chip.css`; the core never imports them):
- `chip.jsx` — exports `chips`. `ChipsValue` (the plugin's `Value` slot: the whole `.rac-value` with `Snapshot`, `Title`, the chip `Presence` and the delete-button probe), the chip keys (`rekey`, `useChipKeys`), `Chip` (Collapse and row break) around `SelectedItem` (hover, swipe, long press, delete button). Imports `chip.css`.
- `useChipLayout.js` — the chip layout hook: chip rows, the row hold, the inline delete reserve (resting breaks, delete button size, the button group), the chip store (hover, swipe, hold), and when the root height animates.
- `chip.css` — the chip rules of both layers and `rac-shake`.
- **The `paging` plugin**: `paging.jsx` — exports `paging`: `request` (the load call with its lock), `row` (the "Load more" record), `PagingFooter` (the `Footer` slot: loading-more row, infinite scroll, load-ahead).
- `chipGeometry.js` — the pure DOM layout helpers of that hook: row grouping, the ghost measurement and breaks, `freeze`, `snapRows`.
- `chipMotion.js` — the pure DOM animation helpers of that hook: `isBusy`, the snapshot, FLIP, the chip resize and plugin morph, the delete-mode `shift` (imports `slotsOf` from `chipGeometry.js`).
- Detailed rationale lives in `src/README.md`, one `##` section per doc-key.
- `FEATURES.md` (package root, next to this file) — the catalogue of the library's distinctive features and the full props reference ("Props"), the source for the demo page.
- Sandbox (`apps/sandbox/src/`, local only, not in git): `App.jsx` (the props playground: controls, the Select, the event log), `playground.js` (control schema, `INITIAL`, `toProps`), `demoData.jsx` (data sets and the fake paged API), `scenarios.jsx` + `formScenarios.jsx` + `a11yScenarios.jsx` + `syncScenarios.jsx` (the `#stress` tab: one card per BUGS.md bug or behaviour to check visually).
- `STYLES.md` (package root) — every class, state attribute, variable and keyframe, with recipes and the rename table; the source for the demo page's styling section.
- `BUGS.md` (package root) — library bugs found from the demo or elsewhere (cross-workspace rule 1), with the Done history.

## Plugins & tree-shaking

- The package is **a core plus plugins**, all re-exported from `index.js`. A plugin is a plain object exported by its own module (`export const chips = {...}`), next to its slot component; `eslint.config.js` allows the plugin names (`allowExportNames`). `index.js` stays pure re-exports (webpack keeps a re-exporting module's own code, and with it every plugin). The consumer passes the plugin through `plugins={[...]}`. Never a registration call at import time.
- **One-way imports.** A plugin may import from the core. **The core never imports a plugin file**; ESLint enforces it (`no-restricted-imports` in `eslint.config.js`). A new plugin adds its files to both lists there.
- **A plugin enters the core only through component slots** (`<ext.Slot/>`, any hooks inside) **or pure functions** (`ext.fn(...)` called inside a core hook or handler). **Never a hook called from a core hook**: the plugin list may change between renders.
- A seam is added only when a plugin needs it. The plugin object's fields are internal (may change in any minor); public are `plugins` and the plugin exports.
- Every module-level call carries `/* @__PURE__ */` (`memo`, `createContext`, …). Nothing runs at module scope apart from pure definitions.
- A plugin's CSS lives in its own file, imported by the plugin module, opening with `@layer rac.base, rac.theme;`. Never share a selector list between core and plugin rules. The core CSS is imported by `select.jsx`, never by `index.js` (a re-export-only module loses its CSS imports in Rollup / rolldown / webpack).
- Measure, do not estimate: a change to a plugin boundary re-runs the bundle harness (core / per plugin / all, with marker checks for strings unique to each plugin).
- Future features (virtual list, search, sortable chips, motion presets) are written as plugins from their first line.

## Features catalogue

- Every distinctive feature (a reason to pick this Select: SSR, the portal panel, ARIA, zero-dependency animations, fine-grained re-renders, …) has an entry in [FEATURES.md](FEATURES.md): what the user gets, how it is implemented (files, doc-keys), its limits, and how to show it on the demo page.
- A change that adds, changes or removes such a feature updates its entry in the same edit, like a README section. Only claim what the code does now; a limitation is written down, not hidden.

## Library constraints

- JavaScript only (`.js`/`.jsx`). Public types live in the package's `index.d.ts`; a public API change updates it and the root `README.md` in the same edit, with a changeset (see Releases).
- **No new dependencies.** Runtime peers are only `react` and `react-dom`. Animations use the in-house `Collapse` and `Presence`; never add an animation library. The sandbox (`apps/sandbox/src/App.jsx`) may use `lucide-react` and `react-live` for demos only; `src/` must never import them.
- Target **React 19.2+**. `useEffectEvent`, `useId`, `useInsertionEffect` and `useSyncExternalStore` are allowed.
- SSR-safe: touch `window`, `document` or layout only inside effects and handlers, never at module scope or during render.
- `value` and `open` are controlled when passed: derive from them on every render. Internal state exists only in uncontrolled mode.
- Every prop is listed in the FEATURES.md "Props" section and has a control in the `apps/sandbox/src/App.jsx` playground (`apps/sandbox/src/playground.js`). A prop added, renamed or removed updates both in the same edit; a rename also goes into `RENAMED` in `select.jsx`.
- A new prop goes into `DEFAULT_PROPS` with its default. Decide whether it belongs in `MODEL_KEYS` (the model consumes it, or it changes often) or in config (UI reads it).
- Styles live in `base.css` (`@layer rac.base`) and `theme.css` (`@layer rac.theme`). Every class is prefixed `rac-` and kept short (`rac-chip`, not `rac-multiple-selected-option`). Customization goes through classes — no inline styles for anything a consumer may want to override.
- The library sells the technical solution of the select; the look is the consumer's choice. Base holds only what the Select needs to work; the theme stays minimal and neutral, with as few hardcoded values as possible, and colors derive from the tokens (`--rac-fg`, `--rac-bg`, …). Themes or presets are a separate, later topic.
- The `duration` and `easing` props drive every animation: Collapse, FLIP and height animations through the config, CSS transitions through `--rac-duration` / `--rac-ease`. Never hardcode a duration or an easing for a transition.
- States are attributes, never modifier classes: an exact ARIA attribute where one exists (`aria-expanded`, `aria-selected`, `aria-busy`), otherwise a valueless `data-*` flag via `flag()`.
- A variable only for a value shared by several rules, read by JS, or fed from a prop. A single-use value is a plain property.
- Every class, state attribute, variable or keyframe added, renamed or removed updates [STYLES.md](STYLES.md) in the same edit; a rename also updates the root `README.md` (Styling) in the same edit.
- The touch delete mode (long-press a chip) is a real feature. Keep it working.

## Code style

- As short, compact and declarative as possible. No layers, wrappers or abstractions that do not pay for themselves.
- Match the existing format: 4-space indent, no semicolons, single quotes (in JSX attributes too), `<Tag/>` with no space before `/>`.
- No spaces inside braces: `{variable}`, `{a, b}`, `import {x} from`. Never `{ variable }`.
- No ladders: keep props, params and destructuring on one line while it stays readable.

```jsx
export default function OptionItem({option, index, selected, onSelect, onHover}) {
```

- One-line effects stay on one line: `useEffect(() => {fetchData()}, [id])`.
- No scattered `useState` and no duplicate helpers. Search `utils.jsx` and `state.js` before writing a helper.
- Use `useLayoutEffect` for synchronous DOM or state fixes before paint (prevents flicker). Use `useEffect` for everything else.

## State

- More than 3 state fields → `useReducer(compactReducer, ...)` from `state.js`. Never re-declare a merge reducer locally.
- `dispatch({field})` / `setState({a, b})` merges a partial. Pass an updater, `setState(prev => ({list: prev.list.filter(...)}))`, only when the next value reads the previous one. That keeps callbacks free of state dependencies.
- A patch that changes nothing returns the same state, so React bails out. Keep it that way.
- Validate before dispatch, never inside the reducer. The reducer stays synchronous; async code dispatches from effects or handlers.
- State holds what the user picked (ids, flags), never a copy of options or a constant. Catalogues are read at render time.

## Option data integrity

The normalizer is one of the library's strongest points: user data, in whatever shape it arrives, is never broken.

- Every normalized option has a unique `id`, and selection works by that id, never by value alone. Duplicates (`1, 1, 1`, `true, true`, equal strings or objects, repeated JSX `id`s) are separate options: a click selects and unchecks exactly the clicked one.
- `picked` (the committed option ids) is kept in both modes and passed to `resolveSelection`; it only breaks ties between equal candidates, `value` stays the source of truth. Every commit path passes its ids.
- Value matching never throws and never matches a record without `original` (group headers, load-more row, placeholders). `NaN` equals `NaN`; JSON comparison goes through the non-throwing `toJSON`.
- Any change to `normalizeOptions` or `resolveSelection` is checked against the duplicate cases in the first Select of `apps/sandbox/src/App.jsx` (select the last duplicate first, then uncheck the first one). Doc-key `selection-identity`.
- High-frequency values (hover highlight, measurements) go into a `createStore` with per-subscriber reads, not React state.

## Re-renders

- Hooks return stable references from the start: functions via `useStableActions` or `useCallback`, objects via `useMemo`, and the returned object itself memoized. Refs, `dispatch` and setters are already stable — leave them out of deps.
- A memoized hook built on an unstable one is unstable. Check the whole chain.
- Inline literals from the consumer (`options={[...]}`, `style={{...}}`) are new every render. Stabilize by value (`useShallowStable`/`useDeepStable`), not by identity.
- A component rendered per option or per chip is wrapped in `memo`. Its props are primitives or stable callbacks that take the item's id as an argument; no closures created inside `.map()`.
- A prop read only once (for example, a stagger index) must stop changing once it is no longer read.
- Read the narrowest context that is enough. Never put fast-changing values into `Config` or `Actions`.
- Every `setTimeout`/`setInterval`/listener is stored and cleaned on unmount and before re-arming.

## Files

- Hard limit: 200 lines per file (210 tolerated, never more). Past that, split.
- No half-empty files: a file of ~20–70 lines exists only with a real reason (the package entry `index.js`, breaking an import cycle). Otherwise merge it into the cohesive neighbour; keep the file count low.
- Keep helpers, constants and sub-components in the file of their only consumer.
- Any file-structure proposal lists the approximate line count of every resulting file.
- No barrel files except the package entry `index.js`. Relative imports only.

## Comments & docs

The package ships only `dist`, `index.d.ts` and `README.md` (`"files"` whitelist), so `src/**/README.md` never reaches npm. esbuild strips comments from `dist`, so this rule is about clean source and fast lookup, not bundle size.

- **Allowed in code:** doc-keys `// [DOC: kebab-key]` (in CSS: `/* [DOC: kebab-key] */`), tags of at most 5 lowercase English words that name a line or group without explaining it (`// stale guard`, `// portal case`), and the bundler directive `/* @__PURE__ */`.
- **Not allowed in code:** any explanation of *why*, invariants, bug notes, history, JSDoc, commented-out code. These go into `src/README.md` under a `## Kebab Key` heading that matches the doc-key.
- Existing longer comments are migrated when their file is touched in an iteration, not in a separate sweep.
- Doc sections are short and written for a reader who has not seen the code for weeks: what, invariant, why, gotchas.
- Keep it in sync: a change to behavior, structure or the API updates its README section and doc-keys in the same edit. A stale section found anywhere is fixed on sight. Pure renames and style edits need no doc update.
- No README for self-explanatory files (icons, tiny utils, CSS without tricks).

## Accessibility & native attributes

For each element, decide its role, then set every fitting native attribute explicitly:

- Trigger: `role='combobox'`, `aria-expanded`, `aria-controls`, `aria-haspopup='listbox'`, `aria-disabled`, `aria-activedescendant`, `tabIndex`.
- List: `role='listbox'` with `aria-multiselectable` when `multiple`. Items: `role='option'` with `aria-selected` and `aria-disabled`. Groups: `role='group'` + `aria-labelledby`.
- Buttons are `<button type='button'>` or carry `role='button'`, `tabIndex` and an `aria-label`. Decorative icons get `aria-hidden`.
- Keyboard parity: nothing is reachable only by mouse or only by touch.

## Layout stability

- The trigger and the list keep one size across placeholder, value, chips, loading, empty and error states. Size comes from shared CSS values, not from content that appears later.
- Animations never shift surrounding layout unexpectedly. Measure in `useLayoutEffect`, before paint.

## Context & token policy

- Never read `node_modules/`, `dist/` or lock files.
- Read only the files the task needs, and do not dump whole files into replies.
- Refactor anti-patterns carefully: functionality first, then style. An easy clear fix is made. A large one is proposed first.
