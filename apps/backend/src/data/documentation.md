<!-- synced: react-animated-select@0.8.1 -->
# React Animated Select: usage reference (version 0.8.1)

## Install and imports
- `npm install react-animated-select`. Peer dependencies: `react` and `react-dom` 19.2 or newer. No other dependencies.
- Exports, all from the package root: `Select`, `Option`, `OptGroup`, `defineOption`, and the plugins `chips` and `paging`. TypeScript types ship with the package (`SelectProps`, `OptionProps`, `OptGroupProps`, `SelectTexts`, `SelectIcons`, `SelectPlugin`).
- CSS: with ES imports the styles load automatically. With CommonJS (`require`) or a bundler that ignores CSS imports from packages, import once: `import 'react-animated-select/style.css'`.
- Works with SSR (Next.js App Router, Remix, renderToString) and hydrates without mismatch; every file starts with 'use client'. The options panel is not in the server HTML; it mounts after hydration.

## Basic usage
```jsx
import {Select, Option} from 'react-animated-select'
const [value, setValue] = useState(null)
<Select placeholder='Pick one' options={['A', {name: 'B', id: 2}]} value={value} onChange={setValue}>
    <Option id='c'>C</Option>
    <Option id='d' disabled>D</Option>
</Select>
```

## Options
- `options`: an array of primitives, objects, groups or a dictionary, merged with `<Option/>` / `<OptGroup/>` children. `childrenFirst` puts the JSX options first.
- Object fields: `id` or `value` (identity), `name` or `label` (text), `disabled`, `group` (group name). Text falls back along label, name, id, value.
- Groups: `{group: 'Fruits', options: [...]}` or `{name: 'Fruits', options: [...]}`, items with a `group` field, or `<OptGroup name='Fruits'>` with `<Option/>` children. Groups with the same name merge across sources. Groups can be disabled and collapsed; `groupsClosed` starts every group collapsed. Clicking a header (or Enter / Space) toggles it.
- A dictionary (plain object) uses its values as options; keys are ignored. An object with a key `name`, `label`, `id` or `value` is one option, one with `options` is a group.
- Per-option `className` / `style` exist only on `<Option/>` and `<OptGroup/>`, not on array items.
- Any data is safe: duplicates (`1, 1, 1`, equal objects), `NaN`, `null`, `''`, functions, circular objects never break the Select; a click selects exactly the clicked row. `null` / `''` show `texts.emptyOption`, a function shows `texts.invalidOption`. Give duplicates distinct `id`s if you need to know which one was picked.
- `<Option/>` props: `value`, `id`, `label`, `name`, `group`, `disabled`, `className`, `style`, children (any JSX).
- `<OptGroup/>` props: `name` (or `label` / `id` / `value`), `disabled`, `className`, `style`, `<Option/>` children.
- `<Option/>` inside your own wrapper component is ignored (dev warning). For reusable option components use `defineOption`: `const CountryOption = defineOption(({c}) => <Option value={c.code}>{c.flag} {c.name}</Option>)`, then `countries.map(c => <CountryOption key={c.code} c={c}/>)`. Its render function must be pure (no hooks).
- `renderOption={(item, {selected, disabled}) => <b>{item.name}</b>}` draws custom rows for array options. Keep it stable (`useCallback`) for large lists.
- `valueAsOption`: the title and the chips render the option's own content (JSX or `renderOption`) instead of its text. By default only the text is shown in the trigger.

## Value and onChange
- `onChange(value, ids)` fires on every commit: pick, uncheck, chip delete, clear, form reset. An array item is reported as given (an object stays the whole object); an `<Option/>` as its `value`, or its text without one. `ids` are the option ids.
- Clearing reports `null` (single) or `[]` (multiple). Picking the already selected option of a single Select only closes the list, with no `onChange`.
- Controlled: `value` + `onChange`. Uncontrolled: `defaultValue`. `defaultValue` is also the target of a form reset in both modes, so a controlled Select may pass it too, only for the reset. Pick one mode, like a React input: `undefined` means uncontrolled, so clear a controlled Select with `null` / `[]`, never `undefined`. Switching between defined and `undefined` warns in development. A `value` without `onChange` makes the Select read-only (dev warning).
- A controlled value must have the shape of its source (the object from the array, or the `<Option/>` value). A value without a matching option is still shown.
- `multiple`: multiple choice with checkboxes; the value is an array. Without the `chips` plugin the picked labels show as comma-separated text that wraps onto new rows.

