# Components folder notes

## Scroll restore

Puts a reload, `#hash` or `/route/` visit back at its target while the lazy parts above and below it mount and change the page height.

**Files**
- `store.js`: `boot()` (target, `restoring`, pin, 3 s guard), `readTarget`, `save`, `advance` (mount order), `liftFirst`.
- `deferred.jsx`: `Mounted` (runs after every part mount, restores and reveals), `filled`, `settled`, `lifted`, `ready`, the preload of every chunk.
- `src/rac.css`: `.rac-main[data-restoring]` is `visibility: hidden`; `.rac-section` is `display: block` (Part container box).

**Contract**
- Target is `{id, dy}`: element id and its distance from the viewport top (`20` for links, the saved value for reloads).
- `restoring` stays true until `Mounted` decides the target is in place; the page is hidden meanwhile. The 3 s guard in `boot()` reveals the page anyway.
- The pin `ResizeObserver` on `body` keeps the target in place after the reveal, until the first user input (`wheel`, `touchstart`, `keydown`, `pointerdown`).

**Invariants**
- The pin and `Mounted` compute the target position the same way: `el.getBoundingClientRect().top + scrollY - dy`. Never a sum of `offsetTop`: it is rounded to integers. Firefox at a fractional scale (125 % on Windows) snaps scroll to device pixels (0.8 CSS px), the two values disagree by a fraction, and the target flips by 1 px at every mount. That was the jitter above Playground, Debug and in Styling.
- A target near the page bottom (Playground, Author) cannot reach `dy`: the scroll is clamped. `Mounted` then counts it restored only when every part below is mounted and the first part above that crosses the top has `top < 1` (`settled`). Without it `restoring` stays true until the 3 s guard and the page is hidden for 3 s.
- Any transient height dip near the bottom clamps `scrollY` and nothing but the pin brings it back. Keep placeholders equal to the real element (see `src/dev/README.md`, Playground holder).
- Browsers without `overflow-anchor` (Safari) and every fine-pointer device: the target is revealed only after every part above it is mounted (`lifted`), and `advance` mounts parts above the target first while `restoring`. See Manual scroll anchor and Mount above first.
- On the fast path (touch with anchoring) restore relies on native anchoring after the reveal (the pin only covers the time before the first input). Its two failure modes here are Part container box and Wrapper anchor; both made the target jump by 700–1400 px on `/dev/` and `/ssr/` as soon as the visitor touched the page before the parts above had loaded.

**Traps**
- Native anchoring is not applied at `scrollTop` 0 and picks the first visible element as the anchor, which can be the header strip. The header is excluded from anchoring (`overflow-anchor: none`).
- Entrance animations start only after `data-restoring` is gone; do not start one earlier, it moves layout under the pin.
- Chrome picks the anchor once and keeps it until the scroll offset changes by something other than an anchoring adjustment. A `scrollTo` to the same value does not reselect it. So an anchor picked in a bad layout (short page, hidden page) stays bad for every later insert.
- The `rac-enter` keyframes (`[data-reveal='in']`) animate `transform`, a suppression trigger: while a block plays it, Chrome makes no anchoring adjustment for an anchor inside it. That is why the reveal uses `fade` (opacity only) while parts are still mounting; do not switch it to `in` there.
- Chrome may report a large `layout-shift` (0.72 on mobile `/ssr/`, in about half the runs) with a container part (`dev`) as the only source, an empty `previousRect` and the viewport as `currentRect`, while every visible element stays in place on every frame. It shows up when two parts mount above the target in one frame (`animations` into `custom`, `debug` into `dev`). The same insert on a settled page gives CLS 0. It looks like a quirk of how Chrome records the rect of a box first laid out under `visibility: hidden`, not a visible shift. It is left as it is; do not chase it with layout changes.

**Checking**
- Chrome at 100 % hides both the fractional-pixel bug and everything Safari-specific. Check Firefox at 125 % scale (`layout.css.devPixelsPerPx`) and Chrome with `overflow-anchor: none` plus `CSS.supports` forced to false for that property (414×896, CPU ×4).
- Log the target `getBoundingClientRect().top` with 2 decimals on every frame, and wrap `scrollTo`/`scrollBy` to log who moved the scroll. After the reveal the target must stay at `dy` and no scroll may move by more than 1 px.
- Routes worth checking: a mid page one (`styling`), a nested one (`dev`, `ssr`), a bottom one (`playground`), a reload after scrolling to `playground`.
- Check native anchoring separately from the pin: send one input right after the reveal (a `Shift` key event over CDP unpins it) and log the target per frame. Without that, the pin hides a broken anchor before paint, and only `layout-shift` entries show it.
- Measuring traps: `getBoundingClientRect` in a per-frame `requestAnimationFrame` logger forces layout before the frame's own anchoring, so jumps it logs may be corrected later in the same frame; count CLS with a plain `PerformanceObserver` run too. PowerShell drops empty-string arguments to native commands (`'' 'x'` arrives as `'x'`).
- Numbers: see Mount above first (per path). Reload restores to 1–3 px of the saved `dy` on desktop and mobile.

## Part container box

`.rac-section` (the four container articles `start`, `features`, `custom`, `dev`) is `display: block` (`src/rac.css`).

- It was `display: flex; flex-direction: column`. A flex container keeps the `margin-bottom` of its last child inside its box (no margin collapsing), so every article ended 16–24 px below its last section. With a target at `dy = 20` that strip of the previous article was in the viewport, Chrome's anchor search stopped at it (the first partially visible box ends the search, even with no visible child), and parts mounted inside that article (`styling`, `content`, `icons` into `custom` above `dev`) did not move the anchor: the target jumped by the inserted height.
- In block layout the trailing margin collapses out of the article, so the strip is empty margin and the search reaches the target.
- Checked: of 2709 elements in `main` (1440 and 390 px, animations off) only the three article boxes changed, each shorter by exactly its trailing margin; no section moved.
- Do not make `.rac-section` flex, grid or `flow-root` again (any of them keeps the margin inside), and do not give it padding or a border at the bottom.

## Wrapper anchor

`filled(id, shift)` in `deferred.jsx`, the fast path only (`liftFirst()` false, see Mount above first; it returns `true` at once otherwise): while restoring, `Mounted` does not scroll until the container of the target (`closest('.rac-section')`, the target itself for a container target) overflows the viewport at the target position, or nothing below the target is left to mount.

- Why: right after the target chunk arrives the page can be shorter than the viewport (`/ssr/` on mobile: `dev` + `ssr`, 759 px in 844). Then `.rac-sections-container` is fully visible and becomes the anchor, and Chrome keeps it (Traps above). Every later insert inside it above the target (`custom`, `debug`) moved the target, with no compensation once the pin was off.
- Not scrolling means `scrollTop` stays 0 (no anchoring at all) until the layout is tall enough. The first real `scrollTo` then changes the offset, and the anchor is picked again, inside the target.
- `shift` is `top - scrollY`: the check is made for the position the page is about to scroll to.
- Cost: the reveal waits for the part after the target on short targets (it is in the first `shown` batch anyway, about +0.3 s on mobile `/ssr/`).
- Not on the lift-first path: there every part above mounts before the reveal, so no insert above can meet a stale anchor afterwards. Worse, while parts above are still loading the target's container is short, so `filled` kept `scrollTop` at 0 until the 3 s guard revealed the page 14 000 px away from `/dev/` (measured with lift-first everywhere). Keep the `liftFirst()` short-circuit.

