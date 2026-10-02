# react-animated-select — features

The reasons to pick this Select, and how each one is built. It is the source for the demo page: every entry says what the user gets, how it works (files in `../src` and `../src/README.md` doc-keys), its limits, and how to show it.

Keep it true: an entry changes in the same edit as the code it describes.

## Server rendering (SSR)

- **What you get:** the Select renders to HTML in Next.js, Remix or `renderToString`, and hydrates without a mismatch. The server HTML already shows the right title, chips and enabled state, for array options and for `<Option/>` children alike.
- **How:** every `useSyncExternalStore` has a server snapshot equal to the store's initial state. The portal waits for a client flag (`useSyncExternalStore`, not a mount effect, so client-only apps pay nothing). JSX options are read from `children` during render, not registered in effects. DOM ids are deterministic (`useId`, option paths, escaped by `optionDomId`). `window` and `document` are touched only in effects and handlers.
- **Where:** `dropdown.jsx`, `select.jsx`, `utils.jsx`; doc-keys `server-render`, `jsx-options`, `store`, `dom-ids`.
- **Limits:** the options panel is never part of the server HTML, even with `open` starting `true`; it mounts right after hydration, without the open animation. Both bundles start with `'use client'`, so a Next.js App Router server component can import and render the Select (function props such as `onChange` still come from a client component). `defineOption` components must be declared in a client module: in a server module they render to `null`.
- **Demo idea:** show the `renderToString` output of a Select with a value, next to the live one.

## Options panel in a portal

**Added to the demo:** `#layout`.

## Accessibility (ARIA combobox)

**Added to the demo:** `#a11y`.

## Native form fields

**Added to the demo:** `#forms`.

## Zero-dependency animations

**Added to the demo:** `#animations` (`keepMounted` in `#debug`).

## Fine-grained re-renders

**Added to the demo:** `#performance`.

## Options as JSX or data

**Added to the demo:** `#usage`, `#grouping`, `#content`.

## Any data, never broken

**Added to the demo:** `#safety`.

## Selected options in the value area

**Added to the demo:** `#content`.

## Controlled or uncontrolled

**Added to the demo:** `#debug`.

## Multiple selection with chips

**Added to the demo:** `#multiple`.

## Touch delete mode

**Added to the demo:** `#multiple`, `#a11y`.

## Async loading

**Added to the demo:** `#loading`.

## States and layout stability

**Added to the demo:** `#states`.

## Grows with its content, truncates at the limit

**Added to the demo:** `#layout`.

## Deep customization

**Added to the demo:** `#styling` (icons in `#icons`, `texts` in `#states` and `#loading`).

## Planned

Not implemented yet: the next library edits, recorded on 2026-10-01 so a later session can start from them. Suggested order: virtualization, search, the animation rework, chip reordering (each later step uses the earlier ones); the user may reorder. Each item is still analysed and shown to the user before code.

### Animation rework: a `motion` prop by role

- **Goal:** beautiful defaults, and deep customization without a pile of `animation='…'` props. The consumer tunes each animated role with a preset or a spec object; `duration` / `easing` stay the global defaults.
- **Accepted API sketch:** `motion={{panel: motion.drop, chip: {...motion.pop, duration: 180}, title: motion.ticker, move: {easing: 'cubic-bezier(.3, 1.4, .5, 1)'}, groupItems: ({index}) => ({...motion.fade, delay: index * 15}), clear: false}}`. Roles: `panel`, `groupItems`, `title`, `chip`, `chipDelete`, `clear`, `arrow`, `move` (FLIP), `height` (trigger height), `check`. A role is a preset, a spec (keyframes, duration, easing, delay), a function of `{placement, index, count, direction}`, or `false`. Presets are exported plain data. A `SelectDefaults` context sets them for every Select below it.
- **Two layers:** the library owns the layout layer (the real size of the box, monotonic easing, the invariants of the rows, the hold and the reserve); the consumer owns the visual layer (opacity, transform, blur, clip-path, overshoot allowed). A dev warning fires when an overshooting easing lands on the layout layer.
- **Decided:** the size animation stays a real `width` / `height` animation of the whole box. Replacing it with a negative margin, `clip-path` or `transform` was rejected: cheaper for the browser, but it looks cheap. Transforms stay for FLIP moves and the visual layer.
- **Also in this step:** the title keyed by its state, not its text (today any text change, such as typing a `placeholder`, replays the title animation), with a width morph from the old title to the new one (removes the title clock and the 0.25 px slack); every trigger reviewed (animate on a change of option or state, never on a mere text change); reduced motion per role; stagger; touch delete mode entering and leaving through the row hold.

### Virtualized option list

