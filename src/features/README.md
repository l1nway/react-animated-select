# Features folder notes

## Infinite Loading

Reference section of the semantic table (`src/components/README.md`: Semantic table, Props table, rac-tick). Edits the infinite-loading props live and shows a "loaded" toast after a simulated request.

**Files**
- `loading.jsx` + `loading.css` (`.rac-loading`, all `.rac-loaded-*`). The table is the shared `Table` with `rows`; no table styles live here.
- Inside `loading.jsx`: `props` (row data), `Loaded` (the "Successfully loaded / Want delete?" button, owns its hover state; the text and icon pair is chosen once and keyed, `data-del` adds the extra left padding). `Select` gets `arrowIcons` and a memoized `texts`.

**Invariants**
- State keys equal the prop paths (`texts.loadMore`), so `Table` reads `state[prop]` directly. Numbers are edited as strings and converted with `Number()` at the Select.
- `trigger` returns a Promise resolved by a stored 2 s timer (cleared on unmount and before re-arming).

## Component States

Toggles the Select's state props and edits its texts live. Same layout as Loading: `Table` with `rows` (`id='states'`), then the Select.

**Files**
- `states.jsx` + `states.css` (only `.rac-states-props {gap: 0}`). `.rac-states` (section layout, used by many sections) stays in `rac.css`.

**Contract and invariants**
- Rows: `options` (array), `disabled`, `loading`, `error` (boolean, `Tick`), `texts.empty`, `texts.disabled`, `texts.loading`, `texts.error`, `placeholder`, `selectedText` (string, `kind: 'edit'`). The booleans are `kind: 'tick'`. Defaults follow `../src/select.jsx`; descriptions follow "State Semantics" in `../src/README.md`.
- `options` is a demo toggle shown as an array prop: the state is a boolean, the row's `show` prints `[…]` / `[]`; off passes `undefined` (library default `[]`, same behaviour).
- State keys equal the prop paths, so `texts` is memoized from the four `texts.*` keys.
- `selectedText || undefined`: an empty string must turn the feature off.
- `gap: 0`: the table's own `margin-bottom: 1em` would add to the `.rac-states` flex gap (2em above the Select instead of Loading's 1em).

## Multiple and Grouping props

Both sections keep their own text (a feature list, code examples) and show their boolean props in a mini `Table` (`rows`, no `icon`, no `desc`) (sr-only caption 'Multiple props' / 'Grouping props').

**Files**
- `multiple.jsx` + `multiple.css` (feature list `.rac-multiple-*`), `grouping.jsx` + `grouping.css` (`Track` of four code cards `.rac-group-card` / `.rac-group-code`, `.rac-grouping-tag` / `-prop` colours).
- Multiple: `Heading` without description, then the feature list, `Table` (`deleteAlways`, `deleteInline` ticks and a `sortable` row of `kind: 'soon'`: the shared built-in `soon` cell of `Table` renders a "Soon" label with a Hammer in the Tick slot, see `src/components/README.md`, Props table; switch it to `tick` when the prop ships), the Select (`--rac-row: 2.5rem` is the library variable on purpose). State is one `merge` reducer.
- Grouping: `Heading` with description, the Select, `Table` (`childrenFirst`, `groupsClosed`), the `Track` of code cards (flat array, group objects, `OptGroup`, `Option group`). Groups merge by name, so the description recommends unique ids. The `.rac-group-card` override is `.rac-track-card.rac-group-card` (0,2,0): stretched content, 20em basis, `min-width: 0` so a long code line scrolls inside the card instead of widening it.

**Traps**
- `.rac-grouping > .rac-table-scroll {margin-bottom: 0}` keeps the old 1em gap after the table (same double-margin issue as States).
- `deleteInline` and `deleteAlways` combine; neither overrides the other.

## Safety

`safety.jsx` + `useSafety.jsx` (state, presets, `parse`/`read`, the editor chips) + `safety.css` (all `.rac-safety-*`).

**Settings row** (`.rac-safety-settings`): layout only, no border, padding or hover (removed on purpose). Two controls in one flex row, `justify-content: space-between`, `flex-wrap: wrap`. No media query: an item's flex basis is its max-content width, so the row wraps into a column as soon as both do not fit, before any text inside wraps. `space-between`, not `space-evenly`: a wrapped line with one item stays at the start edge instead of being centred.
- `label.rac-safety-flag` (`position: relative`, the `Tick` input covers it and carries the cursor) > `Tick` + one `span` (name and description in one inline box, so they wrap together as text). No `h4`: a heading is not allowed inside a `label`.
- `Segmented` (radio mode, `id='safety-preset'`, `label='Option set'` as its accessible name; no visible caption, the item texts say what it switches). `PRESETS` items are `{text, value}`: `broken values` → `shapes`, `duplicates`. The value keys are internal (state, chip keys `${preset}-${i}`); rename only the text. `onPick` is `load` from `useSafety` directly (stable, ignores the second `name` arg).
- `.rac-safety-name`: the prop-name colour `rgb(156, 220, 254)`.