## Preload after restore

The preload of every part chunk (`idle(() => Object.keys(LOAD).forEach(fetchPart))` in `Mounted`) starts only once `restoring` is false, or at once where `liftFirst()` is true.

- Why: the first `Mounted` of a deep link is usually a tiny container chunk (`dev`, `custom`). It fired ~50 requests at once, and over slow 4G with 6 connections per host the target chunk came last: `animations` was requested at 1.35 s and arrived at 2.76 s. `/animations/`, `/dev/`, `/playground/` and `/author/` were then revealed by the 3 s guard. With the preload deferred: 2.1, 2.3, 1.9, 2.0 s.
- `liftFirst()` browsers must mount every part above the target before the reveal; without the preload those load one by one (`advance` → fetch → mount), which pushed the Safari emulation of `/ssr/` and `/playground/` to the 3 s guard. They keep the immediate preload.
- A plain `/` visit is unchanged: `restoring` is false from the start.

## Mount above first

`liftFirst()` in `store.js`: `true` without `overflow-anchor` (Safari) and wherever the primary pointer is a mouse (`(pointer: fine)`: desktop Chrome, Edge, Firefox). While restoring, these mount every part above the target first and reveal only after (`advance` rank, `lifted`). Touch devices with anchoring (Chrome on Android) keep the fast path: target, then the part after it, reveal, the rest mounts around the visitor (with Wrapper anchor and Preload after restore).

- Firefox: native anchoring works, but each anchoring adjustment is fractional (part heights are not whole device pixels, e.g. 808.9 CSS px at 1.25 = 1011.125 dp). Firefox snaps the scroll layer and each box (and its own layers: buttons, Slider, Segmented) separately, so after every insert above the viewport visible edges re-round by ±1 dp: the Styling tabs, the Showcase code and its Copy button, the SSR lanes, the Debug and Animations tables, the grouping cards flickered for the ~2 s that parts kept mounting above. Measured by the parallel demo session over WebDriver BiDi at `layout.css.devPixelsPerPx = 1.25`; layout boxes themselves did not change after the reveal. With `liftFirst()`: 0 scroll changes and 0 edge flips after the reveal on `grouping`, `debug`, `animations`, `content`, `styling`, `ssr`, first visit and reload (Firefox 157, 1280×800, unthrottled). Cost: the reveal moved from 130–220 ms to 490–600 ms on the mid-page routes (`ssr` about the same, 1.0 s), single runs.
- Edge and Chrome on desktop showed the same flicker to the user (a Windows scale like 125 %), so the rule covers every fine pointer, not Firefox only (user decision, 2026-10-02). There is no feature to test for this rounding; the first version sniffed `Firefox/` in the user agent.
- Why not everywhere: tried. On mobile (CPU ×4, slow 4G) every part above has to download and mount before the reveal; deep routes took 2.8–4.3 s, most were revealed by the 3 s guard while parts above were still missing, and the target then moved by 18–22 px (CLS 0.03). On the fast path the same routes reveal in 1.4–2.7 s and the target drifts by less than 1 px (19.6–20.3 px instead of 20, up to 2 dp at DPR 3), which is within the budget. The user chose this split.
- Numbers with the split (2026-10-02, headless Edge): desktop 1440×900 reveal 0.14–0.57 s, target exactly in place on every frame; mobile 390×844 touch 1.4–2.7 s, drift < 1 px; the Safari emulation 0.5–2.7 s, no drift; CLS 0 on `dev`, `ssr`, `content`, `animations` in both profiles.
- `hold`/`release` still check `anchored()`, not `liftFirst()`: Chrome, Edge and Firefox have native anchoring and need no manual compensation while the page is hidden.
- A touch laptop whose primary pointer is the mouse takes the lift-first path; a tablet with a mouse attached may report `coarse`. Both paths are correct, only the timing differs.

## Failed part

A part whose chunk fails to load must never stop the mount chain.

- The chain is self-driven: `Part` shown → `Loaded` fetches → `Mounted` → `advance()` shows the next part. Nothing else calls `advance()` on a plain `/` visit, so one part that never reaches `Mounted` leaves the page cut after it (on `/` a failed `question` left only `start` and `usage`, no scroll below).
- `fetchPart` logs the error and drops the cached promise (`PENDING[id]`) so a later call retries; it never rejects. `Loaded` then calls `advance()` itself, the broken part stays empty and the rest of the page mounts.
- On the dev server a chunk fails whenever a module cannot be transformed for a moment (a file saved mid-edit, a missing export), so this shows up while files change under a running `vite`. Check by blocking one part URL (CDP `Network.setBlockedURLs`, e.g. `*start/question.jsx*`) and loading `/`.

## Manual scroll anchor

Replacement for scroll anchoring in browsers without it (Safari, including iOS 18).

**Files**: `store.js` (`anchored`, `hold`, `release`), called from `advance` (before a part is added), `Loaded` in `deferred.jsx` (before the loaded part renders) and `Mounted` (after).

**Contract**: `hold()` remembers the reference part and its top; `release()` scrolls by the difference. Both do nothing where `anchored()` (`CSS.supports('overflow-anchor', 'auto')`) is true, so Chrome and Firefox are unaffected.

**Invariants**
- The reference is a leaf part: it has height and its bottom is below the viewport top, and no other mounted part is inside it. Containers (`features`, `dev`) get parts inserted into them, so their top never moves while their content does. A container as reference produced multiple jumps (native anchoring had the same trap, see Part container box and Wrapper anchor). Since `.rac-section` is `display: block` a container no longer includes the margin of its last child; that margin collapses out below it.
- Pick the last leaf whose top is above `innerHeight / 3`, not the last part with `top < 1`. A part can have only a 20 px strip at the top (the `start` strip over `question`), and the visible content belongs to another part.
- Parts are separated by `margin-bottom: 1.5em` (24 px). A rule that only reacts when the whole new part is above the viewport misses it and shifts the view by 24 px per part.

**Why the reveal waits**: every insert above the viewport makes Safari paint blank tiles for a frame (the whole page flashes, only fixed bars remain). The compensation is correct, the flash is not avoidable, so no insert above the viewport may happen after the reveal. Cost: the reveal comes after 0.6–1.7 s instead of 0.2–0.5 s (first measured); with today's sections the emulation (414×896, CPU ×4, no network throttling) reveals `a11y` at 1.0 s, `styling` 1.5 s, `animations` 2.0 s, `dev` 2.2 s and `ssr`, `playground`, `author` at 2.6 s: close to the 3 s guard, because every part above has to mount first. On a slow chunk or a slow phone the guard reveals early and the flicker can return. The same "mount above first" rule now also runs on every fine-pointer device (Mount above first).

**Known limit**: on Playground and Author a one-off 85 px clamp happens while react-live mounts (emulation without anchoring only; the pin fixes it within 1–15 frames). Not fixed, look at a real Safari first.

**Checking**: emulation as in Scroll restore, plus a real iPhone against `vite preview --host` (the dev server is too slow there and hits the 3 s guard).