- **Problem:** every option is mounted. At 500–1000 rows, opening the panel and every selection get slow (mount, one highlight subscription per row, rebuilding the whole node list), worse on phones and with rich JSX options. `loadMore` limits what is fetched, not what is mounted. Step 0 measures 1k / 5k / 10k rows in the playground before any code.
- **Plan (no dependency):** render only the rows in view plus an overscan, between two spacers, so the rows stay in normal flow and consumer CSS keeps working. Heights are variable (JSX, wrapped text, group headers): estimate, measure the mounted rows with a `ResizeObserver`, cache heights by option id, keep prefix sums, and correct `scrollTop` instantly when a row above the view changes size (scroll anchoring). Turned on above a threshold (a `virtual` prop: `false`, `true` or a row count); below it, the list behaves as today.
- **What changes:** the highlight is already an index, so keyboard moves become "scroll to index, then the row mounts". The highlighted row stays mounted even off-screen, so `aria-activedescendant` always points to a real element; rows get `aria-setsize` / `aria-posinset`. Opening scrolls to the selected option before paint. A group collapse animates only the part of the group that is in view. `loadMore` keeps working on the scroll distance. Opening the panel gets cheaper, since it measures a few rows.
- **Smooth scroll:** programmatic jumps (keyboard paging, scroll to the selected option, a search reset) scroll smoothly; anchoring corrections stay instant, because their job is to be invisible. Smooth scrolling hides jumps, not measurement errors: the jitter is fixed by measuring and anchoring.

### Search, on top of the virtual list

- **Plan:** a `search` prop puts an input in the value area (after the chips, or in place of the title), following the WAI-ARIA editable combobox pattern. Local filtering runs over the text the model already has (the label chain, including the text inside JSX options), case- and accent-insensitive, with keys precomputed once per option set, so a keystroke over 10k options stays around a millisecond. Groups with matches are forced open while searching; a `texts` entry names the "no matches" row. A custom `filter(option, query)`, or no local filter for server search, plus a controlled query (`searchValue` / `onSearchChange`), combines with `loadMore` and `loading` for server-side paging.
- **Motion:** the panel height follows the result count smoothly, the way the trigger follows chip rows. Only a few rows are mounted, so the rows that stay can FLIP to their new place and new ones fade in, interruptible on every keystroke.
- **Open questions:** input in the trigger or at the top of the panel; whether the query clears after a pick in multiple mode; Space types instead of selecting (Enter selects); the input as the last item of the chip rows (the ghost measurement and the hold must count it); the phone keyboard shrinks `visualViewport`, not `innerHeight`, so panel positioning must follow it. Typeahead (jump to an option by typing, like a native select) can ship without the input.

### Reordering chips (drag), with haptics

- **Goal:** in multiple mode, the user drags chips to change the order of `value` instead of reopening the list to pick in the right order. The list itself is never reordered.
- **What exists:** the chip order is the order of `value`, and a reordered `value` already slides every chip to its new place (FLIP). A reorder is a plain `onChange` with the same items in a new order.
- **Plug in an outside library, or build it in:** an outside library needs an extension point on every chip (a ref, listeners, a transform), which turns the chip's DOM into a public contract. SortableJS moves DOM nodes behind React's back and breaks `Presence`. Framer Motion's `Reorder` handles one axis only, not wrapped rows. dnd-kit fits (transforms, touch, keyboard, announcements), but its touch sensor would fight the long press (delete mode) and the swipe, which it knows nothing about. The hard parts (FLIP, rows, gesture arbitration with touch delete mode) stay ours either way. Built in, it is about 150 lines (a `useChipDrag.js` file on top of the chip store and `flip`) behind a `sortable` prop. The extension point for outside libraries can come later.
- **Gestures:** mouse: drag past a few pixels. Touch: the long press already enters delete mode, where the chips shake; that mode also becomes the rearrange mode (the iOS home-screen model: drag to move, tap × to delete). While dragging, the chip follows the pointer, the target is the nearest slot across rows, the others move out of the way by FLIP, and the drop commits one `onChange`. A drag never opens the panel or triggers a click.
- **Keyboard parity (required):** chips are not focusable today. Reordering needs chip focus first (arrows move between chips, a modifier plus arrows moves the chip), with a polite live announcement from `texts`.
- **Haptics:** `navigator.vibrate` exists only on Android browsers, and iOS Safari has no web vibration. A `haptics` prop (`true`, `false` or `(kind) => void`) routes pick-up, each slot crossed, drop, entering delete mode and delete to `vibrate` by default, or to the host's API (Capacitor Haptics, Telegram `HapticFeedback`). The existing delete-mode vibration moves onto it.
- **Demo integration note:** When chip reordering ships, the safety feature's chip-only Select will need to be updated to use this feature for reordering the displayed values.

## Props

