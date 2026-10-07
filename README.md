# React Animated Select

A lightweight, high-performance, and fully customizable Select component for React. Featuring smooth CSS animations, accessible keyboard navigation, and flexible option rendering.

[![Docs](https://img.shields.io/badge/docs-documentation-blue?style=for-the-badge&logo=gitbook)](https://l1nway.github.io/react-animated-select/)

## Installation
```bash
npm install react-animated-select
```

Requires `react` and `react-dom` 19.2 or newer (peer dependencies).

### Basic Usage
```jsx
  import {Select, Option} from 'react-animated-select'
  import {useState} from 'react'
  
  function App() {
    const options = ['Option 1', {name: 'Option 2', id: 2}, 'Option 3']
    const [value, setValue] = useState(null)
    
    return (
      <Select
        placeholder='Pick an option'
        onChange={setValue}
        options={options}
        value={value}
      >  
        <Option id='4'>Option 4</Option>
        <Option id='5' disabled>Option 5</Option>
        <Option id='6' className='custom-style'>
          <b>Option 6</b> - Custom JSX
        </Option>
      </Select>
  )}
```

`onChange(value, ids)` reports an array item as given (an object stays the whole object) and an `<Option/>` as its `value` (its text without one).

### Controlled or uncontrolled

Pick one mode per Select, like a React input: pass `value` + `onChange` (controlled) or `defaultValue` (uncontrolled). Clear a controlled value with `null` (single) or `[]` (multiple), never `undefined`: `undefined` means uncontrolled, and switching `value` or `open` to or from `undefined` after mount warns in development. A `value` without `onChange` makes the Select read-only (also a development warning).

## Plugins

Chips and async loading are optional plugins. Import them from the package root and pass them as values:

```jsx
import {Select, chips, paging} from 'react-animated-select'

<Select multiple plugins={[chips]} options={tags} value={picked} onChange={setPicked}/>

<Select plugins={[paging]} options={items} hasMore={hasMore} loadMore={fetchNextPage}/>
```

- `chips`: selected values of a `multiple` Select become animated chips with delete buttons (`deleteInline`, `deleteAlways`), swipe and long-press delete on touch.
- `paging`: `hasMore`, `loadMore`, `loadButton`, `loadOffset`, `loadAhead` (infinite scroll or a "Load more" row).

A plugin you never import is not in your bundle, JS or CSS. An inline array (`plugins={[chips]}`) is fine: it is compared by value. The plugin list may change at runtime; in multiple mode, turning `chips` off or on morphs the chips into the comma-separated labels and back, without a layout jump.

Sizes (Vite consumer build, React external, minified / gzip):

| Import | JS | CSS |
|---|---|---|
| `{Select}` (core) | 39.5 / 15.6 KB | 6.4 / 1.8 KB |
| `+ chips` | +15.7 / +5.6 KB | +2.3 / +0.5 KB |
| `+ paging` | +1.5 / +0.5 KB | |

esbuild keeps every CSS file reachable from the package by design, so an esbuild build without `chips` still includes the chip CSS (about 2.3 KB); Rollup, Vite and webpack drop it.

## Migrating to 0.8

- **Chips need `plugins={[chips]}`.** Without it, a `multiple` Select shows the picked labels as comma-separated text that wraps onto new rows, each label fading in and out.
- **`hasMore` / `loadMore` / `loadButton` need `plugins={[paging]}`.** Without it they do nothing and warn in development.
- **`deleteInline` / `deleteAlways`** on a `multiple` Select without `chips` warn in development (they act on chips).
- **Styling:** in multiple mode without `chips`, each picked label is its own `.rac-pick`; `.rac-title` no longer holds the joined labels (see Styling).

## Props

Every prop is optional; a prop left `undefined` takes its default. Any `aria-*` and `data-*` prop is forwarded to the root element.

### Data and value

| Prop | Type | Default | Description |
|---|---|---|---|
| `options` | array or object | `[]` | Primitives, objects, groups (`{group, options}` / `{name, options}`) or a dictionary (its values are the options). Merged with `<Option/>` / `<OptGroup/>` children. |
| `children` | `<Option/>`, `<OptGroup/>`, `defineOption` components | | Options written as JSX. |
| `value` | any | | Controlled value (an array in multiple mode). See Controlled or uncontrolled. |
| `defaultValue` | any | | Initial value of an uncontrolled Select; also the target of a form reset. |
| `onChange` | `(value, ids) => void` | | Every commit: pick, uncheck, chip delete, clear, form reset. Clearing reports `null` (single) or `[]` (multiple). |
| `multiple` | boolean | `false` | Multiple choice with checkboxes. |
| `plugins` | `SelectPlugin[]` | `[]` | Optional features: `chips`, `paging`. |
| `childrenFirst` | boolean | `false` | JSX options before the `options` array. |
| `groupsClosed` | boolean | `false` | Every group starts collapsed. |

### State and behaviour

| Prop | Type | Default | Description |
|---|---|---|---|
| `disabled` | boolean | `false` | Not interactive, like a native disabled select; the value stays visible. |
| `loading` | boolean | `false` | Busy indicator and loading row; the Select stays usable while it has options. |
| `error` | boolean | `false` | Red border and an error row (`texts.error`); the Select stays usable while it has options. |
| `open` | boolean | | Controlled open state. Without `onOpenChange` only you open and close it. |
| `onOpenChange` | `(open) => void` | | Every open and close, in both modes; never on mount. |
| `popup` | boolean | `true` | `false`: no panel, a tag list. The root is `role="group"` without the combobox ARIA, never opens, has no arrow; chip deletion and clear keep working. |
| `onFocus` | `(event) => void` | | Focus entered the Select from outside. |
| `onBlur` | `(event) => void` | | Focus left the Select and its list. |
| `onKeyDown` | `(event) => void` | | Runs before the Select handles a key; `event.preventDefault()` makes the Select skip that key. |

### Form

| Prop | Type | Default | Description |
|---|---|---|---|
| `id` | string | | `id` of the root element. |
| `name` | string | | Submits the value with the form (one field per value in multiple mode; objects as JSON). |
| `form` | string | | Id of the owner `<form>`, like `<select form="id">`: submits and resets with it even when placed outside it. |
| `required` | boolean | `false` | An empty Select blocks the submit with the browser's validation bubble. |

### Async loading (`paging` plugin)

| Prop | Type | Default | Description |
|---|---|---|---|
| `hasMore` | boolean | `false` | More pages exist. |
| `loadMore` | `() => void \| Promise` | | Loads the next page; a returned Promise unlocks the next load when it settles. |
| `loadButton` | boolean | `false` | A "Load more" row instead of loading on scroll. |
| `loadOffset` | number (px) | `100` | How close the end of the list must come to view to load. |
| `loadAhead` | number | `3` | Keyboard highlight distance (in options) from the end that triggers a load. |

### Content

| Prop | Type | Default | Description |
|---|---|---|---|
| `placeholder` | string | `'Choose option'` | Title without a value; also the accessible name unless `aria-label` / `aria-labelledby` is set. |
| `selectedText` | string | | With any value, replaces the title (and the chips) with this text. |
| `texts` | object | see below | Every other string. Pass only the keys to change. |
| `renderOption` | `(item, {selected, disabled}) => ReactNode` | | Custom rows for array options. |
| `valueAsOption` | boolean | `false` | The title and the chips render the option's content instead of its text. |
| `icons` | object | built-in SVGs | `arrow`, `clear`, `remove`, `check`, `checkbox`: a component, an element or a URL; `null` / `false` turns that control off. |
| `deleteInline` | boolean | `false` | Chip delete button inside the chip instead of over it (`chips`). |
| `deleteAlways` | boolean | `false` | Chip delete button always shown instead of on hover (`chips`). |

### Styling and motion

| Prop | Type | Default | Description |
|---|---|---|---|
| `className` | string | `''` | Extra class on the root (`.rac-select`). |
| `optionsClassName` | string | `''` | Extra class on the panel (`.rac-options`). |
| `style` | object | `{}` | Inline style of the root; its `--*` keys are copied onto the panel too. |
| `container` | element or `() => element` | `document.body` | Where the panel is portaled (for example a modal inside a focus trap). |
| `duration` | number (ms) | `300` | Drives every animation and CSS transition. |
| `easing` | string | `'ease'` | Drives every animation and CSS transition. |
| `offset` | number (px) | `1` | Gap between the trigger and the panel. |
| `animateOpacity` | boolean | `true` | The panel fades while it opens and closes. |
| `keepMounted` | boolean | `false` | The closed panel stays in the DOM, collapsed. |
| `ref` | ref | | The root element. |

### `texts`

| Key | Default | Used for |
|---|---|---|
| `empty` | `'No options'` | Title without options |
| `disabled` | `'Disabled'` | Title of an empty disabled Select |
| `loading` | `'Loading'` | Title and row while `loading` |
| `error` | `'Failed to load'` | Title, error row and error description while `error` |
| `clear` | `'Clear selection'` | Clear button label |
| `remove` | `'Remove'` | Chip delete button label prefix |
| `loadMore` | `'Load more'` | "Load more" row |
| `loadingMore` | `'Loading'` | "Load more" row while loading, scroll footer |
| `emptyOption` | `'Empty option'` | An option without text |
| `invalidOption` | `'Invalid option'` | A function in `options` |
| `disabledOption` | `'Disabled option'` | A disabled object without a label |
| `emptyGroup` | `'Empty group'` | A group without a name |
| `groupOpen` / `groupClosed` | `'expanded'` / `'collapsed'` | State word in a group header's accessible name |
| `list` | `'Options'` | Listbox label |
| `required` | browser's own | Validation bubble of an empty `required` Select |
| `removed` | `'Removed {label}'` | Live region: chips removed |
| `cleared` | `'Selection cleared'` | Live region: value cleared |
| `selected` | `'{n} selected'` | Live region: multiple pick (`n` = total selected) |
| `loaded` | `'{n} more options loaded'` | Live region: a page loaded (`n` = new options) |

The live region texts take a template with `{label}` / `{n}`, or a function `(value) => string` for plural forms.

Props removed in 0.7.5 (`visibility`, `setVisibility`, `ownBehavior`, `onOpen`, `onClose`, `unmount`, `showDelete`, the `*Icon` / `Checkmark` / `Checkbox` props and the `*Text` props) have no effect and warn once in development; the TypeScript types name each replacement.

### Other exports

- `Option`: `value`, `id`, `label`, `name`, `group`, `disabled`, `className`, `style`, children (any JSX).
- `OptGroup`: `name` (or `label` / `id` / `value`), `disabled`, `className`, `style`, `<Option/>` children.
- `defineOption(render)`: makes a reusable option component that `<Select/>` reads as data. `render` must be pure (no hooks).

## Forms

- With `name`, the Select submits with its `<form>` (or the one named by `form`), like a native select.
- **Reset:** `form.reset()`, a reset button, a React 19 `<form action>` and `requestFormReset()` bring the Select back to `defaultValue`, or empty without one, and call `onChange`, in controlled mode too. A cancelled reset changes nothing. The Select resets one task after native fields, so a `FormData` read synchronously right after `form.reset()` still holds its old value.
- **`<fieldset disabled>`:** the Select is disabled like with the `disabled` prop (not submitted, cannot open), except inside the fieldset's first `<legend>`, as native fields.
- **Validation:** an empty `required` Select blocks the submit with the browser's bubble, pointing at the Select; `texts.required` replaces the bubble text. After a failed validation (a submit, `checkValidity()`, `reportValidity()`) the still-empty Select gets `data-invalid` and `aria-invalid="true"` (red border in the default theme) until a value is picked or the form is reset.

## Accessibility

- The root is an ARIA `combobox` with a `listbox` panel (`aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-required`, `aria-busy`). Name it with `aria-label` or `aria-labelledby` (a `<label htmlFor>` cannot name it); otherwise the placeholder is used. With `popup={false}` it is a `role="group"` instead.
- **Live region:** each Select has a visually hidden polite live region (rendered on the client only) that announces removed chips (`texts.removed`), a cleared value (`texts.cleared`), a multiple pick (`texts.selected`), a loaded page (`texts.loaded`) and the error (`texts.error`). Only changes made while focus is in the Select (or in touch delete mode) are announced; quick bursts read as one message. A single pick is not announced: the combobox reads its new value.
- While `error` is on, the root's `aria-describedby` points at the error text, joined with your own `aria-describedby`.
- `onKeyDown` runs before the Select's own key handling; `preventDefault()` turns a key off or lets you remap it.

## Styling

### Loading the CSS

With the ES build (`import`), the styles load automatically: the Select brings its own CSS and `chips` brings the chip CSS. With the CommonJS build (`require`), or a setup that ignores CSS imports from packages, import the combined stylesheet once (it contains everything, chip styles included):

```js
import 'react-animated-select/style.css'
```

### Cascade layers

All styles live in the cascade layers `@layer rac.base, rac.theme;`: `rac.base` is what the Select needs to work, `rac.theme` is the default look. Any unlayered CSS you write wins over them, whatever its specificity, so no `!important` is needed. If your app uses layers itself, declare the library first: `@layer rac, app;`.

### Variables

Every `--rac-*` variable inherits, so it may be set on any ancestor. The panel is a portal (into `document.body` or `container`), so it sees only its own ancestors: set panel variables on `:root`, on the `container`, or through the Select's `style` (its `--*` keys are copied onto the panel). The `--rac-` prefix is reserved for the library: do not name your own variables with it.

| Variable | Default | Used for |
|---|---|---|
| `--rac-bg` | `Canvas` + 2% `CanvasText` | Background; base of every tint |
| `--rac-fg` | `CanvasText` | Text; color of every tint |
| `--rac-danger` | `#e7000b` | Error and invalid border, error row, delete colors |
| `--rac-success` | `#4caf50` | `true` values |
| `--rac-radius` | `0px` | Corner radius of the trigger and the panel; chips get half of it, and the chip delete overlay follows the chip's end corners. A length with a unit (`0px`, not `0`). |
| `--rac-row` | `2em` | Height of one row of the value area |
| `--rac-list-max-height` | `250px` | Maximum list height |
| `--rac-visible` | (written by the Select) | The visible fraction (`0`..`1`) of a trigger partly clipped by a scroll container, on `.rac-options`; absent when fully visible. Read it, do not set it. |

The tints (`--rac-tint-1`..`3`, `--rac-muted`) are derived from `--rac-fg` / `--rac-bg` on `.rac-select` and `.rac-options`; `--rac-duration` and `--rac-ease` come from the `duration` and `easing` props.

Base sets `.rac-options {opacity: var(--rac-visible, 1)}`, so the panel fades with a partly clipped trigger. With your own opacity on `.rac-options`, write `calc(var(--rac-visible, 1) * 0.9)` to keep that fade.

```css
/* rounded trigger, panel and chips */
:root {--rac-radius: 8px;}

/* panel border (no variable): the radius rounds it too */
.rac-options {border: 1px solid var(--rac-tint-3);}
```

### Classes and state attributes

States are attributes, not modifier classes: `.rac-select[aria-expanded='true']`, `.rac-option[aria-selected='true']`.

- `.rac-select` (root): `aria-expanded`, `aria-disabled`, `aria-busy`, `data-error`, `data-empty`, `data-deleting`, `data-inline-delete`.
- `data-invalid` and `aria-invalid` on `.rac-select`: a `required` Select failed validation and is still empty (red border in the theme). Prefer `[data-invalid]` in CSS.
- `.rac-select:not([aria-haspopup])` selects a tag list (`popup={false}`); the theme's hover rules require `[aria-haspopup]`, so a tag list gets no hover tint.
- `data-placement='top'` / `'bottom'` on `.rac-select` and `.rac-options`: the side the panel opens on. It is written by JS, so it is missing before the first measurement and in server-rendered HTML; missing means `bottom`.
- `data-offscreen` on `.rac-options`: a scroll container clips the trigger away completely; the panel fades out over `--rac-duration`, then gets `visibility: hidden`. A partly clipped trigger keeps its panel attached to its visible edge and fades it in step (`--rac-visible`).
- `.rac-options` is `position: absolute` (in document coordinates) and `overflow: clip`, so a `border-radius` on it rounds the list too.
- `.rac-value` is `box-sizing: border-box`: a padding you add stays inside the `--rac-row` height.
- `.rac-pick` (`span`): in multiple mode without `chips`, one per picked label inside `.rac-value`, truncated with an ellipsis only when one label is wider than the row. The theme gives each pick a `0.3em` end margin and a `,` separator (`::after`), faded out on the last pick (`data-last`); `.rac-pick::after {content: none}` drops the separator. A removed pick fades and closes its width (the next labels slide back); a new one fades in. While `chips` is toggled at runtime, the chip labels carry `.rac-pick` too, so your pick styles shape that morph.
- Internal, do not style: `.rac-input` (the hidden form fields), `.rac-live` (the visually hidden live region, a sibling right after `.rac-select`, client only; `display: none` would silence it), and the `data-plain`, `data-sep` and `--rac-sep` of the chip morph.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 l1nway