## Section heading

The title block of every section: icon + `h3`, optionally followed by the description.

**Files**
- `helpers.jsx` (`Title`, `Heading`, next to `merge`, `arrowIcons`, `options`, `numbered`, the framer presets). Styles: `.rac-code-title-container`, `.rac-code-title` and `.rac-heading-desc` in `src/rac.css` (global, every section uses them).

**Contract**
- `Title({icon, id, className, children})` renders `div.rac-code-title-container` > `div.rac-code-icon[aria-hidden]` (the icon element; colour it with a class of the section, never with an inline style) + `h3.rac-code-title#id`. `id` is the target of the section's `aria-labelledby`.
- `Heading({icon, id, title, desc})` = `Title` + `p.rac-heading-desc` (justified text) when `desc` is given. For sections without a table. A section whose description is not plain text (a feature list) renders `Title` and its own markup.
- A section with a table does not use `Heading`: `Table` puts the same `Title` into the `<caption>` and the description into the first `thead` row (see Semantic table).

**Invariants**
- `helpers.jsx` is in the entry chunk (first-screen `start/usage.jsx` takes `Title` from it), so it stays free of CSS imports and heavy libraries. Never put `Motion` (`motion.jsx`) or anything importing `framer-motion` into it: the whole LazyMotion runtime would land in the entry chunk. Importing `section.jsx` into first-screen code pulled `Table`, `Tick`, two icons and all of `section.css` into the entry chunk (+0.8 KB gzip); do not merge `Title` back into it.
- `section.jsx` imports `framer-motion` (the animated value cell), so it is for lazy parts only; first-screen code takes `Title` from `helpers.jsx`.
- `options` (ten colour objects `{id, label}`) and `numbered(count, name = 'Option')` (`['Option 1', …]`) are the shared demo option lists; never retype `Array.from({length})` in a section.
- `helpers.jsx` mixes components and constants, so `eslint.config.js` turns `react-refresh/only-export-components` off for this one file (an edit there reloads the page instead of hot-swapping; accepted for a rarely edited file).
- `Table` wraps itself in `<Motion>` (LazyMotion, `motion.jsx`): `m.*` without a LazyMotion above it renders but never animates. The `dev` part has no `<Motion>` of its own, so the Debug ticks were static before. Nested LazyMotion under `features`/`customization` is harmless. The value animation lives only in `State` (`m.span` + `slide`): change it there and every table follows.
- The icon wrapper is `aria-hidden`; the heading text alone names the section.

## Semantic table

The one table of the site: every table is `Table` from `section.jsx`, and its parts are switched on and off by props. A full table and a mini table are the same component with fewer props. Reference: `src/features/loading.jsx`.

**Files**
- `section.jsx` (`Table`, the props rows, `Tick`) + `section.css` (shell: `.rac-table*`, `.rac-th`, `.rac-tick-*`) + `props.css` (value cells `.rac-props-*`); both CSS files are imported by `section.jsx`.
- Users: Loading, States, Multiple, Grouping (props rows only), Debug, Animations (props rows + own cells), Icons, Styling, A11y hotkeys (own rows as `children`). Never write `<table>`, `<caption>` or `<thead>` by hand.

**Props: `Table({id, icon, title, desc, columns, head, region, rows, state, onChange, cells, className, children, ...rest})`**
- `id` + `title` (always): the caption, id `<id>-title`. With `icon` the caption is the visible `Title` (`.rac-table-sticky`); without it an `.rac-sr-only` span, so a mini table under a section heading still has a name.
- `desc`: the description row, first `thead` row, one `td colSpan` with `p.rac-table-sticky.rac-table-desc`. Omit it for no description.
- `columns`: module-level `[[Icon, label]]`, rendered as `th scope='col'` > `span.rac-th` (purple lucide icon `aria-hidden` + label). Default: Prop / Type / Value / Description (props rows). Every table shows icons in its header row.
- `head={false}`: hides the header row visually (`tr.rac-sr-only`, still read by screen readers) and sets `data-head='hidden'` on the table, which gives the first body row the top line. Default: visible. No table hides it today; use the prop instead of deleting the header.
- `region={false}`: no scroll wrapper. Default: `div.rac-table-scroll` (`role='region'`, `aria-labelledby='<id>-title'`, `tabIndex={0}`, `overflow-x: auto`, `container-type: inline-size`). Only for a table that never overflows (A11y hotkeys: wrapped text inside a card).
- `rows` + `state` + `onChange` (+ `cells`): the table renders one props row per item (see Props table). `children` are rendered after them in the same `tbody`; a table with own rows passes only `children`.
- `className` is added to `rac-table`; every other prop (`data-drag` in Icons) goes to the `<table>`.

**Semantics**
- Native tags carry the semantics (`caption`, `thead`, `th scope`); the first cell of every body row is `th scope='row'`. Do not change `display` of table elements: Safari then drops their semantics and every element would need an explicit role. Icons and Styling used flex rows with roles before; both are real tables now.
- `.rac-table-sticky` (`position: sticky; left: 0; width: 100cqw`) keeps title and description at the wrapper width while the table scrolls sideways.

**Borders and hover (the one hover approach)**
- `border-collapse: separate`, `border-spacing: 0`. Lines live on cells only: bottom + left on every cell, right on the last column, top on the `thead th` row (or on the first body row with `head={false}`). Collapsed borders vanish while scrolling.
- Colour is `--rac-line` on the table; `table:hover` recolours it to `#8b5cf64d`, so header and body lines highlight together. Every cell with a line has `transition: border-color`. No row hover backgrounds and no per-row highlights in any table: hover is this one mechanism.
- Background `#0e111a` on `tbody` and `thead th`.

**Cells**
- Generic cell: `padding: 0 1em`, `height: var(--rac-table-row)` (`3.2em`, a minimum). Never name it `--rac-row`: that is the library's public variable (row height of `.rac-value` and chips), it inherits into any Select inside the table and made it 3.2em tall.
- `[data-fill]` on a `th` or `td` sets `padding: 0`: the element inside (a tick label, an input, a Select, the Icons upload label) fills the cell and carries its own padding. A filling element that must cover a taller row uses `height: 100%` + `min-height: var(--rac-table-row)` + `box-sizing: border-box` (the percentage resolves because the cell has a height; checked in Edge: label 109px in a 110px cell, the rest is the bottom line).
- Description cells are `Text` from `section.jsx` (`td.rac-table-text`), never typed by hand: see Two-line text.
- Every other cell and `thead th` is `white-space: nowrap`: the table has auto width, so without it names, types and labels would wrap when the table is squeezed. A section whose plain cells must wrap sets `normal` itself (A11y hotkeys `td`).
- `td[data-type]` (`function`, `string`, `number`, `boolean`) colours the type text, VS Code palette. The generic rule is `.rac-table tbody th, tbody td` (0,1,2): a section override must be at least as specific (`.rac-x tbody td.cls`); a bare class loses.
- Focus ring of an interactive cell: its `outline` (2px, `outline-offset: -2px`, transparent → `#c084fc`) on `:has(:focus-visible)`. Text inputs match `:focus-visible` on click too. `-2px` keeps the ring inside the cell; with `-1px` the scroll wrapper clipped it on edge cells. Do not add a second focus indicator inside the cell.
- `input` does not inherit font (13.33px system font): every input in a table needs `font: inherit`.
- Column widths come from content (auto layout); set only minimums, never fixed widths.