## Safety list

The editable list of the demo's raw options is a second library `Select` used only for its chips (dogfooding: Chip Hold, FLIP, Chip Keys, Backspace / long-press delete for free). It replaced a framer list with its own `ResizeObserver` width and height measuring; do not bring that back.

**Contract**
- `<Select className='rac-safety-list' open={false} multiple deleteAlways deleteInline valueAsOption icons={LIST_ICONS} texts={LIST_TEXTS} value={keys} onChange={prune}>{chips}</Select>` inside `<SlideDown visibility={list.length > 0}>`.
- `open={false}` without `onOpenChange`: controlled closed, every open request (click, focus, keys, typeahead) is dropped. `LIST_ICONS`: `arrow: false` (no arrow), `remove` = lucide `Trash` element (`.rac-safety-delete`), `clear` = `X` element (`.rac-safety-x`, "Remove all options" via `texts.clear`). Module-level constants, so the Select does not re-render.
- `chips` (`useSafety`, `chip()`): one `<Option key id value={item.key} label={parse(value)} className='rac-safety-chip'>` per list entry, its child a `CodeBlock` (`.rac-safety-code`). `valueAsOption` puts that JSX and the `className` onto `.rac-chip`. `label` is required: it names the delete button (`Remove <label>`) and keeps the library from warning about a text-less option. `value` is the entry key, so the editor value is `keys` (every key) and `onChange` gets the remaining keys: `prune` keeps the entries whose key is in it. Clear sends `[]`, so the list empties.
- `deleteInline` with `deleteAlways`: the button sits inside the chip, always open. Without `deleteInline` it would overlay the end of the code.
- Empty list: `SlideDown` unmounts the editor. `SlideDown` keeps rendering the children it had while visible (frozen while leaving, `src/components/README.md`), so the Select keeps its last chip while the panel collapses (no "No options" title flashes).

**Traps**
- A code chip wider than the row (`Circular` at 390 px) overflows the chip and pushes its delete button out of the Select: library bug (`.rac-option-jsx` keeps `min-width: auto`), in `SYNC.md` ("Rich chip content overflows the chip"). Shown as is on purpose (user decision): do not add a `.rac-safety-chip > .rac-option-jsx` clip rule. `overflow: hidden` on `.rac-safety-code` stays: `.rac-code` is a scroll container and would show its scrollbar.
- `.rac-safety-chip` restyles the chip (transparent background, table-like border, no inline padding); the code padding comes from `.rac-safety-code`.
- `.rac-safety-list {cursor: default}` and no hover: the root never opens. `theme.css` tints every active trigger on hover with `.rac-select:not([aria-disabled='true']):hover` (0,3,0), so the reset is `.rac-safety-list.rac-select:not([aria-disabled='true']):hover` (0,4,0) back to `--rac-bg` for background and border. `aria-disabled` is `'false'` on an active Select, never absent, so keep the `='true'` form. ARIA stays a combobox (`SYNC.md`, "A display-only chip list still announces a combobox", with the ARIA/keyboard override idea).
- Preset switch (`load`): the list is replaced, all keys change (`shapes-*` → `duplicates-*`), so every chip leaves and every new one enters at once, and the Select briefly grows to both sets. Library bug (`SYNC.md`, "Replacing the whole value grows the trigger"). Do not share index keys between presets to hide it.
- A viewport resize (also a headless screenshot with `captureBeyondViewport`) animates the root height (library Value Height); a screenshot taken in that window shows clipped rows. Not a bug.

## Forms layout

Native Forms demo (`forms.jsx` + `forms.css`): the form card and its code side by side above 1280 px, `Demo / Code` tabs at 1280 px and below.

