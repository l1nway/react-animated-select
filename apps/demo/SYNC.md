# Demo inbox

What the library (`../../packages/react-animated-select`) and the backend (`../backend`) changed that the demo still has to show or adapt to. A demo session reads this file, does the work, and removes done entries.

Where entries come from (cross-workspace rules, `CLAUDE.md`, "Library, backend and SYNC.md"):
- A library change the site should reflect is either made in `apps/demo` in the same change, or recorded here.
- A backend change that affects the demo (request/response contract, URL, behaviour) is either made in `apps/demo` in the same change, or recorded here.

Bugs and other findings the demo makes in the library or the backend do not go here: they are reported to the owner, then fixed with approval or recorded in `../../packages/react-animated-select/BUGS.md` or `../backend/BUGS.md`.

## Entry format

```md
### <short title>
- **Kind:** feature | behaviour | api | styles | docs | contract | idea
- **From:** library | backend
- **Source:** file in `../../packages/react-animated-select/src` or `../backend`, doc-key, `FEATURES.md` / `STYLES.md` heading, or version
- **What changed:** what the library or the backend does now
- **Demo work needed:** section (`#id`), file and line, what to change, show and say
```

Statuses:
- **Open:** the change is in the code of the current commit; the demo can do the work now.
- **Waiting:** the demo work depends on something that has not shipped yet. The entry says what it waits for and moves to Open when that lands.
- Done: the demo work is made and verified (`CLAUDE.md`, Workflow), and the entry is deleted in the same change. There is no Done section; git history keeps old entries.

`FEATURES.md` and `STYLES.md` below are the library docs in `../../packages/react-animated-select/`. File paths without a prefix are in `apps/demo`. Line numbers are as of the day the entry was written; check them before editing.

## Open

### Multiple: switching the delete-button modes animates
- **Kind:** behaviour
- **From:** library
- **Source:** library fixes of 2026-10-04 (sandbox `SYNC.md`, Done); `deleteAlways`, `deleteInline` (`FEATURES.md`, Multiple selection with chips)
- **What changed:** switching `deleteAlways` or `deleteInline` animates: the chips change width smoothly, the rows never flash an extra line, and the × slides between the end of the chip and the space inside it. Switching to the narrower mode shrinks the chips first and merges the rows at the end. Long-press delete mode on touch enters and leaves the same way. Replacing the whole value resizes the field over the full `duration`.
- **Demo work needed** (`#multiple`):
  - `src/plugins/multiple.jsx:42` (`deleteAlways` row): add to `text`: "Switching it animates: the chips change width smoothly and the rows never flash an extra line."
  - `src/plugins/multiple.jsx:43` (`deleteInline` row): add to `text`: "Switching it slides the × between the end of the chip and the space inside it."
  - Show: give the example enough chips for two rows whose split differs between modes (about 20 short chips in the ~700 px trigger). Say: switching to the narrower mode shrinks the chips first and merges the rows at the end. Long-press delete mode on touch enters and leaves the same way. Replacing the whole value resizes the field over the full `duration`.

### Multiple without `chips`: wrapping comma-separated labels (`.rac-pick`)
- **Kind:** behaviour, styles
- **From:** library
- **Source:** library fixes of 2026-10-04 (sandbox `SYNC.md`, Done); `../../packages/react-animated-select/src/trigger.jsx` (`Picks`); class `.rac-pick` (`STYLES.md`)
- **What changed:** without the `chips` plugin the picked options show as comma-separated text that wraps onto new rows, one `.rac-pick` per label with a theme comma. Each label fades in, a removed one fades and closes up so the rest slide back, and only a label wider than the whole field is cut with an ellipsis. The placeholder leaves before the first label appears, so the field never flashes an extra row.
- **Demo work needed** (`#multiple`, "Without the plugin"):
  - `src/plugins/multiple.jsx:37` ("Without the plugin" `desc`): replace "the picked options show as plain comma-separated text." with "the picked options show as comma-separated text that wraps onto new rows; each label fades in, a removed one fades and closes up so the rest slide back, and only a label wider than the whole field is cut with an ellipsis." Keep the sentence about removing from the menu.
  - Show: with the plugins toggle off (line 76), pick enough options for three rows plus one long label; clear with ×. Say: the placeholder leaves before the first label appears, so the field never flashes an extra row. Also show removing a label from the middle of the first row.
  - `src/plugins/README.md:30`: "labels joined with `, `" → "labels as wrapping comma-separated text, one `.rac-pick` each (`../../packages/react-animated-select/src/trigger.jsx`, `Picks`)".
  - Styling reference (`src/customization/reference.js`): the new class `.rac-pick` and its theme comma, as in `STYLES.md`.

### Multiple: switching the plugins at runtime never jumps
- **Kind:** behaviour
- **From:** library
- **Source:** library fixes of 2026-10-04 (sandbox `SYNC.md`, Done); `plugins` prop, `chips` plugin (`FEATURES.md`, Tree-shakable plugins)
- **What changed:** switching the `chips` plugin off and on at runtime morphs in one motion: the chips shed their background and padding, the commas fade in, the rows merge and the field height follows; switching back reverses from where it is.
- **Demo work needed** (`#multiple`): plugins toggle (`src/plugins/multiple.jsx:76`, the "Without the plugin" switch): no code change. Show: about two rows of chips, then switch the plugin off and on, also mid-way. Say: "Switching plugins at runtime never jumps: the chips shed their background and padding, the commas fade in, the rows merge and the field height follows in one motion; switching back reverses from where it is."

