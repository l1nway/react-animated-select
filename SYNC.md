# Library sync

Things the demo found that must change in the library (`..`, `react-animated-select`). The fix belongs to the library repo, never to the site. The library session reads this file, fixes, and marks entries done.

Checked against: `0.7.5` (npm package == `../dist`, 2026-10-01).

## Entry format

```md
### <short title>
- **Kind:** bug | api | docs | styles | perf | a11y | idea
- **Seen in:** demo section or file
- **Library:** file in `../src` or doc-key in `../src/README.md`
- **Now:** what happens (steps if it is a bug)
- **Expected:** what should happen
- **Demo workaround:** none, or what the site does meanwhile (and where, so it can be removed)
```

Statuses: an entry sits in **Open** until the library ships the fix, then moves to **Done** with the version (`fixed in 0.7.6`). Once the demo is updated to that version and the workaround is removed, delete the entry.

## Open

### Controlled `open`: switching to or from `undefined` skips the menu animation
- **Kind:** bug
- **Seen in:** `dev/debug.jsx` (the `open` row: `undefined` / `false` / `true`)
- **Library:** `dropdown.jsx`, `useSelectModel.js` (open state, controlled vs uncontrolled); doc-key `options-panel`
- **Now:** switch `open` from `true` or `false` to `undefined` and back. The menu really opens and closes (state and DOM are right), but the open/close animation of the drop-down does not play. Only the animation is broken.
- **Expected:** the menu animates on every open and close, whatever the previous value of `open` was, including a switch between controlled and uncontrolled.
- **Demo workaround:** none. The demo remounts the Select by key when `open` flips between `undefined` and a boolean (`dev/debug.jsx`), so check the library without that key.

### Chip haptics: no `haptics` prop, a built-in default
- **Kind:** idea, api
- **Seen in:** `features/multiple.jsx` (the `sortable` row and the Made for Fingers note)
- **Library:** `FEATURES.md` "Reordering chips (drag), with haptics" (the Haptics bullet), `chip.jsx` (the delete-mode vibration)
- **Now:** the plan adds a `haptics` prop (`true`, `false` or `(kind) => void`). The name is misleading (it covers `navigator.vibrate`, not haptics in general) and a prop is not needed.
- **Expected:** no separate prop. Vibration is a default of the Select: a short pulse on entering delete mode (long press or swipe on a chip) and, once `sortable` ships, on pick-up, each slot crossed and drop, through `navigator.vibrate` where it exists. Only Android browsers have it, so only Android users feel it; iOS Safari has no web vibration. Drop the `haptics` prop and the host-API routing (Capacitor, Telegram) from the `FEATURES.md` plan; a host that needs its own API can wait for a real request.
- **Demo workaround:** the `sortable` row in the Multiple table is a disabled "In development" stub; the Made for Fingers note mentions Android-only vibration in one line.

### Array objects and `<Option/>` report different value shapes
- **Kind:** docs
- **Seen in:** `start.jsx` (Usage: Array / JSX tabs)
- **Library:** `model.js` (`normalizeItem`, `original`), `useSelectModel.js` (`commit`); doc-keys `option-model`, `selection-identity`; `FEATURES.md` "Options as JSX or data"
- **Now:** for `options={[{value: 'pro', label: 'Pro'}]}`, `onChange` reports the whole object; for `<Option value='pro'>Pro</Option>`, it reports `'pro'`. A controlled `value` taken from one source does not select the same option of the other: with `value = {value: 'pro', label: 'Pro'}` and JSX children, the title shows `Pro` (a virtual entry) and no row has `aria-selected`. `index.d.ts` types `value` and `onChange` as `any` and nothing in the public docs says which shape comes back.
- **Expected:** the shape is stated where consumers look (README / `index.d.ts` comment on `onChange`): array items are reported as given (the object), `<Option/>` as its `value`. Optional idea: a way to get `item.value` from object options, so data and JSX sources are interchangeable.
- **Demo workaround:** the Usage demo resets the value when the tab changes and says in its description which shape `onChange` receives.

