# Customization folder notes

## Icons grid

One row per key of the `icons` prop; upload or drop an image on a row to override that icon in the Select below.

**Files**
- `icons.jsx` (data `items`, `desc`, `columns`, memo `Row`, window drag listeners, the section) and `icons.css` (all `.rac-icons-*`, `.rac-file-icons`). Shared: `Table` (`src/components/README.md`, Semantic table), `popSlow`, `merge`, `arrowIcons` (`helpers.jsx`).

**Contract**
- `Table` with `id='icons'`, `icon` (Atom), `desc`, visible header Key / Description (`Tag`, `FileText`), `className='rac-icons-table'`, `data-drag` (goes to the `<table>`) while any file is dragged over the window. Rows are `children`.
- Row: `tr.rac-icons-container` > `th.rac-icons-key[scope=row][data-fill]` > `label.rac-icons-title-container` (icon, bold name span, upload / remove icon, the cover) + `Text` (description, `src/components/README.md`, Two-line text). The name is a `span`, not an `h4`: headings are not allowed inside `th`.
- `th[data-over]` is the row under the dragged file (row-local state in `Row`).
- Border (`th::after`) priority: `data-over` (purple) > `table[data-drag]` (`#8b5cf64d`) > `:hover` (purple). Keyboard focus is the shared cell outline; the cell also reveals the upload icon on `:has(:focus-visible)`.
- Files state: `useReducer(merge)` of `{name: objectURL | null}`; `setFile(name, file)` is the one stable callback for all rows. `icons` = `{...arrowIcons, ...uploaded}`. `URL.createObjectURL` runs in the callback, not in the reducer.
- The description uses `code[data-tone]` (`prop`, `tag`, `off`), coloured by `.rac-icons .rac-table-desc`.

**Hit target and traps**
- The hit area and the dashed border belong to the cell, not to the label: `th.rac-icons-key` is `position: relative`, its `::after` draws the border (`inset: 0`), and the absolute cover and `.rac-file-icons` anchor on the cell too (the label is `position: static`). Reason: a percentage `height` on the label never follows a cell stretched by the row (with `height: 1px` Chrome resolves it against 1px and `min-height` wins, so a two-line row was only partly filled). Do not go back to `height: 100%` or the `1px` trick.
- `data-over` sits on the `th` (row-local state in `Row`). Hover and the upload icon reveal use `.rac-icons-key:is(:hover, :has(:focus-visible))`; the hover reaches the `th` through the cover (the `th` itself has `pointer-events: none`).
- Under `@media (hover: none)` the upload icon is always visible (`opacity: 1`, `scale(1)`), otherwise touch users cannot tell the row is interactive.
- The label keeps `min-height: var(--rac-table-row)`, `min-width: 11em`, `padding-right: 2.5em` for the upload icon and a `2px` left offset that matches the border.
- `.rac-icons-cover` is the invisible absolute cover inside the label: `input type=file` without a file, `button` (remove, keyboard reachable) with one. Swapping them on upload loses focus.
- `.rac-icons-container *` has `pointer-events: none`; label, input and button are re-enabled, so drag events land on the label.
- The key column is `nowrap` (`.rac-icons-container`), the description wraps (`.rac-table-text` is set back to `normal`).
- The empty-icon border is `div.rac-icons-icon:empty` (an `img` would also match `:empty`).
- Object URLs of replaced uploads are never revoked: revoking would break the image's exit animation.
- `XMarkIcon` (`src/components/icons.jsx`) hardcodes `role='button' aria-label='Clear selection'`; here it sits inside an `aria-hidden` wrapper.
- History: this was a flex "table" with explicit roles, an sr-only header row and a JS width fit (`--rac-icons-fit`, rows measured in `useLayoutEffect`). All of it is gone: the real table wraps the description by `.rac-table-text`. Do not bring the flex layout back.

## Showcase

Live Select + tabbed code below it (`showcase.jsx`, `showcase.css`). Users: Content, Styling.