The whole public API of `<Select/>`. `DEFAULT_PROPS` in `select.jsx` is the single declaration; this table follows it. A prop left `undefined` takes its default. Every prop can be changed live in the `App.jsx` playground (`src/playground.js` holds its schema; a new prop gets a control there).

### Data and value

| Prop | Type | Default | What it does |
|---|---|---|---|
| `options` | array or object | `[]` | Primitives, objects, groups (`{name, options}`), items with a `group` field, or a dictionary. Merged with the `<Option/>` / `<OptGroup/>` children. |
| `children` | `<Option/>`, `<OptGroup/>`, `defineOption` components | — | JSX options, read as data. |
| `value` | any | — | Controlled value (an array in multiple mode): the consumer holds it and passes it back from `onChange`. Derived on every render. Without `onChange` the Select is read-only (a dev warning, like a React `<input value>`). `undefined` means "not controlled"; clearing commits `null` (single) or `[]` (multiple). |
| `defaultValue` | any | — | Initial value for uncontrolled mode: the Select holds the value itself, `onChange` only reports it. Read once on mount. |
| `onChange` | `(value, ids) => void` | — | Every commit: select, uncheck, chip delete, clear. `ids` are the options' `id`s (or values). Not called when a single Select's selected option is picked again. |
| `multiple` | boolean | `false` | Multiple choice with chips and checkboxes. |
| `childrenFirst` | boolean | `false` | JSX options before the array options. |
| `groupsClosed` | boolean | `false` | Every group starts collapsed. Read on every render. |

### States

| Prop | Type | Default | What it does |
|---|---|---|---|
| `disabled` | boolean | `false` | Not interactive, like a native disabled select: closes the panel, hides the clear button and the arrow, locks the chips. The value stays visible; without a value the title is `texts.disabled`. `aria-disabled`. |
| `loading` | boolean | `false` | Reports only: the busy stripe (`aria-busy`), the loading footer in the open list, and without a value the title `texts.loading` with dots. The Select stays usable while it has options. |
| `error` | boolean | `false` | Reports only: `data-error` (red border), the error row `texts.error` at the end of the list, and without a value the title `texts.error`. The Select stays usable while it has options. |

An empty option list makes the Select inactive (closed, no clear button or arrow), whatever the status.

### Open state

| Prop | Type | Default | What it does |
|---|---|---|---|
| `open` | boolean | — | Controlled open state. Without `onOpenChange` only the consumer opens and closes the Select. An outside toggle button takes the focus, so the Select asks to close on blur before the button's click: give the button `onMouseDown={e => e.preventDefault()}`. |
| `onOpenChange` | `(open) => void` | — | Called on every open and every close the Select makes or asks for (click, focus, keys, selection in single mode, blur, becoming inactive), in both modes. Never on mount, never for a no-op. An inactive Select (disabled, no options) is never shown open, whatever `open` says. |
| `onFocus` | `(event) => void` | — | Focus entered the Select from outside. |
| `onBlur` | `(event) => void` | — | Focus left the Select and its list. |

### Form and accessibility

| Prop | Type | Default | What it does |
|---|---|---|---|
| `id` | string | — | `id` of the combobox element (for `aria-labelledby` elsewhere, tests, anchors). |
| `aria-*`, `data-*` | string | — | Forwarded to the combobox. `aria-label` / `aria-labelledby` replace the placeholder as its accessible name. The Select's own state attributes cannot be overridden. |
| `name` | string | — | Form field name: hidden inputs submit the value with the `<form>` (one per value in multiple mode; objects as JSON). |
| `required` | boolean | `false` | An empty Select blocks the form submit (native validation bubble) and gets `aria-required`. |

### Async loading

| Prop | Type | Default | What it does |
|---|---|---|---|
| `hasMore` | boolean | `false` | More pages exist. Shows the loading footer (scroll mode) or the "Load more" row (`loadButton`). |
| `loadMore` | `() => void \| Promise` | — | Loads the next page. A returned Promise unlocks the next load when it settles, success or failure. `hasMore` without it warns once. |
| `loadButton` | boolean | `false` | A "Load more" row instead of loading on scroll. |
| `loadOffset` | number (px) | `100` | Scroll distance from the end that triggers a load. |
| `loadAhead` | number | `3` | Keyboard highlight distance (in options) from the end that triggers a load. |

### Content and texts

| Prop | Type | Default | What it does |
|---|---|---|---|
| `placeholder` | string | `'Choose option'` | Title without a value; also the combobox `aria-label` unless `aria-label` or `aria-labelledby` is passed. |
| `selectedText` | string | — | With any value, replaces the title and the chips by this text. |
| `texts` | object | see below | Every other string of the Select. |
| `renderOption` | `(item, {selected, disabled}) => ReactNode` | — | Custom rows for array data. Keep it stable (`useCallback`) for large lists. |
| `valueAsOption` | boolean | `false` | The title and the chips render the option's content instead of its text. |

