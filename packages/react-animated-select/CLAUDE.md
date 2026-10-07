# react-animated-select â€” library

@~/projects/claude-rules/core.md
@~/projects/claude-rules/react.md
@~/projects/claude-rules/web.md
@~/projects/claude-rules/web-platforms.md
@~/projects/claude-rules/library.md


The repo root `CLAUDE.md` has the map, the commands, the releases (changesets) and the links between workspaces; this file adds the library.

## Project

- `react-animated-select` is an npm library: one deeply customizable `<Select/>` with `<Option/>` and `<OptGroup/>` â€” single/multiple choice, groups, JSX or array options, async loading, chips, animations, keyboard and touch support.
- This folder is the published package, `packages/react-animated-select` of the monorepo. Library source is `src/`, edited directly. The package files next to it (`index.d.ts`, `package.json`, `vite.config.js`, `eslint.config.js`) follow the contract rules of the root `CLAUDE.md`.
- The local sandbox `apps/sandbox` (gitignored; `npm run sandbox`, `http://localhost:5174/`) imports the library as `react-animated-select`, aliased to `src/index.js`, and demos it live (animations, states, keyboard, custom styles, performance) without `npm link`.
- Since 0.8 the package is a core plus tree-shakable plugins, all imported from the package root (`import {Select, chips} from 'react-animated-select'`, `<Select plugins={[chips]}/>`). See "Plugins & tree-shaking".
- Never edit the backend's knowledge files or prompts: queue changes in `apps/backend/BUGS.md` (root `CLAUDE.md`, "Model roles").

## Workflow and status

- Verify after each change, from the repo root: `npm run lint -w packages/react-animated-select` and `npm run build -w packages/react-animated-select`, then check the relevant demo in `apps/sandbox/src/App.jsx` (`npm run sandbox`).
- Every new feature or prop gets a demo case in `apps/sandbox/src/App.jsx` (local), and reaches the demo site through link rule 2 of the root `CLAUDE.md`.
- File reorganization is in progress: flat `src/` (no subfolders), camelCase file names, `.js` for files without JSX. The JSX-structure refactor is deferred until the owner starts it, except the trigger, done on 2026-09-30 (flat tree, `@layer rac`, state attributes, renamed classes). The styles refactor was done on 2026-09-30 (`base.css` / `theme.css`, tokens). The title and chip ellipsis and the content-sized trigger were done on 2026-10-01 (doc-key `trigger-width`; animation frames clip the ellipsis and lift the size limits while they run). The title change animation (a slide of the width today) is due for a separate step on animations, together with keying the title by its state instead of its text: today any text change (typing a placeholder, `selectedText`, switching `texts`) replays the title animation (doc-key `value`, "Known issue"). That step reviews every animation trigger in the project: animate on a change of option or state, never on a mere text change. The chip row spacer was reworked into the row hold (doc-key `chip-hold`), and the inline delete spacer into the delete reserve on the same breaks (`delete-reserve`, `collapse-group`). Delete-mode changes (`deleteInline`, `deleteAlways`, touch delete mode) hold the rows and animate the chip widths since 2026-10-04 (doc-key `delete-mode`).
- Tree-shaking was done on 2026-10-04: the `chips` and `paging` plugins, version 0.8.0 (README Plugins, Paging; FEATURES "Tree-shakable plugins"; the package-side build changes shipped in 0.8.1, see [BUGS.md](BUGS.md) "Carried over in the monorepo migration"). Measurement harnesses live in the scratchpad only: rebuild them from README Plugins when needed (esbuild for size, rolldown-vite / webpack consumers for CSS drops, Playwright for runtime).
- Tests (asked on 2026-10-04, not started): full behavioural coverage, run by GitHub on every push, npm publishing blocked unless they pass. The handoff plan is the temporary [TESTING.md](../../TESTING.md) at the repo root.
- Next library edits (agreed on 2026-10-01, not started): the animation rework (a `motion` prop by role), chip reordering by drag with haptics, the virtualized option list, and search on top of it. Plans, decisions and open questions are in the FEATURES.md "Planned" section. Suggested order: virtualization, search, animations, drag. Each step starts with an analysis shown to the owner.