### Every Select forces a synchronous layout on mount
- **Kind:** perf
- **Seen in:** mobile trace of the demo (CPU ×4): the `features` part mount, and the first screen
- **Library:** `useChipLayout.js` (`layout` → `followHeight`, run from the `[chips, reserve]` layout effect); doc-key `value-height`
- **Now:** on mount, each Select reads `value.offsetHeight` and `getComputedStyle(root).height` inside a layout effect, even a single Select without chips. `memo.value` is still `0`, so nothing animates, but the first read forces layout of the whole freshly committed tree inside the React commit task. Traced: 90–131 ms of forced Layout (1217 of 2080 objects) when `features` mounts (about 13 Selects), and the first full layout of the page when no earlier code reads geometry.
- **Expected:** no geometry reads on mount. The first `ResizeObserver` callback (already set up in the next effect) delivers the initial size after the browser's own layout; `followHeight` only needs a value once there is a previous height to animate from. The same goes for `restBreaks` when there are no chips.
- **Demo workaround:** none.

### A closed Select re-renders on scroll to flip its arrow
- **Kind:** perf
- **Seen in:** render count of the demo (React DevTools hook, unminified build, desktop wheel scroll of the whole page): the Selects of Usage, Forms and one more lazy section re-render while they cross the viewport edges, with no prop or state change on the site side (≈ 4 library commits per full scroll, each re-rendering the trigger, its arrow icon and the closed panel component)
- **Library:** `dropdown.jsx` (`useDropdownPosition`: the closed-state `IntersectionObserver` with thresholds `[0, 0.25, 0.5, 0.75, 1]` → `place()` → `store.set({upward})`), `trigger.jsx` (`useSyncExternalStore` on `positionStore.upward` → `data-placement`); doc-key `dropdown-position`
- **Now:** while closed, every threshold crossing calls `place()`, which reads `getComputedStyle(select)` (first time) and `getBoundingClientRect()` (a forced layout inside the observer callback). When `upward` flips, both `Trigger` and the closed `Dropdown` re-render through `useSyncExternalStore`, only to change the `data-placement` attribute; the trigger re-render also recreates the arrow icon element. A page with many closed Selects pays this on every scroll past them.
- **Measured:** JS CPU profile of one full wheel scroll on mobile (390 px, CPU ×4, every part mounted): `getBoundingClientRect` called from `place()` ← the closed-state `sync` is the top self-time entry of the whole scroll, 136 ms of forced layout (the next one, prism tokenizing for react-live, is 99 ms).
- **Expected:** no forced layout and no React render for a placement change of a closed Select. The `IntersectionObserver` entry already carries `boundingClientRect` and `rootBounds` computed by the browser without a forced layout: compute `upward` from them in the closed state instead of calling `place()`. Write `data-placement` straight to the trigger (and panel, if mounted) element (refs), or keep the store but subscribe only where the value is rendered while open; the closed `Dropdown` does not need `upward` at all. Fewer thresholds (only the ones where `spaceBelow < lastHeight` can change) would also cut the callbacks.
- **Demo workaround:** none.

### Open panel lags behind the trigger on mobile scroll
- **Kind:** bug
- **Seen in:** any demo on a phone (Usage, Features), open Select + fast swipe up and down
- **Library:** `dropdown.jsx` (`useDropdownPosition`: `position: fixed` panel, re-placed from a `scroll` listener); doc-keys `dropdown-position`, `options-panel`
- **Now:** on desktop the panel stays glued to the trigger. On mobile the page scrolls on the compositor thread, while `scroll` events and the `place` call run later on the main thread, so the fixed panel is drawn at its old viewport position for a frame or more and then catches up. A fast swipe makes the panel visibly trail the Select.
- **Expected:** the panel moves in the same frame as the trigger. When the portal container scrolls with the page (`document.body`), position the panel `absolute` in document coordinates (`rect + scrollX/scrollY`), so the compositor moves both together. Re-place from `scroll` only for nested scroll containers, or hoist the panel into the nearest scrolling ancestor.
- **Demo workaround:** none.

### No live region: selection changes are not announced
- **Kind:** a11y
- **Seen in:** `features/a11y.jsx` (the text promised `aria-live`; removed)
- **Library:** `trigger.jsx`, `dropdown.jsx`, `chip.jsx`; doc-keys `trigger`, `state-semantics`, `chip`
- **Now:** the Select has no `aria-live` region. A screen reader follows the highlight through `aria-activedescendant`, but nothing is announced when a chip is removed (button, Backspace, touch delete mode), when a value is cleared, when a multiple selection changes while the list stays open, when a page of `loadMore` arrives or fails, or when `error` turns on. The error is not linked with `aria-describedby` either.
- **Expected:** one visually hidden `aria-live='polite'` region per Select (rendered on the client only, so SSR stays stable) that announces short messages from `texts`: removed `<label>`, selection cleared, `<n>` selected, `<n>` more options loaded, the error text. Debounced, so a burst of changes reads as one message. Chip reordering (Planned) needs the same region.
- **Demo workaround:** none; the site no longer claims `aria-live`.