**Traps**
- `.rac-sr-only` on a `<tr>` works through absolute positioning; do not give that row layout styles.
- An invisible element that covers a clickable area (opacity 0, absolute) receives the pointer events: cursor and hover logic go on it, not on its parent.
- Inside a clipping parent the wrapper's `outline-offset: 2px` focus ring is cut off: set `-2px` there. `SlideDown` no longer clips once its animation ends, so the Styling tables need no override.
- No rounded corners on any table (A11y hotkeys had them, removed for one look).

## Two-line text

Description cell of every table: the full text, never cut, in at most 2 lines on desktop and 3 at ≤1024px. Pure CSS, no measuring.

**Files**: `Text` in `section.jsx`, `.rac-table .rac-table-text` in `section.css`. Users: props rows (`Row`), Icons, Styling.

**How it works**
- `Text` renders `td.rac-table-text[style=--len]` > `p`. `--len` is the text length in characters (`size()` walks rich children, so Grouping texts with `span`s count too). No copy of the text anywhere, neither in the DOM nor in `::after`.
- The cell sets `--lines` (2, 3 at ≤1024px). The `min-width` of the `p` becomes the cell's min-content, so the column is never narrower than 1/`--lines` of the one-line text:
  - Fallback (Gecko, older WebKit): `min-width: calc(var(--len) / var(--lines) * 0.9ch)`. An estimate by character count; `0.9ch` was tuned headless (`1ch` made tables 30-100px too wide).
  - `@supports (min-width: calc-size(...))` (Chrome / Edge 129+, Safari 26+): `min-width: calc-size(max-content, size * 1.1 / var(--lines))`, exact: the real one-line width plus ~10% slack for word breaks. It wins over the fallback in the cascade.
- The table has auto width (`min-width: 100%`, no `max-content`): it fits the wrapper, the text column takes the free width and wraps (`text-wrap: balance`). Only when the screen is too narrow for 2 (3) lines does the min-width push the table wider, and `.rac-table-scroll` scrolls. Short text stays on one line and does not stretch anything.
- Checked headless (Edge, all 7 props tables, both paths; the fallback by renaming the function inside `@supports` in the built CSS): max 2 lines at 1440 and 1920 px, max 3 at 768 and 390 px. Firefox and Safari were not run.

**Do not**
- Do not clamp with `line-clamp` or ellipsis: the user wants the whole text visible and the width free. A JS width fit, a CSS clamp and an invisible copy of the text (a `span` in the DOM, `font-size: 0.55em`) were all tried and rejected; the copy was replaced by the two `min-width` rules above.
- Do not put `width: max-content` back on `.rac-table`: the text then never wraps.
- Do not tune the fallback factor in one browser only: `ch` is the width of "0", an average letter is ~0.85ch, so the estimate drifts with the font. Re-run the line count when the font changes.
- Limits: the fallback is an estimate (a column may be a few percent too wide, or with a very wide font give one extra line); a single unbreakable word longer than the cell is the only way past the line limit; `--len` counts characters, not rendered width.

## rac-tick

The one checkbox of the site: `Tick` in `section.jsx`, styles in `section.css`.

**Contract**
- `<Tick checked onChange aria-label/>`: every prop goes to `input.rac-tick-input[type=checkbox]`; `span.rac-tick-box[aria-hidden]` follows with the `Scan` frame and the `Check` mark.
- The input is absolute, `inset: 0`, `opacity: 0`, focusable: it covers its nearest positioned ancestor and is the real hit target. The ancestor (usually a `label`) must be `position: relative`; the cursor is set on the input.
- The mark animates through `.rac-tick-input:checked + .rac-tick-box svg:last-child` (scale with overshoot + opacity). No state class, no JS.
- Focus: outside tables the box gets an outline on `:focus-visible`; inside `.rac-table` the cell outline shows focus and the box outline is off.

**Invariants**
- Do not move the box before the input: the sibling selectors need the input first.
- The box is `1.6em` square. In the props table it shares the slot of the edit-cell pencil (1em from the right edge); change both together.
- The old `.rac-demo-checkbox` + `.rac-check-*` checkbox is deleted with all its CSS; do not bring it back. Its invisible-cover role lives on as `.rac-icons-cover` (`icons.css`).

## Props table

One row per prop: name, type, value control, description. `Table` renders these rows itself when it gets `rows` (`Row` in `section.jsx`, cell styles in `props.css`). Users: Loading, States, Multiple, Grouping, Debug, Animations.

**Contract**
- `<Table id title rows={props} state={state} onChange={change}/>` is a mini table; add `icon` and `desc` for a full one. Default columns: Prop, Type, Value, Description (`MousePointerClick` marks Value as interactive). A table without types passes its own `columns` and items without `type` (Debug).
- Item (module-level data): `{prop, type?, kind?, field?, default?, text, show?, ...}`. `state[field ?? prop]` is the value; `onChange(field ?? prop, value)` is one stable callback for all rows. Rows are `memo`: keep `onChange` stable (`useCallback`) and declare `cells` at module level.
- Row: `th.rac-props-name[scope=row]` (`min-width: max(10em, 15%)`) · `td[data-type]` (only when the item has `type`) · value cell · `td.rac-table-text`.
- Value cell by `kind`, looked up in `cells` first, then in the built-ins. Every cell component renders its own `<td>` and gets `{item, name, value, onChange}` (`name` = `field ?? prop`):
  - `edit`: `td.rac-props-edit[data-fill]` with `input.rac-props-input` (fills the cell, own `0 1em` padding) and the hover pencil.
  - `tick`: `td.rac-props-state[data-fill]` > `label.rac-table-tick` with the value and `Tick`.
  - `state` (default, read-only): the same cell with a `div`.
  - `choices`: `td.rac-props-pick[data-fill]` (`--n` choices, `--len` longest text) > `Segmented` (radio mode, modifier `.rac-props-choices`) built from `item.choices` (`[{text, value, tone?}]`, any value incl. `undefined`), radio `name` `props-${prop}`. `item.keepFocus` puts `onMouseDown={prevent}` on the group (Debug `open`: the click must not blur the Select). The props table gives it no look of its own: the consumer styles `.rac-props-choices` (today only Debug, `src/dev/README.md`, Debug table). Without that it shows the default bordered `Segmented` flush with the cell edges.
  - `soon` (planned prop, no value): `td.rac-props-state.rac-props-soon[data-fill]` > `div.rac-table-tick[role=img]` with "Soon" and a Hammer in the Tick slot, `aria-label` `<prop>: in development`. The whole `td` carries `cursor: wait` (the inner `.rac-table-tick` inherits it), so the cursor covers the full row height, not just the fixed-height tick box. Used by Multiple (`sortable`) and Animations (`motion`); switch the row to `tick` when the prop ships.
  - Section kinds: Animations `range` (`Slider`, padded cell) and `select` (easing `Select`, `data-fill`).