**Contract**
- `Showcase({id, label, tabs, active, onPick, codes, title, desc, children})`: `tabs` are `Segmented` tab items (`{id, text}`), `codes` the snippets of the active tab (one `CodeMorph` + `CopyButton` each, see Code morph in `src/components/README.md`), `children` the stage.
- Code slots are keyed by index, so each slot morphs from the previous tab's snippet to the new one. Keep the number of slots equal across the tabs of one Showcase (Styling: always JSX + CSS; Content: one). A slot that appears or disappears mounts without animation.
- Showcase owns `busy` (state): its `CodeMorph`s set it, and `Segmented disabled={busy}` locks the other tabs while the code redraws.
- Without `title`: the switcher sits above the panel (Content). With `title` (a `Title` element) the switcher moves into the header row `.rac-code-title-container2.rac-showcase-head` next to it, `desc` renders as `p.rac-heading-desc` below, and the root gets `data-head` (gap `1em`, same as the section). The header wraps (`flex-wrap`) so a 3-tab switcher drops under the title on phones.
- `.rac-showcase-stage` is `width: fit-content`: the toggles row sets the width. The Select inside is `contain: inline-size`, so its chips never widen the stage; it stretches to the stage and grows in height instead. Do not remove the containment: without it every added chip widens the box (layout jump).
- Styling presets (`PRESETS` in `reference.js`): `{id, text, props, codes}`, where `codes` is always `[jsx, css]`. `props` is spread last into the Select (it may override `placeholder`). `codes[1].text` is injected as a `<style>` on the stage.
  - `site` (As styled) shows `src/components/basic.css` itself through `import basic from '../components/basic.css?snippet'` (build-time tokenized, Snippets in `src/components/README.md`). It is the same file the site imports in `main.jsx`, so the snippet cannot drift. Do not retype those rules in `reference.js`. The theme is global (Site theme in `src/components/README.md`), so this preset passes no class: `props` is only `icons`, and the JSX snippet is `<Select icons options/>`.
  - `default`: see Bare preset. Its CSS slot is a one-line comment, so the slot never pops in or out.
  - `aurora` sets every knob (classes, variables, `style`, icons, texts, duration, easing, offset). Its live `className` / `optionsClassName` add `rac-preset` (Preset isolation); the snippet shows `aurora` only. Its panel shape (radius, outline) sits on `.rac-options`, not on `.rac-list`: the library paints the panel background there, and its `easing` overshoots, so a shape on the list alone would detach from the box for a few frames of every opening (library `STYLES.md`, `rac-list`).

## Preset isolation

The site theme (`basic.css`) is global, so without a guard it would sit under every preset: Aurora would get the site's purple panel border and 0.5rem panel corners, which a visitor who copies the Aurora snippet never has.

- `rac-preset` (`showcase.css`) goes on both the trigger and the panel of every preset except `site`: `all: revert-layer` plus `--rac-bg` / `--rac-fg` / `--rac-radius: revert-layer`. On those two elements every unlayered site rule (the theme, the global `*` reset) rolls back to the library's layers; the custom properties then inherit from `:root`, where only the library sets them.
- `all` does not cover custom properties. Every variable `basic.css` sets must be listed here too.
- Specificity is (0,1,0), the same as the theme. It wins by order (`showcase.css` is a lazy chunk, after the entry CSS) and loses to the preset's own rules: the stage `<style>` is in `body`, after every stylesheet in `head`, and Aurora's element rules are (0,2,0) anyway. `.rac-showcase-stage > .rac-select {contain: inline-size}` (0,2,0) survives.
- Descendants (`.rac-list`, options, chips) keep the site context on purpose: for Aurora the page is the site page (dark scheme, site font), as it would be the visitor's own page. Only Default also strips that (Bare preset).
- Checked headless (Edge): Aurora panel `border: 0`, Default panel `border: 0`, `color-scheme: light`; As styled panel `1px rgba(139, 92, 246, 0.3)`, radius 8px. Re-checked for Aurora 2026-10-05 (Chromium) after the panel took over the background: panel `#110d24`, radius `16px`, its own `outline`, list transparent and unrounded.

## Bare preset

The Styling "Default" preset shows the Select as it looks on a blank page, with none of the site's CSS.

- `props: {className: 'rac-preset rac-bare', optionsClassName: 'rac-preset rac-bare'}`, so both the trigger and the portal panel are marked. The snippet does not show the classes: they are demo-only isolation hooks and carry no look. `rac-preset` removes the site theme variables (Preset isolation); `rac-bare` removes everything else.
- `showcase.css`: `:is(.rac-bare, .rac-bare *)` (and their `::before`/`::after`) get `all: revert-layer`. An unlayered declaration with `revert-layer` rolls back to the previous cascade layer, so every site rule on those elements (the global `*` reset in `rac.css`: purple scrollbar, `outline: none`, `box-sizing`) goes away and the library's `@layer rac.*` values plus the browser defaults stay.
- Inherited values do not come from rules on the element. They come from the parent: the stage for the trigger, `body` for the panel. So `.rac-bare` also cuts inheritance with `color-scheme: light` (the site is `dark` through `index.html`), `font: initial` and `-webkit-font-smoothing: auto`. The result is Times New Roman, black on a light `Canvas`, which is what a page without CSS gets. Use `light`, not `normal`: `normal` follows the page's `<meta name='color-scheme'>`.
- `.rac-showcase-stage > .rac-select {contain: inline-size}` (0,2,0) beats the revert (0,1,0) on purpose: the layout rule stays and the stage does not widen with chips.
- Do not exclude `.rac-bare` inside the global `*` rule with `:not(...)` instead: it adds an ancestor walk to every element of the page on each style recalc. The revert touches only the Select.
- Checked headless (Edge): trigger and panel `Times New Roman`, `color-scheme: light`, list background `color(srgb 0.98 …)`, the library's own scrollbar colours.