`texts` keys and defaults: `empty` `'No options'` (title without options), `disabled` `'Disabled'`, `loading` `'Loading'`, `error` `'Failed to load'`, `clear` `'Clear selection'` (clear button label), `remove` `'Remove'` (chip delete label prefix), `loadMore` `'Load more'` (the button row), `loadingMore` `'Loading'` (the button row while loading, and the scroll footer), `emptyOption` `'Empty option'` (`null`, `''`, an option without text), `invalidOption` `'Invalid option'` (a function in `options`), `disabledOption` `'Disabled option'` (a disabled object without a label), `emptyGroup` `'Empty group'` (a group without a name, array or `<OptGroup/>`), `list` `'Options'` (listbox label).

How to use `texts`:
- Pass only the keys to change: `texts={{empty: 'Ничего нет', loading: 'Загрузка'}}`. The rest keep their defaults; a key set to `undefined` keeps its default too.
- An inline object is fine: it is compared by its values, so it does not re-render the Select.
- For a whole locale, keep one object in a module and pass it to every Select.

### Icons and chips

| Prop | Type | Default | What it does |
|---|---|---|---|
| `icons` | object | see below | Every icon of the Select. |
| `deleteInline` | `boolean` | `false` | Where the chip's delete button sits: over the end of the chip (default) or inside it, the chip widening (on hover its row neighbours make room, no chip changes rows). |
| `deleteAlways` | `boolean` | `false` | When the delete button shows: on hover (default) or always. Swipe and touch delete mode show it either way. Combines freely with `deleteInline`; an always-shown overlay covers the end of the chip text. |

`icons` keys: `arrow` (the trigger arrow and the group arrows; it points up and CSS rotates it), `clear` (clear button), `remove` (chip delete button), `check` (checkmark in multiple mode), `checkbox` (custom checkbox frame; without it the built-in frame is drawn). Defaults are the built-in SVGs, and no `checkbox`.

How to use `icons`:
- Each value is a component (`icons={{arrow: ChevronUp}}`), an element (`<img src=…/>`), or a URL string (rendered as `img.rac-icon`, `1em` high).
- Pass only the keys to change; `undefined` keeps the default.
- `null` or `false` turns the control off: no `clear` means no clear button and no Delete key; no `remove` means no chip delete button, no Backspace and no long-press delete mode; no `arrow` hides the arrows. No `check` leaves the checkbox empty; no `checkbox` keeps the built-in frame.
- Keep the object stable or inline; it is compared by its values like `texts`. A new component identity on every render (an inline arrow function) re-renders the Select.

### Styling and motion

| Prop | Type | Default | What it does |
|---|---|---|---|
| `className` | string | `''` | Extra class on the trigger (`.rac-select`). |
| `optionsClassName` | string | `''` | Extra class on the panel (`.rac-options`). |
| `style` | object | `{}` | Inline style of the trigger; its `--*` keys are copied onto the panel too. |
| `container` | element or `() => element` | `document.body` | Where the panel is portaled (a modal's element inside a focus trap). A function is called on every render of the panel. |
| `duration` | number (ms) | `300` | Drives every animation and CSS transition. |
| `easing` | string | `'ease'` | Drives every animation and CSS transition. |
| `offset` | number (px) | `1` | Gap between the trigger and the panel. |
| `animateOpacity` | boolean | `true` | The panel fades while it opens and closes. |
| `keepMounted` | boolean | `false` | The closed panel stays in the DOM, collapsed. |
| `ref` | ref | — | The trigger element (`.rac-select`). |

### Removed props

Passing one of them to `<Select/>` warns once in development and has no effect. `<OptGroup emptyGroupText>` is ignored without a warning.

| Old | New |
|---|---|
| `visibility` / `setVisibility` / `onOpen` / `onClose` | `open` / `onOpenChange` |
| `ownBehavior` | `open` without `onOpenChange` |
| `emptyText`, `disabledText`, `loadingText`, `errorText`, `clearText`, `removeText` | `texts.empty`, `.disabled`, `.loading`, `.error`, `.clear`, `.remove` |
| `loadButtonText`, `loadMoreText` | `texts.loadMore`, `texts.loadingMore` |
| `emptyOption`, `invalidOption`, `disabledOption` | `texts.emptyOption`, `.invalidOption`, `.disabledOption` |
| `<OptGroup emptyGroupText>` | `texts.emptyGroup` |
| `OpenIcon`, `ClearIcon`, `DelIcon`, `Checkmark`, `Checkbox` | `icons.arrow`, `.clear`, `.remove`, `.check`, `.checkbox` |
| `showDelete` | `deleteAlways` |
| `unmount` | `keepMounted` (inverted) |

Not yet: `selectedText` as a function, form reset.