### Touch targets smaller than 24×24 px
- **Kind:** a11y
- **Seen in:** `features/multiple.jsx` (the text claimed "high-precision hit targets"; removed)
- **Library:** `base.css` (`.rac-clear`, `.rac-chip-del`: `padding: 0`), `theme.css` (`.rac-chip`: `min-height: calc(var(--rac-row) - 0.5em)`); doc-keys `chip`, `touch-delete`
- **Now:** with the default `--rac-row: 2em` and a 16px font, the chip delete button is about 16 × 24 px (icon width × chip height), the clear button about 16 × 16 px, the chip about 24 px high. There is no `@media (pointer: coarse)` rule, so phones get the same sizes. This is below WCAG 2.2 SC 2.5.8 (24 × 24 px minimum) and far below the platform guides (44 pt iOS, 48 dp Android).
- **Expected:** on coarse pointers the hit area of `.rac-clear` and `.rac-chip-del` grows to at least 24 × 24 px (better 44) without changing the layout, e.g. an absolutely positioned `::before` with a negative inset inside `@layer rac.base`, so neighbouring chips and rows do not move. Optionally a `--rac-hit` variable for the size.
- **Demo workaround:** none.

### Highlighted group header has no role
- **Kind:** a11y
- **Seen in:** `features/a11y.jsx` (keyboard demo with `groupsClosed`)
- **Library:** `optionList.jsx` (`GroupHeader`: a plain `div` with `id`, no `role`), `trigger.jsx` (`aria-activedescendant`); doc-keys `highlight`, `option-list`, `dom-ids`
- **Now:** group headers are on the keyboard path, so ArrowDown on a `groupsClosed` Select sets `aria-activedescendant` to a header. The header is a generic `div` directly inside the `role='listbox'` (not an `option`, not inside a `group`), and its open state exists only as `data-open`. A screen reader is told that the active descendant is an element that is not an option: depending on the reader it announces nothing, or only the text, and never that Enter opens or closes it. The user cannot tell a header from an option, nor whether the group is open.
- **Expected:** the active descendant is always an owned element with an option-like role and a name that carries the state, e.g. the header as `role='option'` with `aria-selected='false'` and its state in the accessible name or `aria-description` (`Engineering, collapsed, 4 options`), with translatable words in `texts`. `FEATURES.md` "Accessibility (ARIA combobox)" Limits mentions only the visual-only open state; it should also mention this until fixed.
- **Demo workaround:** none; the site does not claim headers are announced.

### `value` set back to `undefined` shows a stale internal value
- **Kind:** docs
- **Seen in:** `dev/debug.jsx` (the `value = undefined` button)
- **Library:** `useSelectModel.js` (`isControlled`, `commit`), `useSelect.js` (`initSelectState`); doc-keys `select-store`, `option-model`
- **Now:** `value={undefined}` makes the Select uncontrolled and it shows `internalValue`, which `commit` writes only while uncontrolled. Steps: controlled Select, set `value` to `undefined` (shows the placeholder), pick Azure (stored internally, `onChange` sets `value` again), pick Coral, set `value` to `undefined` again: the Select shows Azure, not Coral and not empty. No dev warning on the switch. `README` says switching `open` between controlled and uncontrolled is not supported, but says nothing about `value`; `FEATURES.md` "Controlled or uncontrolled" does not mention it either.
- **Expected:** document it next to the `open` note ("like a React input, pick one mode; clear a controlled Select with `null` / `[]`"), and optionally `warnOnce` in development when `value` or `open` switches between defined and `undefined` after mount, as React does for inputs.
- **Demo workaround:** none; the Debug hint under the outside buttons explains it and recommends `null` / `[]` to clear.

### A catalog change moves the selection between equal primitive duplicates
- **Kind:** docs
- **Seen in:** `features/safety.jsx` (duplicates set, remove an option above the selected one)
- **Library:** `model.js` (`normalizeItem` positional ids, `resolveSelection` hint), `useSelectModel.js` (`picked`); doc-keys `selection-identity`, `chip-keys`; `FEATURES.md` "Any data, never broken" Limits
- **Now:** options `[1, 1, 1]`, pick the second `1` (`picked = ['default-0-1']`). Remove the first `1` from `options`: ids are positional, so `default-0-1` is now the old third `1`; it matches the value, so the second row of the new list is selected instead of the first (the one the user picked). The same happens with equal strings, `true`, `NaN` and repeated JSX ids (`jsx-x~1`) when an item before them is removed or inserted. Objects are fine, because identity is tried over the whole list before the JSON match. The docs state only that an outside value change takes the first free duplicates; a catalog change with an unchanged value is not mentioned.
- **Expected:** the Limits of "Any data, never broken" and Selection Identity say that after the list itself changes, equal primitives are matched by position (the hint is a position), so consumers who add or remove items give duplicates distinct `id`s. Nothing else is possible for primitives without consumer ids.
- **Demo workaround:** none; the Safety description states the limit.