- Shown value of `tick` and `state`: `show(value)` when given (States `options`: a boolean shown as `[…]` / `[]`), else `String(value)`, or `default` for `undefined` and `''`. Animated by the `slide` preset. `data-tone`: `fn` yellow (type `function`), `on` green, `off` red.
- `.rac-table-tick`: mono font, flex `space-between`, `position: relative`, `0 1em` padding, `height: var(--rac-table-row)`.
- Widths (minimums): value `7em` (history: 11em → 9em → 7em, wider looked empty), description `40em`, prop `max(10em, 15%)`.

**Invariants**
- Interactive cells carry `data-fill` (`padding: 0`) and the element inside fills the cell; a padded cell (range) leaves it off.
- Hover: `--rac-hover` (`rgba(0,0,0,.3)`, on `.rac-table`) darkens interactive cells over 300 ms, only under `(hover: hover)`. The `edit` cell and every cell with a `label.rac-table-tick` (checked or not, always) get it on the whole `td` as an inset `box-shadow` (works over the edit cell's own background; the `td` is the real cell box, so rows taller than `3.2em` have no gap). `choices` items get it as `background-color` on the unselected item only (`:not(:has(:checked))`), set in `debug.css`. The colour is translucent on purpose: an opaque one would hide the pill sliding under the item.
- Choices fill the cell in every engine only through `position: absolute; inset: 0` on the group inside `td.rac-props-pick` (`position: relative`). `height: 100%` against a `td` with a fixed `height` resolves to that height, not to the stretched row, in some browsers (a 5 px gap above and below the pill). An absolute box has no width, so `td::before` is a sizer: `min-width: calc(var(--n) * (var(--len) * 1ch + 2em))` (equal columns, mono `ch`, `0 1em` item padding).
- Cursors: label cell `pointer` (set on the invisible input), input cell text cursor, read-only cell `default`.
- `PropTable`, `props.jsx` and `TickCell` are gone: the Debug and Animations ticks are the animated `tick` cell now. Do not add a second row component for props.

## SlideDown

Height slide for a panel that mounts on open (`slideDown.jsx`). It is a trimmed port of the library's `Collapse` (`../src/motion.jsx`, doc-key `collapse`: y axis only, no group, no `Presence`, no config context). No framer-motion: it needs no `<Motion>` ancestor. Users: Styling (reference tables), Loading, Safety.

**Contract**
- Props: `visibility`, `duration` (ms, default 300), `easing` (any CSS easing string, default `'ease'`). Every other prop (`id`, `className`, `aria-*`, `role`) goes to the panel `div`, which also has `tabIndex={-1}`.
- The panel unmounts while closed. An `aria-controls` pointing at it refers to a missing element until it opens; keep `aria-expanded` on the toggle.
- Mounted open (`visibility` true on the first render): no animation.
- Frozen while leaving: during the exit the panel renders the last children it got while visible (state `kept`). Safety relies on it: the editor Select keeps its last chip while the panel collapses (no "No options" flash).

**How it works**
- WAAPI `el.animate` between `CLOSED` (height, vertical paddings, margins and borders all `0px`) and the measured computed values, both with `overflow: hidden`, `min-height: 0`, `max-height: none` (`STILL`). The size is measured in `useLayoutEffect`, before paint.
- `measure()` reads the box under a temporary inline `overflow: hidden`, the same box the animation renders. Reason: `overflow: hidden` makes the panel a block formatting context, and a BFC keeps the margins of its first and last child inside. At rest (no BFC) those margins collapse through the panel and are not part of its `height`. Measured at rest, the target was short by the child's margin. In Styling that is `.rac-table-scroll {margin-bottom: 1em}`: the animation ended 16 px short, then the margin popped out below and `Classes` jumped 16 px in the last frame (seen in Firefox, reproduced in Edge: 26.6 px moved in a frame where the panel grew 10.6 px). Measured clipped, the panel ends at `height + margin`. When the clip goes, the box loses the margin and the margin reappears outside it, so the content below stays put (checked per frame in Edge and Firefox, 640 and 430 px, with and without the table's horizontal scrollbar). The exit starts from the same clipped box, so it does not jump at the start either.
- Clipping exists only while the animation runs. When an opening animation finishes it is cancelled, so the panel goes back to its natural layout with no inline style: no permanent `overflow: hidden`, and focus rings and shadows inside are not cut. An exit holds `CLOSED` (`fill: 'both'`) until the unmount.
- Interrupted (toggle while running): `reverse()` in place, no jump. The finish handler reads the latest `visibility` (`useEffectEvent`), so a reversed exit ends open and is cancelled, and a reversed open ends closed and unmounts.
- `prefers-reduced-motion: reduce` → duration 0 (the global CSS rule does not reach WAAPI).

**Traps**
- Do not add the permanent inline `overflow: hidden` back (the framer version had it). It clipped the focus ring of the Styling table scroll wrapper, which needed an `outline-offset: -2px` override; both are gone.
- Do not measure without the clip, and do not swap the trick for a permanent `display: flow-root` on the panel: the inline display would override a user class (`.rac-loaded` is `display: grid`). Limit: when the element after the panel has its own `margin-top`, the collapsed margin at rest is `max(a, b)`, not `a + b`, and the end moves by the difference. No current user has that.
- Prefer `'ease'` or `'ease-out'` for a reveal. `'ease-in'` ends at its top speed, so the panel stops with a visible jolt; Styling used `ease-in` 500 ms and now uses the default `ease`. Loading still passes `'ease-in'` (300 ms, a short grid panel).
- The size is measured once per transition. Content that changes height mid-animation snaps at the end. Content that changes height while the panel is open is natural layout, so it is fine.
- Not done here: the library's `Collapse` keeps the backwards fill of an exit that was reversed to open (`SYNC.md`, "`Collapse`: an exit reversed back to open keeps its fill"). The port cancels the animation instead; keep that cancel.

## Segmented

Segmented switch with a sliding pill: one value out of N buttons (`segmented.jsx`, styles inside it as the `CSS` constant, all `.rac-segmented*`). Users: Usage (start), Showcase (Content, Styling), Safety (presets), the `choices` cell of the props table (Debug).

**Props: `Segmented({id, name, label, items, value, onPick, tabs, disabled, className, ...rest})`**
- `disabled`: every item except the active one gets the `disabled` attribute (`button` or `input`), fades to `opacity: 0.45` over 150 ms and shows the `progress` cursor. The arrow keys do nothing. The active item stays enabled on purpose: it holds the focus after a roving key press, and a focused element that turns disabled loses focus to `body`. Used while a `CodeMorph` redraws (Usage, Showcase).
- `items`: strings, or objects `{text, value}` (radio) / `{id, text}` (tabs). A string is its own text and value. Optional `tone` becomes `data-tone` on the item; the component has no colours for it, the consumer styles them (Debug `open`: `none`/`off`/`on`).
- `tabs`: `role='tablist'` of `button[role=tab]`; `value` is the active index; ids `${id}-tab-${item.id}`, `aria-controls` `${id}-panel`. The caller renders the panel itself (`id=${id}-panel`, `role='tabpanel'`, `aria-labelledby` of the active tab). Keys: roving tabindex, ←/→ wrap, Home/End (`roving`).
- Default: `role='radiogroup'` of `label > input[type=radio]` (invisible, inset 0, it is the hit target), `name={id}`, compared with `value` by `===`. Native arrow keys, no JS. `id` must be unique on the page: radios with one `name` form one group across the document.
- `onPick(next, name)`: `next` is the index (tabs) or the item value (radio). `name` is passed back so one stable `useCallback` serves several switches (e.g. `(value, field) => dispatch({[field]: value})`). The component is `memo`: keep `onPick` stable.
- `className` adds a modifier (`rac-showcase-tabs`, `rac-props-choices`); `...rest` goes to the root (`onMouseDown`).

