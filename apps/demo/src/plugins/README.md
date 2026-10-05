# Plugins folder notes

The Plugins group (`/plugins/`): one part per library plugin, shipped or planned, plus the bundle size overview. Each part is its own chunk in `LOAD` (`src/components/deferred.jsx`); the group container is the shared `Group` (`src/components/README.md`, Group part). Order in the menu: `bundle`, `multiple`, `loading`, `search`, `virtual`.

## Bundle size

Overview of the plugin model: what a plugin is, the import snippet and the size table.

- `bundle.jsx`, no own styles. `Heading` (id `plugins-heading`, kept from when it lived in Performance), `CodeBlock`, `Table` with `columns` and own rows (`plugin-sizes`).
- Sizes are measured, not computed: re-measure on a library release (Rolldown-Vite consumer build, React external) and update `SIZES`. The text lists the planned plugins (search, virtualization, chip sorting); keep it in sync with the Soon parts below.

## Infinite Loading

Reference section of the semantic table (`src/components/README.md`: Semantic table, Props table, rac-tick). Edits the infinite-loading props live and shows a "loaded" toast after a simulated request.

**Files**
- `loading.jsx` + `loading.css` (`.rac-loading`, all `.rac-loaded-*`). The table is the shared `Table` with `rows`; no table styles live here.
- Inside `loading.jsx`: `props` (row data), `Loaded` (the "Successfully loaded / Want delete?" button, owns its hover state; the text and icon pair is chosen once and keyed, `data-del` adds the extra left padding). `Select` gets `arrowIcons` and a memoized `texts`.

**Invariants**
- State keys equal the prop paths (`texts.loadMore`), so `Table` reads `state[prop]` directly. Numbers are edited as strings and converted with `Number()` at the Select.
- `trigger` returns a Promise resolved by a stored 2 s timer (cleared on unmount and before re-arming).

## Multiple props

Feature list plus the boolean props in a mini `Table` (`rows`, no `icon`, no `desc`, sr-only caption 'Multiple props'), same pattern as Grouping (`src/features/README.md`, Grouping props).

- `multiple.jsx` + `multiple.css` (feature list `.rac-multiple-*`).
- `Heading` without description, then the feature list, `Table` (`plugins`, `deleteAlways`, `deleteInline` ticks and a `sortable` row of `kind: 'soon'`, type `plugin`: a planned add-on plugin that works only with `chips`, see `apps/demo/SYNC.md`, Waiting; the shared built-in `soon` cell of `Table` renders a "Soon" label with a Hammer in the Tick slot, see `src/components/README.md`, Props table; switch it to `tick` when it ships), the Select (`--rac-row: 2.5rem` is the library variable on purpose). State is one `merge` reducer.
- The "Without the plugin" item states what the library does without `chips`: labels joined with `, ` (`../../packages/react-animated-select/src/trigger.jsx`), no way to remove a value from the field, only from the open menu.
- `deleteInline` and `deleteAlways` combine; neither overrides the other.

## Without-the-plugin warning

A plugin section opens with a warning about what happens when the plugin is not passed. Two levels, chosen by whether the feature still works:
- **Hard** (red, `Warn` from `helpers.jsx`, `.rac-warn` in `basic.css`): the feature does nothing without the plugin. Used by Infinite Loading (`desc` of `Table`, so only inline markup: `Warn` is spans). Next: Search, Virtualization.
- **Soft** (amber, `data-warn='soft'`): the feature works in a reduced form. Used by Multiple (the "Without the plugin" `li`, `warn: 'soft'`).

Both start with the `TriangleAlert` icon and a bold "Without the plugin:" title; the text below says what is lost. Colors: `[data-warn]` and `.rac-warn` are the hard one, `[data-warn='soft']` follows it in `basic.css` and overrides it (equal specificity, order decides). New plugin sections pick the level and reuse this wording; do not add a third color.

## Planned plugins

`search.jsx` and `virtual.jsx` are placeholders: `Heading` with the Hammer icon and `Soon` (`src/components/code.jsx`). The virtual snippet is a planned API: do not present it as shipped, and replace the part with a live demo when the plugin is released. The virtual text refers to the Performance meter (`src/features/performance.jsx`): keep the reference if that section is reworked.