### Dictionary `options`: keys are dropped, and the shape is undocumented
- **Kind:** docs
- **Seen in:** `customization/content.jsx` (Custom Options, the dictionary note)
- **Library:** `model.js` (`normalizeOptions` → `collect`, the "bare object" branch: `Object.values(item)`); doc-key `option-model`; `FEATURES.md` "Options as JSX or data", Props `options`
- **Now:** a plain object without label keys is read as a dictionary, but only its values become options: `options={{usd: 'US Dollar', eur: 'Euro'}}` shows and reports `'US Dollar'`, and the keys are never used (not as value, id or `userId`). A dictionary that happens to have a key named `name`, `label`, `id` or `value` (or a `group` field) is silently read as one option or a group instead. The docs say only "or a dictionary", which most readers take as a `key → label` map.
- **Expected:** README Option Model and the `options` prop say exactly what a dictionary is (its values are the options, keys ignored) and the label-key gotcha. Optional idea: use the key as the option `id` / `userId`, so `onChange` ids carry it.
- **Demo workaround:** none; the Custom Options notes say that the keys are not used.

### Array options cannot carry a per-option `className` / `style`
- **Kind:** api
- **Seen in:** `customization/content.jsx` (Custom Options: the chip tint works in the `defineOption` tab only)
- **Library:** `model.js` (`normalizeItem` copies no `className` / `style`), `optionList.jsx`, `chip.jsx`, `trigger.jsx`; doc-key `option-content`
- **Now:** `<Option className style>` styles its row and, with `valueAsOption`, the chip and the title. The same fields on an array item (`{id: 'usd', name: 'US Dollar', className: 'usd', style: {...}}`) are ignored without a warning, so array data cannot style a row or its chip per option; `renderOption` can style only the content inside `.rac-option-jsx`.
- **Expected:** either array items honour `className` / `style` like `<Option/>` (rows, and chip and title with `valueAsOption`), or README Option Content and `FEATURES.md` say plainly that per-option `className` / `style` exist only on `<Option/>`.
- **Demo workaround:** none; the demo tints chips through `<Option style>` and says that the per-option fields come from `<Option/>`.

### Panel detaches from trigger when layout changes above or below
- **Kind:** bug
- **Seen in:** any demo with open Select on a page where the layout changes (content insert/remove, height animation, scroll position change)
- **Library:** `dropdown.jsx` (`useDropdownPosition`, `position: fixed` panel); doc-key `dropdown-position`
- **Now:** when the Select is open, if the layout above or below it changes (siblings are added/removed, heights animate, page reflows), the panel is not re-positioned. The trigger and the options list then diverge visually — the panel stays at the old viewport position while the trigger moves, causing the "floating" options to hover away from their trigger.
- **Expected:** the panel re-positions whenever the trigger's position in the viewport changes. This may require a MutationObserver on ancestors, a ResizeObserver on the trigger, or Pointer Events position tracking, depending on the source of the layout shift. The performance cost should be minimal (batch updates, debounce if needed).
- **Demo workaround:** none.

### Panel border-radius jitters on open
- **Kind:** bug
- **Seen in:** dropdown menu opens on any demo
- **Library:** `dropdown.jsx`, `base.css` (border-radius styles); doc-key `options-panel`
- **Now:** when the panel opens, it initially appears with the expected `border-radius`, but then when the first option is highlighted or the list renders, the border-radius visibly "jerks" or glitches, causing a layout shift. This suggests a CSS or layout conflict as the panel and its content interact.
- **Expected:** the panel's border-radius stays stable from open to list render without visual jitter or layout shifts.
- **Demo workaround:** none.