### Infinite loading: the "Load more" row keeps your place
- **Kind:** behaviour
- **From:** library
- **Source:** library fixes of 2026-10-04 (sandbox `SYNC.md`, Done); `loadButton` (`FEATURES.md`, Async loading)
- **What changed:** clicking the "Load more" row (or Enter / Space on it) keeps the place: the row shows the loading state, then the first new option is highlighted where the row was. A failed load keeps the highlight on the row so the user can retry.
- **Demo work needed** (`#loading`):
  - `src/plugins/loading.jsx:22` (`loadButton` row): add to `text`: "Clicking it (or Enter / Space on it) keeps your place: the row shows the loading state, then the first new option is highlighted where the row was. A failed load keeps the highlight on the row so you can retry."
  - Optional: a "fail next load" toggle beside the button-mode demo to show the retry.

### Styling presets: the trigger height animates
- **Kind:** behaviour
- **From:** library
- **Source:** library fixes of 2026-10-04 (sandbox `SYNC.md`, Done); `--rac-row` (`STYLES.md`)
- **What changed:** a change of `--rac-row` animates the trigger height. The root's own padding and border still change at once.
- **Demo work needed** (`#styling`): `src/customization/styling.jsx` (presets in `src/customization/reference.js`): no code change. Check that the preset tabs (`Aurora` ↔ `Default`) animate the trigger height (`--rac-row` 2.5em ↔ 2em). The root's own padding and border still change at once.

### Layout: the portal panel inside a scroll container
- **Kind:** behaviour, styles
- **From:** library
- **Source:** library fixes of 2026-10-04 (sandbox `SYNC.md`, Done); `FEATURES.md`, Options panel in a portal; `--rac-visible`, `data-offscreen` (`STYLES.md`)
- **What changed:** inside a scroll container the list stays attached to the visible part of the field and fades as the field scrolls out of the box; scrolled out completely, the list hides. The new variable `--rac-visible` is written by JS on the panel (read-only), and `data-offscreen` now means fully clipped only.
- **Demo work needed** (`#layout`, `src/features/layout.jsx`):
  - Line 5 (`desc`): add after "scroll containers.": "Inside a scroll container the list stays attached to the visible part of the field and fades as the field scrolls out of the box; scrolled out completely, the list hides."
  - Show: a Select inside a small `overflow: auto` box (about 180 px tall, the trigger centred, content above and below) with the caption "Scroll the box". It can replace the `FEATURES.md` idea (Options panel in a portal, Demo) of a Select in a small `overflow: hidden` box.
  - Styling reference (`src/customization/reference.js`): the new variable `--rac-visible` (written by JS on the panel, read-only) and the changed meaning of `data-offscreen` (fully clipped only), as in `STYLES.md`.

### Idea: custom rendering, shown boldly
- **Kind:** idea
- **From:** library
- **Source:** the owner's goal, recorded with the library fixes of 2026-10-04; `FEATURES.md`, Options as JSX or data, Selected options in the value area
- **What changed:** nothing new in the library: custom JSX inside options and chips is already supported, but barely visible on the demo today.
- **Demo work needed:** make custom rendering a showcase. Show that an option and a chip can hold an image (avatar, flag, product photo), a rich layout (several lines, badges, prices, icons), and still animate, wrap and delete like plain text. Plan the cases and their place on the page first and show the plan to the owner (`CLAUDE.md`, Workflow: analysis before code); this entry is only the goal.

## Waiting

### Chip reordering: the safety section's chip-only Select
- **Kind:** feature
- **From:** library
- **Source:** `FEATURES.md`, Planned, Reordering chips (drag), with haptics
- **What changed:** nothing yet. Waits for chip reordering to ship in the library.
- **Demo work needed** (`#safety`): when chip reordering ships, the safety feature's chip-only Select will need to be updated to use this feature for reordering the displayed values.

### Sortable, virtual and search plugins: replace the Soon placeholders
- **Kind:** feature
- **From:** library
- **Source:** `FEATURES.md`, Planned (future features ship as plugins); `../../packages/react-animated-select/BUGS.md`, Done (the old demo entry "Sortable chips: a plugin on top of chips, not a prop")
- **What changed:** nothing yet. Waits for the plugins to ship. Reordering is planned as a separate add-on plugin that works only together with `chips` (`plugins={[chips, sortable]}`), so it stays out of the bundle when unused; `virtual` and `search` are planned as plugins too. Plugin names and the behaviour of `sortable` without `chips` (warn and ignore?) are still to be confirmed.
- **Demo work needed:** the Multiple table (`src/plugins/multiple.jsx`) shows `sortable` as a planned plugin (`kind: 'soon'`, type `plugin`); switch it to `tick` when it ships. `src/plugins/search.jsx` and `virtual.jsx` are Soon placeholders with a guessed `virtual` import; replace them with the real plugins.