## Map

- `index.js` â€” the package entry, pure re-exports only: `Select`, `Option`, `OptGroup`, `defineOption`, and the plugin objects `chips`, `paging`. No CSS and no code of its own (README Plugins, Styles Layer).
- `base.css` â€” `@layer rac.base`: only what the Select needs to work (layout, chip mechanics, panel scrolling, state motion, cursors). `theme.css` â€” `@layer rac.theme`: the neutral default look and the tokens.
- `select.jsx` â€” imports `base.css` and `theme.css` (it is the one module every consumer uses). Every public component: `Select`, `Option`, `OptGroup`. `DEFAULT_PROPS` is **the single declaration of the public API**. `MODEL_KEYS` lists the props kept out of the config context. `collectOptions` reads `<Option/>`/`<OptGroup/>` from `children` during render; they are data markers and render `null`.
- `useSelect.js` â€” owns the Select's reducer, merges the plugins (`usePlugins` â†’ `ext`), and composes `useSelectModel.js` (option model, selection, title, commit) with `useSelectBehavior.js` (keyboard, focus, highlight, loading).
- `model.js` â€” the pure option model: `normalizeOptions`, `resolveSelection`, and the public `defineOption` factory.
- `state.js` â€” state plumbing, imports nothing from the library. The contexts, split by how often they change: `Config` (merged props plus static handles), `Actions` (stable, identity never changes), `State` (interaction plus the derived model). Also `compactReducer` (the library's merge reducer), `createStore` (values that change very often: highlight, chip; only subscribers re-render), `useStableActions`, `useShallowStable`, `useDeepStable`, `deepEqual`.
- `motion.jsx` â€” the animation system. `Collapse` is the one primitive (Web Animations API): the whole box (size, padding, border, margins) on one axis, optional fade, reversible mid-way, any tag via `as`, no permanent CSS. `Presence` keeps leaving children mounted until their `Collapse` finishes exiting (it replaces `TransitionGroup`). `PresenceContext` is private to the file. This file stays **the select's own copy**: the owner's separate shared mini-library (`@l1nway/collapse`, its own repo; a dependency of the demo only) is never a dependency of the select. Do not import it and do not extract `motion.jsx` into a package.
- `utils.jsx` â€” leaf helpers: default `icons`, `renderIcon`, `optionDomId` (collision-free DOM ids), `flag` (valueless `data-*` flag), `withClass`, `dots` (the shared loading-dots element), `warnOnce` (dev-only, one warning per key), `stopEvent`, `followHeight` (the root height animation), `reducedMotion` / `watchMotion`.
- `dropdown.jsx` â€” the portal panel with the listbox, the side flip, and the footer: the `Footer` plugin slot or the core `StatusRow` (error / loading row, also used by `paging`). `Select` renders it next to `Trigger`.
- `dropdownPosition.js` â€” `useDropdownPosition`, used only by `dropdown.jsx`: closed-state direction, placement in document coordinates, following the trigger, hysteresis, the clipped-trigger pin and fade (`--rac-visible`) (own file: a hook cannot be exported next to a component).
- `optionList.jsx` â€” `OptionList`, `OptionItem`, `GroupHeader`.
- `trigger.jsx` â€” `Trigger` (the combobox root, clear button, arrow), `Value` (`.rac-value`: the `chips` slot in multiple mode, otherwise a `Title` or the `Picks`; owns the root height memo and keeps the old slot during the plugin switch morph, doc-key `plugin-morph`), `Title` (the title Presence, also used by the chips plugin) and `FormField` (the hidden inputs of `name` / `required`).
- `liveRegion.jsx` â€” `LiveRegion`: the hidden polite region (client only) that diffs the state and announces removals, clearing, multiple picks, loaded pages and the error; also the error text for `aria-describedby`.
- **The `chips` plugin** (`chip.jsx`, `useChipLayout.js`, `chipGeometry.js`, `chipMotion.js`, `chip.css`; the core never imports them):
  - `chip.jsx` â€” exports `chips`. `ChipsValue` (the plugin's `Value` slot: the whole `.rac-value` with `Snapshot`, `Title`, the chip `Presence` and the delete-button probe), the chip keys (`rekey`, `useChipKeys`), `Chip` (Collapse and row break) around `SelectedItem` (hover, swipe, long press, delete button). Imports `chip.css`.
  - `useChipLayout.js` â€” the chip layout hook: chip rows, the row hold, the inline delete reserve (resting breaks, delete button size, the button group), the chip store (hover, swipe, hold), and when the root height animates.
  - `chipGeometry.js` â€” the pure DOM layout helpers of that hook: row grouping, the ghost measurement and breaks, `freeze`, `snapRows`.
  - `chipMotion.js` â€” the pure DOM animation helpers of that hook: `isBusy`, the snapshot, FLIP, the chip resize and plugin morph, the delete-mode `shift` (imports `slotsOf` from `chipGeometry.js`).
  - `chip.css` â€” the chip rules of both layers and `rac-shake`.
- **The `paging` plugin**: `paging.jsx` â€” exports `paging`: `request` (the load call with its lock), `row` (the "Load more" record), `PagingFooter` (the `Footer` slot: loading-more row, infinite scroll, load-ahead).
- Detailed rationale lives in `src/README.md`, one `##` section per doc-key. Existing longer comments are migrated when their file is touched, not in a separate sweep.
- `FEATURES.md` (package root) â€” the catalogue of the library's distinctive features and the full props reference ("Props"), the source for the demo page.
- `STYLES.md` (package root) â€” every class, state attribute, variable and keyframe, with recipes and the rename table; the source for the demo page's styling section.
- `BUGS.md` (package root) â€” library bugs found from the demo or elsewhere, with the Done history.
- Sandbox (`apps/sandbox/src/`, local only, not in git): `App.jsx` (the props playground: controls, the Select, the event log), `playground.js` (control schema, `INITIAL`, `toProps`), `demoData.jsx` (data sets and the fake paged API), `scenarios.jsx` + `formScenarios.jsx` + `a11yScenarios.jsx` + `syncScenarios.jsx` (the `#stress` tab: one card per BUGS.md bug or behaviour to check visually).

## Plugins & tree-shaking

- The package is **a core plus plugins**, all re-exported from `index.js`. A plugin is a plain object exported by its own module (`export const chips = {...}`), next to its slot component; `eslint.config.js` allows the plugin names (`allowExportNames`). `index.js` stays pure re-exports (webpack keeps a re-exporting module's own code, and with it every plugin). The consumer passes the plugin through `plugins={[...]}`. Never a registration call at import time.
- **One-way imports.** A plugin may import from the core. **The core never imports a plugin file**; ESLint enforces it (`no-restricted-imports` in `eslint.config.js`). A new plugin adds its files to both lists there.
- **A plugin enters the core only through component slots** (`<ext.Slot/>`, any hooks inside) **or pure functions** (`ext.fn(...)` called inside a core hook or handler). **Never a hook called from a core hook**: the plugin list may change between renders.
- A seam is added only when a plugin needs it. The plugin object's fields are internal (may change in any minor); public are `plugins` and the plugin exports.
- A plugin's CSS lives in its own file, imported by the plugin module, opening with `@layer rac.base, rac.theme;`. Never share a selector list between core and plugin rules. The core CSS is imported by `select.jsx`, never by `index.js` (a re-export-only module loses its CSS imports in Rollup / rolldown / webpack).
- A change to a plugin boundary re-runs the bundle harness (core / per plugin / all, with marker checks for strings unique to each plugin).
- Future features (virtual list, search, sortable chips, motion presets) are written as plugins from their first line.

## Features catalogue

- Every distinctive feature (a reason to pick this Select: SSR, the portal panel, ARIA, zero-dependency animations, fine-grained re-renders, â€¦) has an entry in [FEATURES.md](FEATURES.md): what the user gets, how it is implemented (files, doc-keys), its limits, and how to show it on the demo page.
- A change that adds, changes or removes such a feature updates its entry in the same edit, like a README section. Only claim what the code does now; a limitation is written down, not hidden.

## Library constraints

- JavaScript only (`.js`/`.jsx`). Public types live in the package's `index.d.ts`; a public API change updates it and the root `README.md` in the same edit, with a changeset.
- Runtime peers are only `react` and `react-dom`. Animations use the in-house `Collapse` and `Presence`; never add an animation library. The sandbox may use `lucide-react` and `react-live` for demos only; `src/` must never import them.
- Every prop is listed in the FEATURES.md "Props" section and has a control in the sandbox playground (`apps/sandbox/src/playground.js`). A prop added, renamed or removed updates both in the same edit; a rename also goes into `RENAMED` in `select.jsx`.
- A new prop goes into `DEFAULT_PROPS` with its default. Decide whether it belongs in `MODEL_KEYS` (the model consumes it, or it changes often) or in config (UI reads it).
- Styles live in `base.css` (`@layer rac.base`) and `theme.css` (`@layer rac.theme`). Every class is prefixed `rac-` and kept short (`rac-chip`, not `rac-multiple-selected-option`).
- The library sells the technical solution of the select; the look is the consumer's choice. Base holds only what the Select needs to work; the theme stays minimal and neutral, with as few hardcoded values as possible, and colors derive from the tokens (`--rac-fg`, `--rac-bg`, â€¦). Themes or presets are a separate, later topic.
- The `duration` and `easing` props drive every animation: Collapse, FLIP and height animations through the config, CSS transitions through `--rac-duration` / `--rac-ease`.
- Valueless `data-*` state flags go through `flag()`.
- Every class, state attribute, variable or keyframe added, renamed or removed updates [STYLES.md](STYLES.md) in the same edit; a rename also updates the root `README.md` (Styling) in the same edit.
- The touch delete mode (long-press a chip) is a real feature. Keep it working.

## State and re-renders

- The merge reducer is `compactReducer` from `state.js`; search `utils.jsx` and `state.js` before writing a helper.
- Stable functions come from `useStableActions` (or `useCallback`). Inline literals from the consumer (`options={[...]}`, `style={{...}}`) are stabilized by value with `useShallowStable` / `useDeepStable`, not by identity.
- High-frequency values (hover highlight, measurements) go into a `createStore` with per-subscriber reads.
- Never put fast-changing values into `Config` or `Actions`.

## Option data integrity

The normalizer is one of the library's strongest points: user data, in whatever shape it arrives, is never broken.

- Every normalized option has a unique `id`, and selection works by that id, never by value alone. Duplicates (`1, 1, 1`, `true, true`, equal strings or objects, repeated JSX `id`s) are separate options: a click selects and unchecks exactly the clicked one.
- `picked` (the committed option ids) is kept in both modes and passed to `resolveSelection`; it only breaks ties between equal candidates, `value` stays the source of truth. Every commit path passes its ids.
- Value matching never throws and never matches a record without `original` (group headers, load-more row, placeholders). `NaN` equals `NaN`; JSON comparison goes through the non-throwing `toJSON`.
- Any change to `normalizeOptions` or `resolveSelection` is checked against the duplicate cases in the first Select of `apps/sandbox/src/App.jsx` (select the last duplicate first, then uncheck the first one). Doc-key `selection-identity`.

## Accessibility

- Trigger: `role='combobox'`, `aria-expanded`, `aria-controls`, `aria-haspopup='listbox'`, `aria-disabled`, `aria-activedescendant`, `tabIndex`.
- List: `role='listbox'` with `aria-multiselectable` when `multiple`. Items: `role='option'` with `aria-selected` and `aria-disabled`. Groups: `role='group'` + `aria-labelledby`.
- Buttons are `<button type='button'>` or carry `role='button'`, `tabIndex` and an `aria-label`. Decorative icons get `aria-hidden`.

## Layout stability

- The trigger and the list keep one size across placeholder, value, chips, loading, empty and error states.
