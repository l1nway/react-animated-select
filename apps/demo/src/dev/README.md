# Dev folder notes

## Playground holder

Stand-in for the react-live editor in `playground.jsx` while it loads (not near the viewport yet, or the `Suspense` fallback).

**Files**: `playground.jsx` (`CODE`, `holder`), `live.jsx` (the real editor, gets `code` as a prop), `.rac-live-*` and `.rac-playground*` in `playground.css` (moved from `src/rac.css`). The preview Select in `CODE` has no theme class: the site theme is global (Site theme in `src/components/README.md`). Its old twins `.rac-playground-preview` / `-options` and the later `rac-basic-*` pair are deleted.

**Invariants**
- The holder renders the same markup and classes as the live editor, with the same `CODE` text in `pre.rac-live-code` (styled like the `pre.prism-code` that react-live produces). Its height equals the real one by construction: 375 px on desktop, 494 px at 390 px (measured headless in Edge, holder and live editor equal).
- No fixed heights. The old `.rac-live-holder` had 485/587 px, a few pixels off, and Playground sits at the page bottom where the scroll is clamped, so each size change moved the SSR block above it. On the SSR route this happened below the viewport, so it was invisible there.
- `.rac-live-preview-box` has a `min-height` (`4em + 36px`) so the preview is the same size before and after the select mounts.
- If the live editor changes (padding, font, example code), change the holder with it. Check `getBoundingClientRect().height` of `.rac-live-container` before and after load at both widths.

**Same rule for other placeholders**: see Layout stability in `CLAUDE.md`.

## Debug table

Controlled / uncontrolled props of the Select, edited from outside.

**Files**: `debug.jsx` + `debug.css` (all `.rac-debug*`, moved from `src/rac.css`). `Table` with props rows (`id='debug'`, own columns Prop / Value / Description, items without `type`), `arrowIcons` from `helpers.jsx`.

**Contract**
- Rows are module-level items `{prop, kind, field?, choices?, keepFocus?, text}`. `keepMounted` is the shared animated `tick` cell. `onOpenChange` is a read-only `call` cell (the local `Call` in `debug.jsx`, passed through the `cells` prop of `Table`): `onOpenChange(true|false)`, `onOpenChange(undefined)` before the first call. The name and brackets are one span in the function colour (`--rac-tok-fn`, via `data-tone='fn'`), and only the argument is an animated `Collapse` (`axis='x'`, keyed by its text) in `none` (blue, `undefined`), `on` or `off` tone. The `open` row description states that switching it in the table does not call `onOpenChange`. The Select always gets a handler that stores the reported argument in `state.onOpenChange` and, while `open` is controlled, mirrors it into `open`. It is reset when `controlled` changes (the Select remounts closed). The cell shows only calls made by the Select itself: switching `open` in the table is an outside change, the library does not report it (like `onChange` of an input on a programmatic value), so the cell stays as it was. The `value` row edits `field: 'controlled'`. `change(field, value)` is a stable `useCallback` (it resets the value when `controlled` changes).
- Choice rows (`value`, `open`, `kind: 'choices'`, `choices: [{text, value, tone?}]`): the built-in `choices` cell of the props table, a `Segmented` radio group (`src/components/README.md`, Segmented and Props table). Native arrow keys; focus is shown by the cell outline.
- Their look lives in `debug.css` (`.rac-debug .rac-props-choices`): the switch is `position: absolute; inset: 0` inside `td.rac-props-pick` and fills the cell at any row height (62 px on desktop, 82 px at 390 px when a description wraps; `height: 100%` against the fixed `3.2em` of the `td` left 5 px gaps above and below in some browsers; the width comes from the `td::before` sizer, see Props table in `src/components/README.md`; no border, background or radius), items are plain cell text in the `.rac-table-tick` mono stack at the table font size, and only the square pill (`--rac-pill-inset: 0`) marks the active one. Item colour is `inherit`, so hover and selection do not recolour the text; an unselected item darkens on hover (`--rac-hover`, 300 ms).
- `open` choices carry tones, the same colours as the tick cells: `none` (`undefined`) blue `rgb(86, 156, 214)`, `off` red, `on` green. The tone rules come after the item rule with equal specificity (3 classes), so their order matters. Trial for a shared value-tone palette; until then the colours repeat `section.css` (`.rac-table-tick [data-tone]`) and `icons.css`.
- The `open` row (`keepFocus: true`) has `onMouseDown={prevent}`: otherwise the click takes focus, the Select asks to close on blur before the click lands.
- The Select remounts by key `String(controlled)` only: switching the value mode on a live Select is not supported, as with a React input (and warns in development). Do not add `open` to the key: a remount mounts the new Select already open and drops the old panel, so `undefined` ↔ boolean switches lose the open/close animation. The library animates those switches itself (checked on 0.7.7) and warns once in development.
- Descriptions are the shared `Text` cell (`src/components/README.md`, Two-line text): the full text in 2 lines (3 at ≤1024px), long ones widen the table and it scrolls.