- Equal height: `.rac-forms-code` has `contain: size`, so the code adds no intrinsic height and the row (wide) or the shared cell (narrow) is exactly as tall as the form. Its `.rac-code` fills it (`height: 100%`) and scrolls inside. The form, not the code, sets the size; it is not fixed: the multiple Select grows (animated) with its chips and the code follows. Do not drop `contain`: without it the taller code would stretch the form.
- Tabs: `Segmented tabs` sit in the section title row (`.rac-code-title-container2`, as in Usage), `visibility: hidden` above 1280 px (not `display: none`: the tablist keeps the title row at one height whether or not it is shown). Below, both panels share `grid-area: 1 / 1`, and the inactive one is `visibility: hidden; opacity: 0` (fade 0.25 s, off under reduced motion), selected by `data-tab` on `.rac-forms-demo`. `visibility`, not `display` or unmount: the hidden form still sets the height, so switching tabs moves nothing. It also takes the hidden panel out of the tab order and the a11y tree.
- `.rac-forms-demo` is the single `role='tabpanel'` (`${id}-panel`, as `Segmented` expects); on wide screens it shows both views under the hidden tablist.
- Card: table-like `--rac-line` (`#1f293780`, `#8b5cf64d` on hover / focus-within). There are no lines between fields and the submit row; the only inner line is the `border-top` of `.rac-forms-output`. The output `min-height` reserves all five entries (plan + 4 topics): 9em wide, 11.25em at 480 px and below where the JSON values wrap (measured 116 px / 146 px of content). A multiple Select sends one field per value, so `FormData` lists every topic as its own entry, like a native `<select multiple>`.
- Output typing: each `.rac-forms-entry` is keyed by `name=value`, so a submit replays the animation only for entries that are new or changed (an unchanged plan stays put when only the topics change); `i` is the stagger index among the new ones (300 ms apart). CSS-only `clip-path` wipe with `steps(--len)`, `--len` = value chars + 9 (the 8ch key column + 1ch gap), 25 ms per char. The entry is `width: fit-content` and the grid uses `ch`: the wipe must cover the text, not the full row, otherwise a short value (`Pro`) is revealed in the first step or two and looks like a flicker. Off under reduced motion.
- Clear button: the output sits in `.rac-forms-result` (relative) next to a `.rac-code-button` with a lucide `X` (`rac-safety-x`), so it reuses the copy button position (1em/1em), hover reveal and focus rules; it renders only while there is output and resets it to the hint after an exit animation: `data-leaving` on the output plays `rac-forms-erase` on every entry, and `onAnimationEnd` then drops the entries from the DOM (reduced motion clears at once). The hint fades in (`rac-forms-fade`). While new entries are typing, `busy` state (timer from the longest delay + typing time) sets `disabled` on Submit (`.rac-button`, see Button in `src/components/README.md`); the `seen` ref holds the shown entry ids.

## Hotkeys table

Keyboard shortcut list of the a11y section in `a11y.jsx`; styles in `a11y.css` (`.rac-a11y-keys` plus all other `.rac-a11y*` rules).

**Contract**
- Module-level `hotkeys` (`[keyJSX, text]`, text doubles as row key) and `columns` (`[Icon, label]`). `keys` is a module-level element, rendered full width between the card track and the lone demo Select (`numbered(20)` from `helpers.jsx`, no groups, `multiple`, `arrowIcons`, no visible label: named by `aria-label='Keyboard demo'`; 20 options so `PgDn` has something to jump over). The Keyboard Navigation card text points at that Select ("under the shortcut table") and names the keys it can show (arrows, PgDn/PgUp, Enter, Backspace): keep it in sync if the order or the options change.
- `<Table id='a11y-keys' title='Keyboard shortcuts' columns region={false} className='rac-a11y-keys'>`: sr-only caption, visible header, `children` rows of `th scope='row'` (one or two `<kbd>`) + `td` (action). `region={false}`: no scroll wrapper.

**Look**
- Shell from `section.css` (`.rac-table`): separate borders, lines on cells, `--rac-line` recoloured on `table:hover` (the only hover effect), header cell colours, `--rac-table-row` (3.2em) as the minimum cell height.
- `a11y.css` overrides only with `.rac-table.rac-a11y-keys …` (specificity (0,2,x), so the chunk load order does not matter): `width: 100%`, margin, cell padding `0.55em 1em` (thead too), `tbody td` back to `white-space: normal` (the shell makes plain cells `nowrap`). Nothing else: square corners and the shared `tbody` background, like every table (the rounded corner cells were removed to unify the look; do not bring them back).
- No row hover background and no `kbd` recolour (removed: one hover approach for all tables).

**Invariants and traps**
- Single column, on purpose: the old 2-column `dl` grid left the 9th card alone on the last row. Rejected: full-width last card (still lopsided), logical groups (5/2/2, reorders keys).
- Key column is `width: 1%` + `white-space: nowrap`: it hugs the longest key. Do not set a fixed width. The keys never wrap, at any width (a stacked pair was rejected by the user): only the action text wraps. `kbd` is `font-size: 1em` (was 0.85em, too small), same rule for the `kbd` in the card texts.
- No scroll region: action text wraps, the table never needs more than the container. If a wide column is ever added, drop `region={false}`.
- Reduced motion is handled by the global rule in `rac.css`.

## A11y track

Moved to `src/components/README.md` ("Track"). `a11y.jsx` renders `<Track label>` with one `<Card {...item}/>` per feature; `grouping.jsx` reuses it for the four grouping code cards (`.rac-group-card`).