### Dynamic trigger icon that adapts direction before open
- **Kind:** api
- **Seen in:** any Select with a custom trigger icon / chevron
- **Library:** `trigger.jsx` (no API to detect where the panel will open), `dropdown.jsx` (position is computed only after mount)
- **Now:** the trigger chevron / arrow is static and always points in one direction. When the panel opens upwards (not enough space below), the icon should visually flip to point up, so it reflects the actual open direction. Today the position is computed only after the panel is mounted and visible, so the icon cannot anticipate the direction and the chevron points the "wrong" way.
- **Expected:** before the panel opens, the library should reactively (via a hook or CSS attribute) expose which direction it will open, based on the trigger's position, window height, and the panel's estimated height. This allows consumers to style `data-open-direction='up' | 'down'` on the trigger and rotate the icon without re-renders. The computation must be performant (throttled, measured once or cached), and must update when the viewport resizes or the trigger moves (e.g., scroll).
- **Demo workaround:** none; the demo uses a static chevron or rotates it only after open.

### `--rac-row` inherits from any ancestor, undocumented
- **Kind:** docs
- **Seen in:** `src/components/section.css` (site tables), Animations and Debug (a Select inside a table cell)
- **Library:** `:root {--rac-row: 2em}`, used as `min-height` of `.rac-value` and `.rac-chip`; `STYLES.md` variables table
- **Now:** a custom property named `--rac-row` on any ancestor (the site's tables used it for their own row height, 3.2em) silently changes the height of every Select inside it. The docs list the variable but do not say that it inherits and can be set on a wrapper.
- **Expected:** `STYLES.md` / README say that every `--rac-*` variable inherits and may be set on any ancestor (useful: theme a whole form), and warn that the `--rac-` prefix is reserved for the library.
- **Demo workaround:** the site variable is renamed to `--rac-table-row`.

### Form Field: `form.reset()`, `<fieldset disabled>` and `form` are not native
- **Kind:** api
- **Seen in:** `features/forms.jsx` (Native Forms, the Limits paragraph)
- **Library:** `trigger.jsx` (`FormField`), `useSelectModel.js` (`internalValue`, `commit`); doc-key `form-field`; `FEATURES.md` Forms Limits
- **Now:** Limits: `form.reset()` does not reset the Select (a `defaultValue` is not restored), so a reset button has to clear a controlled `value` itself. Like native controls, an empty single Select sends one empty field, an empty multiple Select sends nothing, and a `disabled` Select is neither sent nor validated. Found while checking the demo against 0.7.5:
  - React 19 `<form action={fn}>` resets the form after the action resolves. Native fields clear, an uncontrolled Select keeps its value, so the form shows a mixed state.
  - Inside `<fieldset disabled>` the hidden `input.rac-input` become disabled (the value is not sent, `required` is not checked), but the Select stays interactive and does not look disabled: the user picks a value that silently goes nowhere.
  - No `form` prop: a Select placed outside its `<form>` cannot join it by id, as `<select form='id'>` can.
  - The invalid state is not exposed: no `data-invalid` on the root after a failed submit, so styling needs `.rac-select:has(.rac-input:user-invalid)`, which is not documented. The bubble is the text input's one ("Please fill out this field") rather than the select's ("Please select an item in the list").
- **Expected:** native behaviour, so the Limits line can go. Implementation details:
  - **Reset.**
    - Owner: one listener per Select, not per input. Take the form from the first `input.rac-input` (`input.form`, which also resolves a `form='id'` attribute), not `closest('form')`.
    - Event: `reset` on that form, added in an effect with deps `[form, name, required]`, removed on cleanup. It fires before the browser restores the fields and is cancelable: skip if `e.defaultPrevented` (check it in a microtask, since a later listener may cancel).
    - Uncontrolled: set `internalValue` back to the mount-time `defaultValue` (store it in a ref at mount, as native `defaultValue` is the initial one), or empty (`null` / `[]`) without one. Clear the search text and close the panel.
    - Controlled: call `onChange` with the same value. Decide and document the reason argument (e.g. `'reset'`) if `onChange` has one. Native controlled React inputs ignore reset; here firing `onChange` is the useful choice, because the owner cannot see a reset otherwise. A Select whose value does not change (already empty or default) fires nothing.
    - Not needed: patching the inputs' `defaultValue`. React re-renders them from state after the reset.
    - Also covered: React 19 `<form action>` and `requestFormReset()` both call `form.reset()`, so they work without extra code.
    - Without `name` / `required` there is no input and no form link, so no reset. Document it: give a `name` to take part in a form.
  - **`<fieldset disabled>`.**
    - Detection: `input.matches(':disabled')` while the `disabled` prop is false. It handles the first `<legend>` exception and nested fieldsets correctly, unlike `closest('fieldset[disabled]')`.
    - Reactivity: at mount, collect the ancestor `fieldset`s of the root and watch each with one `MutationObserver` (`attributeFilter: ['disabled']`). There are few ancestors and the attribute rarely changes, so the cost is negligible. Re-collect when the Select remounts.
    - Effect: the result goes into the same state as the `disabled` prop: `data-disabled`, `aria-disabled`, no open, no chip delete, and the inputs stay disabled. The prop still wins when `true`.
    - Needs the root element even without `name`, so it should not depend on `FormField`.
  - **`form` prop.** A string passed as `form` to every `input.rac-input`. The reset listener follows it through `input.form`. Add it to `index.d.ts` (`form?: string`) and to the Props docs.
  - **Invalid state.**
    - Trigger: React `onInvalid` on the first input (the `invalid` event does not bubble). Set `data-invalid` on the root and `aria-invalid='true'` on the combobox.
    - Clear: on the next commit that makes the value valid, and on reset.
    - Styling: document `.rac-select[data-invalid]` (and meanwhile `.rac-select:has(.rac-input:user-invalid)`) in `STYLES.md`.
  - **Bubble text.** Optional `texts.required` ('Please select an item in the list.').
    - When set, call `setCustomValidity(texts.required)` on the first input while it is empty and `required`, and `setCustomValidity('')` as soon as it is filled or disabled.
    - Run it in a layout effect on `[empty, required, disabled, texts.required]`, otherwise the input stays invalid after a pick.
    - Note in docs: with a custom message `validity.valueMissing` becomes `customError`.
  - **Autofill.** Check whether Chrome autofill targets `input.rac-input` named like `country` / `email` (they are plain text inputs). If so, add `autoComplete='off'`.
  - **Docs.** README Form Field and `FEATURES.md` Forms describe reset, fieldset, `form`, `data-invalid`, `texts.required`. Remove the reset gotcha.
  - **Tests (sandbox).**
    - Reset: uncontrolled with and without `defaultValue`, controlled, multiple; a cancelled reset; React 19 action.
    - `fieldset` toggled while the Select is open.
    - `form='id'` outside the form.
    - `required` with a custom message: pick, then clear.
  - Until shipped, `FEATURES.md` / README Form Field list the `fieldset`, React 19 action and `:has(:user-invalid)` points.
- **Demo workaround:** none; the Forms section states the limits under the demo.

### Rich chip content overflows the chip instead of being clipped
- **Kind:** bug
- **Seen in:** `features/safety.jsx` (the option list editor: `multiple valueAsOption deleteAlways deleteInline`, `<Option>` children are `CodeBlock`s), 390 px
- **Library:** `base.css` (`.rac-chip`, no rule for `.rac-chip > .rac-option-jsx`); doc-keys `trigger-width` ("Rich content is clipped, not ellipsized"), `option-content`
- **Now:** `.rac-chip` is `max-width: inherit` (100% of the slot), but its `.rac-option-jsx` child is a flex item with the default `min-width: auto`, so wide content keeps its full width: it spills out of the chip's border, pushes the inline delete button past the end of the row and out of the Select. Text chips are fine (`.rac-chip-text` has `min-width: 0` and `overflow-x: clip`).
- **Steps:** 390 px viewport, Safety section, preset `broken values`: the chip `{"name":"Circular","self":"[Circular]"}` (and other long JSON chips) is wider than the Select; its code runs past the chip border, the delete button sits outside the Select's right edge.
- **Expected:** what the docs say: `.rac-chip > .rac-option-jsx {min-width: 0; overflow-x: clip}` in `rac.base`, so rich content is clipped at the chip edge and the delete button stays visible.
- **Demo workaround:** none, the overflow is shown as is. (`overflow: hidden` on the inner `pre` stays: it is the site's own `CodeBlock` scroll container, not a fix for this.)

### A display-only chip list still announces a combobox
- **Kind:** idea, api
- **Seen in:** `features/safety.jsx` (the option list editor: `open={false}` without `onOpenChange`, `icons.arrow: false`)
- **Library:** `trigger.jsx` (`Trigger`: `role='combobox'`, `aria-haspopup`, `aria-expanded`, `aria-controls`); doc-keys `trigger`, `select-behavior`
- **Now:** a Select used only for its chips (never opens, no arrow) works without hacks: chips animate (Chip Hold, FLIP), delete by button, Backspace, long press; clear by button and Delete. But it still is `role='combobox'` with `aria-haspopup='listbox'`, `aria-expanded='false'` and `aria-controls` pointing at a listbox that never exists, and the root keeps `cursor: pointer`. A screen reader user hears "combobox, collapsed" and Enter / arrows do nothing.
- **Expected:** decide whether a tag-list mode is supported. If yes, a documented way (for example a `readOnly`-like flag, or `open={false}` without `onOpenChange` meaning "no popup") that drops the popup ARIA and the pointer cursor, keeps chip deletion, and is listed in `FEATURES.md`. If not, say in the docs that the Select always is a combobox.
- **Smaller, independent step (cheap in the library, widens customization):**
  - Let the consumer override the trigger's ARIA: `role`, `aria-haspopup`, `aria-expanded`, `aria-controls` (and `aria-roledescription`), for example via passed-through props that win over the defaults, or a `trigger` props object. Today `Trigger` spreads the rest props (`attrs`) first and sets these after them (`trigger.jsx`, root `div`), so a consumer's `role` or `aria-*` is silently overwritten (only `aria-label` / `aria-labelledby` are honoured).
  - Let the consumer switch off the trigger's key handling (Enter, Space, arrows, Home/End, typeahead) separately from chip keys (Backspace / Delete), for example `keyboard={false}` or a `keys` map, so a never-opening Select does not swallow or ignore keys a screen reader user presses. A consumer `onKeyDown` is overwritten the same way while the Select is `active`, so there is no way to intercept keys either.
- **Demo workaround:** `.rac-safety-list {cursor: default}` and its hover reset (`.rac-safety-list.rac-select:not([aria-disabled='true']):hover` back to `--rac-bg`, since `theme.css` tints any active trigger on hover); the ARIA stays as is.

### Replacing the whole value grows the trigger by both chip sets at once
- **Kind:** bug
- **Seen in:** `features/safety.jsx` (the option list editor), switching the `broken values` / `duplicates` preset
- **Library:** `useChipLayout.js` (`freeze`, `ghostRows`, `followHeight`), `trigger.jsx` (`Presence` `hold`); doc-keys `chip-hold`, `value-height`
- **Now:** the preset switch replaces `value` (and the `<Option>` children) with an entirely new set of keys (`shapes-*` → `duplicates-*`). In one commit 15 chips leave and 17 enter. The hold ghost clones `.rac-value` with the leavers still at full width and the entering chips already grown, so the held rows (and the Value Height target) contain both sets: the trigger first grows to roughly the sum of both lists, then shrinks to the new one when the leavers unmount. On screen the Select balloons for the length of the chip animation.
- **Expected:** a full replace looks like a swap, not an addition: the root height goes from the old rows straight to the new ones. For example, leavers that are all removed in one change get out of the flow (or out of the ghost) once they start collapsing, or new chips enter only after the leavers' rows are released, or the ghost measures only the surviving and entering chips when no chip survives.
- **Demo workaround:** none. (A demo-side trick, index keys shared by both presets so chips are "kept" and only change content, would hide the bug and lose the enter/exit animation, so it is not used.)

### Check: `<Option group>` in the installed version
- **Kind:** docs
- **Seen in:** `features/grouping.jsx` (the fourth card "Option Group Prop" and `<Option id='cherry' group='Group 3'>` in the live Select)
- **Library:** `index.d.ts` (`OptionProps.group`), `model.js` (grouping by name)
- **Now:** `index.d.ts` declares `OptionProps.group` and `model.js` groups such options by name, but the demo did not verify that the installed package version supports it.
- **Expected:** on the next library update, check that `<Option group='...'>` really gathers options into the named group (also with the same name as an `OptGroup` or a `group` object). If it does not, remove the card and the live option.
- **Demo workaround:** none.

### `Collapse` / `Presence` are not exported
- **Kind:** idea, api
- **Seen in:** `components/slideDown.jsx` (height slide of Styling tables, Loading, Safety)
- **Library:** `motion.jsx`; doc-keys `collapse`, `presence`
- **Now:** the Select's own WAAPI height/width collapse (clip only while animating, reverse on interrupt, reduced motion, unmount on exit) is internal. A consumer who wants the same motion around the Select (a panel that reveals it, a list of Selects) has to copy the file or pull in framer-motion.
- **Expected:** optional public export (`import {Collapse} from 'react-animated-select'`) with a typed, documented subset of props (`in`, `axis`, `fade`, `duration`, `easing`, `unmountOnExit`, `onEntered`, `onExited`). Not urgent; only if it stays a stable contract.
- **Demo workaround:** `components/slideDown.jsx` is a trimmed copy of `Collapse` (y axis, no group, no presence, no config context). Replace it with the export once it ships.

### `Collapse`: an exit reversed back to open keeps its fill
- **Kind:** bug
- **Seen in:** porting `Collapse` to `components/slideDown.jsx` (found by reading the code, not reproduced in the library)
- **Library:** `motion.jsx`, `Collapse` (`play`, `finish`); doc-key `collapse`
- **Now:** an exit runs with `fill: 'both'`. When it is interrupted, the `running.reverse()` path plays it back to its first keyframe, which is the measured open size plus `overflow: hidden`. `finish()` on the shown side only clears `anim.current` and never cancels the animation, so the backwards fill keeps holding that frame. The element then stays at a fixed pixel height with clipping. Content that grows later (a group that loads, a font swap) gets clipped, and focus rings are cut. Steps: open a group, close it, reopen it before the exit ends, then let its content change height.
- **Expected:** once the element is shown, `finish()` cancels the finished animation, so the natural layout comes back. The demo port does `if (visibility) animation.cancel()`.
- **Demo workaround:** the port cancels the animation itself; nothing to remove later.

### `Collapse`: the target size misses child margins that collapse through
- **Kind:** bug
- **Seen in:** `components/slideDown.jsx` (the port), Styling reference tables: a Firefox recording showed the content below jumping in the last frame of the open; reproduced per frame in Edge (16 px). In the library it is found by reading the code, not reproduced.
- **Library:** `motion.jsx`, `Collapse` (`frame()`, `still`); doc-key `collapse`
- **Now:** `frame()` reads `getComputedStyle(el)` at rest, without the clip. On the y axis, when the element has no vertical padding or border, the margins of its first and last child collapse through it, so they are not part of its `height`. The animation then adds `overflow: hidden` (`still`), which makes the element a block formatting context. A BFC keeps those margins inside, so the content is taller than the measured target. An open ends short by the margin, and when the clip goes the margin pops out below: everything after it jumps by the margin in one frame. An exit starts from a box that suddenly holds the margin inside: same jump at its start. In the library this hits `.rac-group-items` (only inline padding) as soon as a consumer gives `.rac-option` or a nested group a vertical margin. The x axis is safe: horizontal margins never collapse.
- **Expected:** measure the box the animation renders: set `overflow: hidden` inline for the read and remove it right after (one extra style recalc, inside the layout read that already happens). The end then needs no correction: when the clip goes, the box loses the margin and the margin reappears just outside it. Remaining edge: a following sibling with its own `margin-top` collapses to `max(a, b)` at rest instead of `a + b`. Document it or accept it.
- **Demo workaround:** `slideDown.jsx` `measure()` does exactly that; it is the port's own code, nothing to remove later.

### No variables for the corner radius and the panel border
- **Kind:** idea, styles
- **Seen in:** `components/basic.css` (the site theme, also shown as the Styling "As styled" CSS)
- **Library:** `theme.css`, `base.css`; `STYLES.md` Variables ("Only values shared by several rules, read by JS or fed from a prop are variables")
- **Now:** a theme made only of variables covers colours (`--rac-bg`, `--rac-fg` and every derived tint). The other two things almost every theme sets are plain properties: rounded corners (`border-radius` on `.rac-select` and on `.rac-options`) and a panel border (`border` on `.rac-options`). The site theme is therefore two variables plus two plain rules. The list has no radius and the panel does not clip (`overflow: visible`), so with a radius on `.rac-options` the list background and a highlighted first or last option still draw square corners inside the rounded border, unless the consumer also styles `.rac-list`.
- **Expected:** decide whether the radius is a shared value. If yes, `--rac-radius` (default `0`) used by `.rac-select`, `.rac-options` and `.rac-list` (chips could derive from it), and optionally a panel border variable (default none). If not, add a "rounded theme" recipe to `STYLES.md` that lists every element to round.
- **Demo workaround:** `basic.css` sets `border-radius` and `border` as plain properties.

### Chip size change on `valueAsOption` toggle is not animated
- **Kind:** bug
- **Seen in:** `customization/content.jsx` (Custom Options: the `valueAsOption` toggle with `multiple`)
- **Library:** `chip.jsx`, `useChipLayout.js`; doc-keys `chip`, `chip-hold`, `value-height`
- **Now:** with `multiple` and chips selected, switching `valueAsOption` true/false changes what the chips render (text vs row content), so their size changes. The chips do not animate that change: they jump to the new size at once, and the trigger height follows abruptly.
- **Expected:** a chip whose content changes size animates its width and height like an added or removed chip does, and the Value Height follows.
- **Demo workaround:** none.

## Done

_None yet._