**Invariants**
- Styles: `<style href='rac-segmented' precedence='low'>` (React 19): one tag for all instances, hoisted to `<head>`. With no other precedence styles on the page React inserts it as the first child of `<head>`, before the site CSS, so a consumer override of equal specificity wins regardless of import order. Do not switch to a plain `<style>` (one copy per instance) or back to a `.css` file without re-checking overrides.
- Restyling from outside: give a `className` and override under it (`.rac-debug .rac-props-choices` is the reference: no border or background, square pill with `--rac-pill-inset: 0`, items as plain cell text). Do not add style props to the component.
- The pill is the global `.rac-pill` (`src/rac.css`, its `::before` look and `--rac-pill-inset`: `0.25em`, `0` in Debug), but its position and width are measured (Segmented pill below), not `--index * 100%`.
- Selected color: `[aria-selected=true]` (tabs) or `:has(:checked)` (radio). Focus ring: `:focus-visible` / `:has(:focus-visible)`, off inside the props table (cell outline).
- `font-family: inherit` on the item: buttons do not inherit the font, labels do; without it tabs and radios looked different.
- First-screen code (Usage) imports it, so it must not import framer-motion or `section.jsx`. That is why it is its own file and not part of `section.jsx`.
- Not for navigation: the mobile menu bar (`src/menu/menu.jsx`, `.rac-menu-indicator`) reuses only `.rac-pill` under its links (`aria-current`, sub-lists, vertical on desktop). Do not turn the menu into a `Segmented`.

## Segmented pill

How the `Segmented` pill follows the active item (`place` + the layout effect in `segmented.jsx`, rule `.rac-segmented > .rac-pill` in its `CSS`).

- Why measured: columns are `1fr`, but `1fr` is `minmax(auto, 1fr)`, so when an item's text is wider than its share the columns become unequal (Debug `value`: 172.75 / 137.56 px in a 310 px cell). The old pill (`100% / count`, `translateX(index * 100%)`) then sat between the buttons. Items may have any width; the pill takes the box of the active one.
- `--x` and `--w` are set on the pill as unitless fractions of the root's padding box (`left: calc(var(--x) * 100%)`, `width: calc(var(--w) * 100%)`). Fractions, not px: `getBoundingClientRect` includes ancestor transforms (the section entrance `scale(0.92)` in `rac.css`), and the ratio cancels it exactly. `offsetWidth` is only used for the border term: it is an integer, and dividing by it left a 0.15 px drift.
- `left`/`width` transitions, `transform: none` and `will-change: auto` override `.rac-pill` (specificity 0,2,0). Do not go back to `translateX(%)`: a percentage of its own animating width bends the path; and the old Debug pill (fractional `translateX` on a `will-change` layer) showed a 1 px gap on the right of the cell; with `left`/`width` it is gone (cause not isolated further).
- Before the first measure (SSR, no JS) the fallback is the old math: `var(--x, var(--index) / var(--count))`, `var(--w, 1 / var(--count))`. `--index`/`--count` stay inline for it.
- Animate only on a pick. The first placement and every `ResizeObserver` (items) placement are `still`: `transition: none`, a forced reflow, then the transition back. `place` returns early when `--x`/`--w` are unchanged, so the observer's initial callback does not cancel a running slide.
- No match (`index` -1, `findIndex` failed) or a zero-width root (hidden): `place` keeps the previous values; the observer re-places when the items get a size.
- Checked: all 8 switches at 1400 and 390 px, pill vs active item within 0.02 px; Debug edges at DPR 1, 1.25 and 1.5 with no background pixel between the pill and the cell borders.

## Slider

Apple-style custom range, pointer-driven, no native `<input type=range>` (`slider.jsx` + `slider.css`, all `.slider-*`; split back into two files once the drag physics pushed the merged size past the 200-line [Files/Styles threshold](../../CLAUDE.md)). Used by Animations.

**Contract**
- `<Slider value min max step onChange aria-*/>`: `onChange` gets a Number, always clamped to `[min, max]` even mid-drag past the track edge; other props (`aria-label`, `aria-valuetext`) land on `.slider-thumb`, which carries `role='slider'`, `tabIndex`, `aria-valuemin/max/now`.
- `--progress` (inline, runtime `(value-min)/(max-min)*100%`) drives `.slider-fill` width and, when idle or on a keyboard change, `.slider-thumb` `left` (via the plain CSS rule). While dragging or settling, `left` and `transform` on the thumb are written directly as inline styles by JS each frame and override the CSS var/rule; they are cleared back to `''` once the settle loop finishes, handing control back to CSS.