## Plugins (since 0.8)
- `import {Select, chips, paging} from 'react-animated-select'`, then `plugins={[chips]}`, `plugins={[paging]}` or both. An inline array is fine (compared by value). An unused plugin is not bundled (JS and CSS). The list may change at runtime: toggling `chips` morphs chips into text labels and back without a layout jump.
- `chips`: in `multiple` mode the selected values become animated chips with delete buttons. `deleteInline`: the delete button sits inside the chip instead of over its end. `deleteAlways`: the delete button is always visible instead of on hover. On touch: swipe left reveals a chip's delete button, a long press enters delete mode (chips shake, a tap removes one, Android vibrates).
- `paging`: async loading with `hasMore`, `loadMore`, `loadButton`, `loadOffset`, `loadAhead`. Without the plugin these props do nothing and warn in development.
- Migrating to 0.8: chips need `plugins={[chips]}`; `hasMore` / `loadMore` / `loadButton` need `plugins={[paging]}`; `deleteInline` / `deleteAlways` without `chips` warn.
- Sizes (min / gzip): core 37.5 / 14.4 KB JS; chips +9.5 / +3.3 KB JS and +2 KB CSS; paging +1 KB.

## All Select props
Every prop is optional. Any `aria-*` and `data-*` prop is forwarded to the root element.

Data and value:
- `options` (array or object, `[]`), `children` (`<Option/>`, `<OptGroup/>`, `defineOption` components), `value`, `defaultValue`, `onChange` (`(value, ids) => void`), `multiple` (`false`), `plugins` (`[]`), `childrenFirst` (`false`), `groupsClosed` (`false`).

State and behaviour:
- `disabled` (`false`): not interactive like a native disabled select; the value stays visible.
- `loading` (`false`): busy stripe at the bottom of the trigger (`aria-busy`), a loading row in the list, title `texts.loading` when there is no value. The Select stays usable while it has options.
- `error` (`false`): red border (`data-error`), an error row `texts.error` at the end of the list, title `texts.error` when there is no value. Still usable while it has options.
- An empty option list makes the Select inactive (cannot open), whatever the status.
- `open` (boolean): controlled open state. Without `onOpenChange`, only you open and close it. An outside toggle button should have `onMouseDown={e => e.preventDefault()}` so the Select does not close on blur first.
- `onOpenChange` (`(open) => void`): every open and close, in both modes; never on mount.
- `popup` (`true`): `false` makes a tag list: no panel, `role="group"`, never opens, no arrow; chip deletion and clear keep working.
- `onFocus`, `onBlur` (focus entering / leaving the Select as a whole, list included), `onKeyDown` (runs before the Select handles a key; `event.preventDefault()` makes the Select skip that key, so keys can be turned off or remapped).