## Styling tables

Collapsible reference tables (variables, classes, state attributes) under the Styling showcase.

**Files**
- `styling.jsx` (section title and description passed to `Showcase` as `title`/`desc`, see Showcase, `Reference`, one per `TABLES` entry), data `TABLES` in `reference.js` (`id`, `name`, `columns` as `[[Icon, label]]`, `element` rows `{name, value, desc, depth?}`), styles `styling.css` (all `.rac-styling-*`).

**Contract**
- Each `Reference` is `memo` and owns its open state (`useReducer(flip, false)`); the section, the Showcase and its Select never re-render on toggle.
- Disclosure: `button.rac-styling-label[aria-expanded]` always carries `aria-controls='styling-ref-<id>'`; that id sits on the `Collapse` panel (`.rac-styling-container`; Collapse forwards extra props). While closed the panel is unmounted; a missing target with `aria-expanded='false'` is accepted for the disclosure pattern.
- Panel → shared `Table` (`id='styling-<id>'`, `title` = table name as the sr-only caption, visible header from `columns`, `className='rac-styling-table'`). The button's text is not the table's name source, so its span has no id.
- Row: `th.rac-styling-title[scope=row][data-depth]` (indent: `1em` base + `1em` per depth, rules `tbody th[data-depth='N']`, specificity above the shell) · `td.rac-styling-value` (inline `style={{color}}` only when `item.value` matches the `COLOR` regex in `styling.jsx` (`#`, `color-mix(`, `rgb(`, `hsl(`, `oklch(`); other values set no style, so the browser logs no parse errors. A new colour notation must be added to that regex) · `Text`. Name and value are `nowrap`.
- Lines and hover are the shared ones; the panel has no borders of its own.

**Traps**
- Horizontal scroll lives on the table's scroll wrapper, not on the `Collapse` div. `Collapse` clips only while it animates, so the wrapper keeps its normal focus ring. The old `outline-offset: -2px` override is gone; do not bring it back.
- History: flex rows with explicit roles, lines drawn by row `::before`/`::after` and an sr-only header; replaced by the shared table.

## Animations table

The Select's animation props, edited live.

**Files**: `animations.jsx` + `animations.css` (moved from `src/rac.css`). `Table` with props rows (`id='animations'`, default columns, `cells`), `Slider`, `merge`.

**Contract**
- Module-level `props` data and `cells = {range, select}` (Props table in `src/components/README.md`): `range` → `td.rac-animations-value` > `Slider` + value, `select` → `td[data-fill]` > easing `Select`; `animateOpacity` is the shared animated `tick` cell. One stable `change(prop, value)`.
- State is `merge` and is spread into the demo Select (`{...state}`), so its keys equal the prop names. Defaults are the library's (duration 300, offset 1, animateOpacity true); easing starts at `'ease-out'` while the library default `'ease'` is also in the list.
- The easing Select is named by `aria-label`, never wrapped in a `label`: its root is a `div`, a label does not name it.
- `select` and `tick` cells carry `data-fill`; the range cell keeps the normal padding. A cell never sets `display` on its `td`: the flex box is the inner `div.rac-animations-range`.

**Traps**
- The section class is `rac-animations-section`, not `rac-animations` (the old name had legacy rules).
- `.rac-animations-select` has no border, `position: absolute; inset: 0` inside a `position: relative` cell to fill the whole `td[data-fill]` (same idea as the Icons cell hit area). Do not go back to `height: 100%`: a percentage height never follows a cell stretched by the row, so the hover stopped short (`min-height` + `border-box` did not fix it). Being out of flow, the Select never widens the Value column either (the column is sized by the range cell: 6ch number + 8em slider); the cell keeps the row height through the table's `height: var(--rac-table-row)`. Row height (sized by the table's own `--rac-table-row`, not a hardcoded value), and the table's own `tbody` background (`--rac-bg: #0e111a`, matches `.rac-table tbody` in `section.css`) so it blends into the row instead of the editable-cell background.
- Slider's own default width is `10em` (see its entry in `src/components/README.md`); Animations narrows it to `8em` in `.rac-animations-range .slider-container`.
- The `motion` row is a planned prop (`kind: 'soon'`, the shared `soon` cell with the hammer). Switch it to a real kind when the prop ships.
- What was broken before: a zero-size checkbox container with icons pinned by negative offsets, column dividers drawn by `::after` at hardcoded percentages that drifted off the columns, a Select inside a `label` (no accessible name), a focus rule for a class that did not exist.