**How it works**
- Pointer-down on `.slider-track` (bubbles from the thumb too) computes the value straight from a `getBoundingClientRect()` of the track cached once at pointerdown, plus the pointer's `clientX`, with no dependency on any native input's internal thumb-inset geometry: this is what fixed the old mismatch between the mouse and the visual thumb (the native `input[type=range]` thumb travels inset from the track edges by half its own width, but a decorative overlay positioned as a raw 0–100% percentage drifted apart from it near the ends).
- Overdrag (rubber band): the raw pointer ratio is not clamped before computing the visual position — `pointAt()` takes the part of it past `[0, 100]%` and runs it through `rubber(d, max)` (`max * (1 - 1/(d/max + 1))`, `OVERDRAG = 16`), an asymptotic resistance curve (the iOS scroll-bounce formula) so the thumb keeps following the pointer past the end of the track but travels less and less. The *committed* value stays clamped the whole time (`onChange` never receives an out-of-range number); only the thumb's visual `left` and its `scaleX`/`scaleY` (squash, proportional to how far into the overdrag it is) go past the normal range.
- Drag tracks the pointer 1:1 with no CSS transition at all (`[data-dragging]`/`[data-settling]` disable `transition` on `left`/`transform` for `.slider-fill`/`.slider-thumb`; only `box-shadow` still transitions in CSS): `applyThumb()` writes `left`/`transform` straight to `thumbRef.current.style` on every `pointermove`, so there is no lag and no fighting with a CSS transition mid-drag.
- On `pointerdown`, the press-scale itself is animated, not snapped: `grow()` runs its own `requestAnimationFrame` loop easing `visualRef.current.scale` from whatever it currently is toward `1.3` (`scale += (1.3 − scale) × min(1, dt×20)`), while `move()` keeps writing the live pointer position into the same `visualRef` every `pointermove` so the thumb still tracks the cursor 1:1 with no positional lag — only the scale ramps in, over about half the time the release settle takes (`dt×20` vs. the settle's `dt×10` decay back to 1).
- On `pointerup`, inertia is a real spring simulation, not a CSS easing curve: `settle()` runs a `requestAnimationFrame` loop integrating `accel = -STIFFNESS·(pos − target) − DAMPING·vel` (semi-implicit Euler, `dt` capped at 32 ms), seeded with the velocity measured from the last two `pointermove` samples (`percent`/`ms`, kept in `lastRef`) and the current squash/press-scale (read from `visualRef`, whatever `grow()` reached by release), decaying both back to 1/0 over the same loop. This is what gives the release its inertia (it can overshoot and settle, not just ease once) and what un-deforms an overdragged thumb the same way a rubber band snaps back. The loop writes directly to `thumbRef.current.style` every frame (not React state) to avoid a re-render per frame; it resets the inline styles and flips `data-settling` off once `|pos − target|` and `|vel|` drop under `SETTLE_POS`/`SETTLE_VEL`. Both `grow()` and `settle()` share `rafRef`/`stop()`: only one of them ever runs at a time, and a fresh `pointerdown` cancels whichever is active, picking up its last `visualRef` value (position, scale, stretch) for continuity instead of popping.
- The overdrag squash (`scaleX`/`scaleY` in `applyThumb()`) is deliberately subtle — `stretchRatio × 0.25` / `× 0.175` — tuned down from an earlier, more obvious pass that read as rubbery rather than a tasteful Apple-style give.
- Keyboard-driven changes (arrow keys ± step, shift ± step×10, Home/End) never touch the inline styles, so they fall through to the plain CSS `left`/`transform` transition (`cubic-bezier(0.34, 1.56, 0.64, 1)`, the Apple-slider "boing"). `prefers-reduced-motion: reduce` turns that CSS transition off; it does not touch the JS spring (a reduced-motion user who drags still gets the thumb snapping to a valid position, just without the bounce — the spring itself is short and could be gated too if this turns out to read as motion, see SYNC-worthy follow-up).
- No focus ring on the thumb itself (`outline: none` is the site-wide default on `*`/`::before`/`::after` in `rac.css`; the old `.slider-thumb:focus-visible` rule was removed as redundant). Inside a table, focusing the thumb would normally light up the cell outline (`tbody :is(th, td):has(:focus-visible)` in `section.css`, the `rac-tick` convention) — Animations opts its value cell out of that with `.rac-animations-value:has(:focus-visible) { outline-color: transparent }` (`animations.css`) because a slider cell lighting up like a focused input read as wrong for this control. A future table that wants the default cell-outline behavior for a Slider cell should not copy that override.

**Invariants**
- Width `10em` (`.slider-container`), `100%` under 600px. Animations narrows it to `8em` for its table cell (`.rac-animations-range .slider-container`).
- Do not reintroduce a native `input[type=range]`: the custom hit-test above is the fix, going back to overlaying a real range input reintroduces the geometry mismatch.
- `onChange` is always clamped; only the thumb's visual position/scale go past the track during an overdrag. Do not relax the clamp on the committed value to "simplify" the overdrag — that would let `value` leave `[min, max]` and break every consumer.
- The settle loop and the drag's `AbortController` both get cancelled on unmount and on a fresh `pointerdown` (`stop()`): a stray `requestAnimationFrame` left running after unmount would write to a detached `thumbRef.current`.

## Code button

- `.rac-code-container`, `.rac-code-button` and `.rac-copy-icon` live in `code.css` (imported by `code.jsx`). The button is hidden until its parent is hovered or focused; under `@media (hover: none)` (touch) it is always visible. Reused by the Forms clear button.
- `code.css` also holds every other code style: `.rac-code`, `.rac-code-solid`, `.rac-code-wrapper`, the `rac-code-fade` keyframes, `.rac-soon*` and `.rac-morph-*`, all moved from `src/rac.css`.

## Button

The site's action button (submit, replay). Reference: the Forms Submit (`src/features/forms.jsx`); also Replay in `src/dev/ssr.jsx`.

**Files**: `button.css` (`.rac-button`, `.rac-button-icon`), imported by every consumer (`import '../components/button.css'`). It was `.rac-forms-submit` in `forms.css`; do not copy its rules back into a section file.

**Contract**
- `<button className='rac-button' type='button|submit'>` + an icon (lucide, sized to `1em`) + a text label. Dark fill, purple `0.3` border, `0.5rem` radius, `0.5em 1.25em` padding; hover and `:focus-visible` turn border and text `#c084fc`; focus ring `2px #a78bfa`, offset 2px.
- Unavailable: `disabled` or `aria-disabled='true'`, both styled the same (opacity 0.5, `cursor: progress`, no hover). Use `disabled` when the button cannot hold focus at that moment anyway (Submit while the output types); use `aria-disabled` plus an `onClick` guard when the visitor just pressed it and it locks itself (Replay): a real `disabled` on the focused button drops focus to `body`, and a keyboard user loses their place.
- An icon that changes (idle ↔ busy) goes into `span.rac-button-icon` (fixed `1em` box), swapped with `AnimatePresence mode='wait' initial={false}` + `m.span` keyed by state + `popSlow` (the same swap as `rac-icons-title-container` in `icons.jsx`). The fixed box keeps the label from shifting while one icon has left and the next has not arrived. Needs a `<Motion>` ancestor. The busy icon is `Spinner` (`icons.jsx`): `steps(30)` per second (30 fps), paused while off screen.

## Code morph

A code block that redraws only what changed when its snippet changes (`CodeMorph` in `code.jsx`, `.rac-morph-*` and the `@starting-style` block in `code.css`). Users: Usage (start), Showcase (Content, Styling).

**Contract**
- `<CodeMorph code={snippet} onBusy={setBusy}/>`: `code` is a build-time snippet object (`snippet\`…\``, `snippet.css\`…\`` or a `?snippet` file import, see Snippets), never a runtime string. `memo`: keep `code` a module-level constant.
- `onBusy(true)` when a morph starts, `onBusy(false)` when it ends or is torn down. The parent passes it to `Segmented disabled`, which disables the other tabs while the code redraws. Pass a state setter directly; it is stable.
- Several `CodeMorph`s may share one `onBusy` (Showcase: JSX + CSS). They start in the same commit and run the same 300 ms, so the first `false` unlocks.

**How it works**
- State is a pair `{from, to, step}`. At rest `from === to`: the lines render plain (no diff, no extra spans), the same DOM size as `CodeBlock`.
- A new `code` sets `{from: old to, to: code, step + 1}` during render. `step` keys the `<pre>`, so every morph mounts fresh rows. The LCS line diff (`diff`, `hunk`, `similar`) pairs similar lines into "changed middle" segments. `morph` renders the target state: rows and segments of the new side carry `data-on`, the old side does not.
- The old look comes from `@starting-style` (on rows start at `height: 0`, off rows at `1lh`, segments by `--n` × `1ch`). The transitions run from there: rows by height, segments by width with `steps(--n)` (a typewriter feel). No second render, no forced reflow.
- `useLayoutEffect` collects `pre.getAnimations({subtree: true})` (this call flushes style, so the transitions already exist). When all of them are settled it collapses the pair to `{from: to, to}`, back to plain lines.
- Without `@starting-style` (Firefox < 129, Safari < 17.5) there are no transitions. The swap is instant and `onBusy` is never set.

**Traps**
- Do not go back to rendering both sides and flipping `data-on` in a second render. `react-hooks/set-state-in-effect` rejects it, and reused rows inherited the transitions of the previous pair.
- Interrupting a running morph (a new `code` before the end) snaps to the last target and morphs from there. The tabs are locked for this reason.
- The `<pre>` remounts when a morph starts and when it ends, so its horizontal scroll position resets.

## Snippets

Code shown to visitors is tokenized at build time by the `snippets` plugin in `vite.config.js` (with `tokenize` from `tokens.js`).
- `` snippet`…` `` and `` snippet.css`…` `` template literals are replaced by `{text, lines, styles}` objects. They must be static (no `${}`).
- `import x from './file.css?snippet'` loads a real source file as the same object, with the language taken from the extension. This is the one source for code that the site also uses (the Styling "As styled" CSS is `basic.css`). The plugin resolves it to the virtual id `\0snippet:<path>.js`. Without the `.js` suffix, Vite's CSS plugin takes the id for a stylesheet and the default export is lost.

## Site theme

The one look of every Select on the site: `basic.css`, imported once in `main.jsx` after `rac.css`.

**Contract**
- Global selectors, no class on the Select: `.rac-select, .rac-options {--rac-bg; --rac-fg; border-radius}` and `.rac-options {border}`. The panel is a portal, so it is themed by its own class `.rac-options`, not by inheritance from the trigger. Never add a theme class (`className` / `optionsClassName`) to a Select again; the old `rac-basic-select` / `rac-basic-options` pair on ~25 Selects is gone.
- Variables first: colours go through `--rac-bg` / `--rac-fg` only, so every tint, hover, highlight, chip and scrollbar of the library follows them (`--rac-tint-*`, `--rac-muted` are derived on the same two elements). `--rac-fg` is explicit (`#fff`): without it the text is `CanvasText`, white only because the site is `color-scheme: dark`; a visitor who copies the file into a light page would get black on `#0a0a0f`.
- Plain properties only where the library has no variable: the corner radius and the panel border (`SYNC.md`, "No variables for the corner radius and the panel border").
- The file is shown verbatim as the Styling "As styled" CSS (Snippets above), so it holds no comments, no doc-keys and nothing site-only. Layout is not theme: a width a container needs belongs to that container (Usage makes its stage `display: block`, so the Select stretches without `width: 100%`).
- A section that needs another look overrides on its own class, with the Select's `style` (`--*` keys reach the panel too) or with a section rule of equal or higher specificity: `basic.css` is in the entry CSS, so every lazy chunk comes after it and wins a (0,1,0) tie (`.rac-animations-select`, `.rac-perf-options`).

**Traps**
- Removed as dead code: `color: #c084fc` on the panel never reached the text (`.rac-list` sets `color: var(--rac-fg)` itself; checked headless, options were white) and `outline: none` on the trigger repeats the global `*` rule.
- The theme reaches every Select, including the Styling presets. Aurora and Default strip it with the demo-only `rac-preset` class (`src/customization/README.md`, Preset isolation). A new site-wide variable in `basic.css` must be added to the `--*: revert-layer` list of `.rac-preset` too: `all` does not cover custom properties.

## Track

Horizontal row of the cards that becomes draggable only when it overflows (`Track` and `Card` in `track.jsx`, `.rac-track` / `.rac-track-card` in `track.css`; used by the a11y feature cards and the grouping code cards).

**Contract**
- `<Track label className>` wraps any children (the cards must be direct children: the first and last are observed, the pressed one gets `data-grabbed`); `label` is the region name. `<Card icon title desc className>` is the shared card (icon, `h3`, optional description, `children` below, e.g. a code block); pass a `className` to override the look, with a selector of (0,2,0) because chunk load order is not fixed. Markup: `.rac-track-head` (flex row: `.rac-track-icon` + `h3.rac-code-title`), then `p.rac-track-desc` (own class, justified; never reuse `rac-states-desc` from another block). The grouping cards override it with `text-wrap: nowrap` and `flex: 1 0 max-content; min-width: 16em`, so a card is as wide as its longest content (description or code) and never scrolls inside.
- Native horizontal scroller (`overflow-x: auto`, hidden scrollbar, `overscroll-behavior-x: contain` against the trackpad back gesture). Touch, pen, trackpad swipe, Shift+wheel and keyboard scroll natively; JS only adds mouse drag.
- `data-drag`: set by a `ResizeObserver` when `scrollWidth > clientWidth`. No breakpoints: overflow comes from `flex: 1 0 16em` on the cards (they stretch while 4 fit). Only with `data-drag` the track gets `tabindex='0'` (keyboard reaches off-screen cards with arrows) and `cursor: grab`; mouse drag is ignored without it.
- `data-start` / `data-end`: an `IntersectionObserver` (root = track, threshold 0.99) on the first and last card; set while that card is cut off. They animate `--rac-track-l/-r` (registered via `@property` so the mask gradient transitions) to fade that edge.
- `data-dragging` on the track (after a 4px dead zone): `grabbing` cursor, `user-select: none`, the current text selection is cleared. `data-grabbed` on the pressed card from pointerdown to release: `scale: 0.97` (the "grabbed" squash; keep it subtle).
- Rubber band (like `Slider`, but much weaker): dragging past an edge sets inline `--rac-track-pull` (px, every card `translate`s by it) and `--rac-track-s` (0–1) on the track. Offset is `rubber(d) = PULL * (1 - 1 / (d / PULL + 1))`, `PULL = 40` px asymptote, so the cards resist and never leave more than 40px gap. The grabbed card stretches with `s`: `scale: 0.97+0.02s 0.97-0.02s`. On release the properties are removed and the card `translate` transition (`0.45s cubic-bezier(0.34, 1.4, 0.64, 1)`, slight overshoot) springs back; while `[data-dragging]` that transition is off so the cards follow the pointer 1:1.

**Invariants and traps**
- Drag is `pointerType === 'mouse'` only: touch already scrolls natively with momentum, and handling it in JS would fight the browser and block vertical page scroll.
- The drag origin is rebased to the pointer position where the 4px dead zone ends, so the track does not jump by 4px when dragging starts (a micro move used to snap). Velocity samples are taken at most every 8 ms (`dt < 8` is skipped, `x`/`t` not advanced), so high-rate mice do not produce noisy spikes.
- Position is computed from the origin (`from + origin - clientX`) and kept as a float in `pos`, never read back from `scrollLeft`: it rounds to device pixels, and a slow glide would stall on the rounding.
- Release glide: velocity (px/ms, smoothed 0.8/0.2) decays by `0.95` per 16 ms, frame-rate independent via `dt`; skipped when the pointer rested > 80 ms before release or under reduced motion; stops at either edge (the glide does not bounce; only a pull with the mouse held stretches). A wheel event or a new pointerdown cancels it.
- No scroll listeners (project rule): edges use `IntersectionObserver`, overflow uses `ResizeObserver`. Window listeners of a drag share one `AbortController`; `stop` (ref) aborts them and cancels the rAF, also on unmount.
- Do not add `scroll-snap`: programmatic `scrollLeft` each frame fights mandatory snapping in Chrome.
- The mask also fades the focus outline at a faded edge; accepted.