Form:
- `id` (id of the root), `name` (submits the value with the form: one field per value in multiple mode, objects as JSON), `form` (id of the owner form, like `<select form="id">`), `required` (`false`: an empty Select blocks the submit with the browser's bubble).

Async loading (`paging` plugin):
- `hasMore` (`false`): more pages exist. `loadMore` (`() => void | Promise`): loads the next page; a returned Promise unlocks the next load when it settles (success or failure). `loadButton` (`false`): a "Load more" row instead of loading on scroll. `loadOffset` (`100` px): how close the end of the list must come to load; a short list loads until it fills. `loadAhead` (`3`): keyboard highlight distance from the end that triggers a load.

Content:
- `placeholder` (`'Choose option'`): title without a value; also the accessible name unless `aria-label` / `aria-labelledby` is set.
- `selectedText` (string): with any value, replaces the title and the chips with this text (for example 'Filters applied').
- `texts` (object): every other string; pass only the keys to change.
- `renderOption`, `valueAsOption` (`false`): see Options.
- `icons` (object): `arrow`, `clear`, `remove`, `check`, `checkbox`.
- `deleteInline` (`false`), `deleteAlways` (`false`): chip delete button placement and visibility (`chips` plugin).

Styling and motion:
- `className` (`''`, on the root `.rac-select`), `optionsClassName` (`''`, on the panel `.rac-options`), `style` (`{}`, inline style of the root; its `--*` keys are copied onto the panel), `container` (element or `() => element`, default `document.body`: where the panel is portaled, for example a modal inside a focus trap).
- `duration` (`300` ms) and `easing` (`'ease'`) drive every animation and CSS transition; `duration={0}` turns animations off. `offset` (`1` px): gap between the trigger and the panel. `animateOpacity` (`true`): the panel fades while opening and closing. `keepMounted` (`false`): the closed panel stays in the DOM, collapsed. `ref`: the root element.

## texts keys and defaults
`empty` 'No options', `disabled` 'Disabled', `loading` 'Loading', `error` 'Failed to load', `clear` 'Clear selection' (clear button label), `remove` 'Remove' (chip delete label prefix), `loadMore` 'Load more', `loadingMore` 'Loading', `emptyOption` 'Empty option', `invalidOption` 'Invalid option', `disabledOption` 'Disabled option', `emptyGroup` 'Empty group', `groupOpen` 'expanded', `groupClosed` 'collapsed', `list` 'Options' (listbox label), `required` (browser's own bubble text). Live region texts take a template or a function `(value) => string` for plural forms: `removed` 'Removed {label}', `cleared` 'Selection cleared', `selected` '{n} selected', `loaded` '{n} more options loaded'.
Example: `texts={{empty: 'Nothing here', loading: 'Loading…'}}`. For a whole locale keep one object in a module and pass it to every Select.

## icons
- Each key takes a component (`icons={{arrow: ChevronDown}}`), an element (`<img src=…/>`) or a URL string (rendered as `img.rac-icon`, 1em high). Defaults are built-in SVGs; the arrow icon points up and CSS rotates it.
- `null` or `false` turns a control off: no `clear` = no clear button and no Delete key; no `remove` = no chip delete button, no Backspace and no long-press delete mode; no `arrow` hides the arrows. `checkbox` replaces the built-in checkbox frame.

## Keyboard and accessibility
- Focus (click or Tab) opens the list. Enter / Space select, ArrowUp / ArrowDown move (skipping disabled options and collapsed groups), PageUp / PageDown jump by ten, Home / End go to the ends, typing letters jumps to a matching option (typeahead). Escape closes (or leaves touch delete mode), Tab closes and moves on, Delete clears, Backspace removes the last chip (or clears a single value).
- The root is an ARIA combobox with a listbox (`aria-expanded`, `aria-activedescendant`, `aria-required`, `aria-busy`). Name it with `aria-label` or `aria-labelledby`; a `<label htmlFor>` cannot name it. A polite live region announces removed chips, clearing, multiple picks, loaded pages and errors (texts in `texts`). While `error` is on, `aria-describedby` points at the error text.

## Forms
- With `name` the Select submits with its form like a native select. `form.reset()`, a reset button, React 19 `<form action>` and `requestFormReset()` bring it back to `defaultValue` (or empty) and call `onChange`, in controlled mode too. It resets one task after native fields.
- Inside `<fieldset disabled>` it is disabled like with `disabled`. After a failed validation an empty `required` Select gets `data-invalid` and `aria-invalid="true"` (red border) until a pick or a reset; `texts.required` sets the bubble text.

## Common recipes
- Multiple with chips: `<Select multiple plugins={[chips]} options={tags} value={picked} onChange={setPicked}/>`.
- Infinite list: `<Select plugins={[paging]} options={items} hasMore={hasMore} loadMore={() => fetchNext()} loading={busy}/>`; add `loadButton` for a "Load more" row.
- Inside a modal with a focus trap: `container={() => modalRef.current}`.
- Clear button off: `icons={{clear: null}}`. Faster animations: `duration={150}`.
- Only show and prune tags, never open: `popup={false}`.

## Removed props (since 0.7.5: no effect, a dev warning)
`visibility` / `setVisibility` / `onOpen` / `onClose` → `open` / `onOpenChange`; `ownBehavior` → `open` without `onOpenChange`; `unmount` → `keepMounted` (inverted); `showDelete` → `deleteAlways`; `OpenIcon`, `ClearIcon`, `DelIcon`, `Checkmark`, `Checkbox` → `icons.arrow`, `.clear`, `.remove`, `.check`, `.checkbox`; `emptyText`, `disabledText`, `loadingText`, `errorText`, `clearText`, `removeText` → `texts.empty`, `.disabled`, `.loading`, `.error`, `.clear`, `.remove`; `loadButtonText`, `loadMoreText` → `texts.loadMore`, `texts.loadingMore`; `emptyOption`, `invalidOption`, `disabledOption` → `texts.emptyOption`, `.invalidOption`, `.disabledOption`; `<OptGroup emptyGroupText>` → `texts.emptyGroup`.

## Not available yet
Search / filtering input, a virtualized list, drag-to-reorder chips, per-role animation presets, `selectedText` as a function. These are planned, not released.