## SSR timeline

Two-lane animation in `ssr.jsx`: client rendering vs server rendering on one clock. Both lanes are real `<Select/>`s with the same props, so the picture itself shows there is no mismatch.

**Contract**
- `STEPS` (`[label, ms]`) and `TOTAL` are the only timing source. `phase` advances by one `setTimeout` per step (0..3), plus `DONE` (4) at `TOTAL` when the fill ends, started when the section first becomes visible (`IntersectionObserver`). Replay resets `phase` and remounts only the Select wrappers (`key={run}` inside `Lane`) and the timeline fill. The lanes themselves keep `key={title}`: remounting a whole lane (the old `key={title + run}`) also remounted the status label, so the final → "Nothing yet" change on replay jumped instead of fading.
- Replay sits in the title row (`.rac-code-title-container2.rac-ssr-head`, wraps on phones), a `.rac-button` (Button in `src/components/README.md`). `busy = phase < DONE` (not gated by `seen`: `seen` flips in the IO effect after mount, and `initial={false}` covers only the first render, so a `seen`-gated icon always played an idle → busy swap on load; before `seen` the section is off screen anyway): `aria-disabled` (not `disabled`, which drops keyboard focus) with the click ignored, and the `RotateCcw` icon swaps to `Spinner` and back. The section is wrapped in `<Motion>` for this swap: the `dev` part has no LazyMotion above it.
- `LANES` rows are `[title, shownFrom, liveFrom, labels]`, one label per phase 0..3 (`DONE` reuses the last). Shown = the slot becomes visible (CSR: JS loaded, phase 2; SSR: HTML arrived, phase 1). Live = the Select wrapper stops being `inert` (CSR: phase 2; SSR: hydrated, phase 3).
- Cursor: `progress` on `.rac-ssr-slot` while the lane is not live, gone as soon as it is (before the timeline ends). `inert` sits on an inner wrapper, not on the slot: an inert node is skipped by hit testing, so its cursor would never show; the pointer falls through to the slot, which carries it.
- Status labels: only the current label is rendered, an `m.span` keyed by its text under `AnimatePresence` (no `mode='wait'`), with the local `fade` preset (opacity, 0.4 s linear). The outgoing and incoming spans share one grid cell (`grid-area: 1 / 1`), so they cross-fade in place. CSS cannot do this: a removed node has no exit transition. Keyed by text, so identical consecutive labels (CSR phases 2 and 3) do not re-fade. `initial={false}`: no fade on mount.
- Height: `.rac-ssr-ghost`, the lane's longest label (`longest(labels)`), sits invisible (`visibility: hidden`, `aria-hidden`) in the same cell and reserves the fullest box, so a label that wraps on a phone never moves the layout. Do not remove it in favour of `min-height`.
- Label tone comes from its phase index, not from data: before `shownFrom` `none` (red, `rgb(244, 71, 71)`, the site's `off`), before `liveFrom` `static` (lime `#a3e635`), then `live` (green `#4ade80`). An exiting span keeps its own tone while it fades.
- The slot always occupies its space (opacity and visibility only), so nothing shifts while the lanes fill in.
- `prefers-reduced-motion`: jumps straight to `DONE`, the fill is static. The label still cross-fades (opacity only, no motion).

**Honesty rules**: the select is never assembled piece by piece (React commits atomically, SSR HTML is complete on arrival), and the options panel is not drawn in the server frame (it is not part of the server HTML). The timings are illustrative; the caption says so.
