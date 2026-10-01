# Styling reference

Every class, state attribute and CSS variable of `react-animated-select`. This is the source for the styling section of the demo page.

## How overriding works

- All library styles live in `@layer rac`. Any ordinary (unlayered) CSS you write wins over them, whatever its specificity: `.rac-chip {border-radius: 1em}` is enough, no `!important`.
- If your app uses cascade layers itself, declare the library layer first: `@layer rac, app;`.
- Inside it, `rac.base` (`base.css`) is what the Select needs to work (layout, chip mechanics, panel scrolling, arrow rotation, checkmark reveal, cursors) and `rac.theme` (`theme.css`) is the default look (colors, borders, spacing, typography, color transitions, the delete mode shake). Restyling usually means overriding theme properties; override base ones knowingly.
- States are attributes, not modifier classes: `.rac-select[aria-expanded='true']`, `.rac-option[aria-selected='true']`.
- The options panel is a portal into `document.body`, outside your wrapper. Theme it with global selectors (`.rac-options`, `.rac-option`), or pass variables through the Select's `style` prop: its `--*` keys are copied onto the panel (`style={{'--rac-bg': '#222'}}`).
- `className` and `style` go to the root (`.rac-select`); `optionsClassName` goes to the panel (`.rac-options`).

## Classes

### Trigger

| Class | Element | What it is |
|---|---|---|
| `rac-select` | `div[role=combobox]` | The root. Border, background, padding, cursor. Carries every state attribute of the Select. `max-width: 100%` and `min-width: 0` (base): it grows with its content where your layout sizes it by content, never past its container. |
| `rac-value` | `div` | The value area: a wrapping flex row with the title or the chips. Its `min-height` (`--rac-row`) sets the trigger height. |
| `rac-title` | `div` | Placeholder, selected label or state text (`texts.loading`, `texts.error`, …). One line, truncated with an ellipsis when it is wider than the value area. |
| `rac-dots` | `span` > `i`×3 | The loading dots, after the title and in loading rows. Dots are `currentColor`. |
| `rac-clear` | `button` | The clear button (`icons.clear`), labelled by `texts.clear`. |
| `rac-arrow` | `div` | The arrow wrapper (`icons.arrow`). Rotated by CSS from the root state. |
| `rac-icon` | `img` | Any icon passed as a URL (any key of `icons`). `height: 1em`. |
| `rac-input` | `input` | Internal: the invisible form fields of `name` / `required`, stretched over the root so the browser's validation bubble points at the Select. Do not style it. |

### Chips (multiple mode)

| Class | Element | What it is |
|---|---|---|
| `rac-chip` | `div` | One selected value. Background, padding, margins, hover color, shake in delete mode. `touch-action: pan-y` (base): vertical page scrolling stays, horizontal moves are the chip's swipe. With `valueAsOption` it also gets the option's own `className` and `style`. `box-sizing: border-box` and at most the row width (base, `max-width: inherit` from its slot); set your own `max-width` to truncate chips earlier. |
| `rac-chip-text` | `span` | The chip's text label (not with `valueAsOption`). Shrinks with an ellipsis when the chip is wider than the row. |
| `rac-chip-del` | `button` | The chip's delete button (`icons.remove`), labelled `texts.remove` + name. An overlay by default, inline with `deleteInline` and in delete mode. `:disabled` while the Select is inactive (shown then only with `deleteAlways`). |
| `rac-chip-slot` | `div` | Internal: the animated slot around a chip, at most the row width. Style `.rac-chip` instead. |
| `rac-spacer` | `div` | Internal: a zero-height line break after a row end, present while chips animate and, with `deleteInline` (without `deleteAlways`), always (it keeps room for the inline delete button in every row). Do not style it; a `row-gap` on `.rac-value` adds one gap per break, so space chips with `.rac-chip` margins. |

### Panel and options

| Class | Element | What it is |
|---|---|---|
| `rac-options` | `div` (portal) | The floating panel. `z-index`, `box-sizing`; receives `optionsClassName`. |
| `rac-list` | `div[role=listbox]` | The scrolling list. Background, color, `max-height` (`--rac-list-max-height`), scrollbar. |
| `rac-option` | `div[role=option]` | One option row, and the auto-loading footer. Padding, highlight and selected colors (pointer hover sets the highlight; there is no `:hover` rule). |
| `rac-option-text` | `span` | The text label of a row. |
| `rac-option-jsx` | `div` | The wrapper of custom row content (`<Option>` children or `renderOption`). With `valueAsOption` the chip and the single-mode title wrap the same content in it, so `.rac-option-jsx, .rac-chip {…}` styles both. |
| `rac-check` | `div` | The checkbox of a row in multiple mode. A 1em frame by default (`data-default`). |
| `rac-checkmark` | icon | The check icon (`icons.check`), `1em` high, centered over the frame; fades and scales in when the row is selected. |
| `rac-check-icon` | icon | A custom `icons.checkbox` icon, at its own size. |
| `rac-group` | `div` | A group header. Bold, larger text; clicking (or Enter / Space while highlighted) toggles the group. |
| `rac-group-text` | `span` | The group name. |
| `rac-group-arrow` | `div` | The group arrow wrapper (`icons.arrow`). Rotated when the group is open. |
| `rac-group-items` | `div[role=group]` | The collapsible container of a group's options, labelled by its header. Indented. |

## State attributes

Valueless flags (`data-error`, …) are present or absent: select them with `[data-error]`.

| Attribute | On | Meaning |
|---|---|---|
| `aria-expanded='true'` | `rac-select` | The panel is open. |
| `aria-disabled='true'` | `rac-select` | `disabled`, or no options: the Select is inactive. Dimmed, not-allowed cursor, no hover. |
| `aria-busy='true'` | `rac-select` | `loading`, or a pending `loadMore`. A moving stripe at the bottom (`::after`, `rac-busy`), progress cursor (wait while also inactive). Still interactive. |
| `data-error` | `rac-select` | `error`. Red border (kept on hover). Still interactive while there are options. |
| `data-empty` | `rac-select` | No value: the title shows the placeholder (or another state text). |
| `data-placement='top'` / `'bottom'` | `rac-select`, `rac-options` | The side the panel opens on (known before opening). |
| `data-deleting` | `rac-select` | Touch delete mode: chips shake and show their delete buttons. |
| `data-inline-delete` | `rac-select` | `deleteInline`: delete buttons sit inside the chip instead of over it. |
| `data-bool='true'` / `'false'` | `rac-title`, `rac-option` | The value or option is a boolean. Green / red. |
| `aria-selected='true'` | `rac-option` | Selected. Together with `data-highlighted` it gets a stronger color. |
| `aria-disabled='true'` | `rac-option` | Disabled, or loading. Muted, not-allowed cursor. |
| `data-highlighted` | `rac-option` | Keyboard or pointer highlight. |
| `data-invalid` | `rac-option` | A value that could not be turned into a valid option. |
| `data-loading` | `rac-option` | The "load more" row and the loading footer (`loading` or auto-loading). Wait cursor, dots on the baseline. |
| `data-error` | `rac-option` | The error row at the end of the list (`error`), in place of the loading footer. Red, default cursor. |
| `data-default` | `rac-check` | No custom `icons.checkbox`: the built-in frame is drawn. |
| `data-open` | `rac-group` | The group is expanded. |
| `data-highlighted` | `rac-group` | Keyboard or pointer highlight of a header (a group with options, not disabled). Same tint as a highlighted option. |
| `data-disabled` | `rac-group` | The group is disabled. |

## Variables

Only values shared by several rules, read by JS or fed from a prop are variables. Everything else is a plain property: override it on the class.

Inputs (on `:root`; set them anywhere, for example on one Select through a class or `style`):

| Variable | Default | Used for |
|---|---|---|
| `--rac-bg` | `Canvas` + 2% `CanvasText` | Trigger and list background, trigger border; the base of every tint. |
| `--rac-fg` | `CanvasText` | Trigger and list text; the color of every tint. |
| `--rac-danger` | `#e7000b` | Error border and error row, `false` values, invalid options, chip delete colors, delete mode. |
| `--rac-success` | `#4caf50` | `true` values. |
| `--rac-row` | `2em` | Height of one row of the value area; chips are sized from it. |
| `--rac-list-max-height` | `250px` | List height limit, any length unit (registered with `@property`); also read by JS to decide whether the panel opens upward. |

Derived (on `.rac-select` and `.rac-options`, so they follow an `--rac-fg` / `--rac-bg` set on one Select; override them there too):

| Variable | Value | Used for |
|---|---|---|
| `--rac-tint-1` | 5% `--rac-fg` over `--rac-bg` | Trigger hover, scrollbar track. |
| `--rac-tint-2` | 10% | Chips, highlighted option, scrollbar thumb. |
| `--rac-tint-3` | 20% | Selected option, hovered chip. |
| `--rac-muted` | 55% | Disabled and loading options, disabled groups, the checkbox frame, the busy stripe. |
| `--rac-duration-fast` | `--rac-duration` × 0.5 | Chip and option background transitions. |

From props (inline on the root and the panel):

| Variable | Prop | Used for |
|---|---|---|
| `--rac-duration` | `duration` (`300`) | Every CSS transition. |
| `--rac-ease` | `easing` (`'ease'`) | Every CSS transition. |

The same two props drive the `Collapse`, FLIP and height animations. Under `prefers-reduced-motion: reduce`, `--rac-duration` becomes `1ms`, `Collapse` animations run with no duration, and the looping keyframes stop.

## Keyframes

| Name | Used by |
|---|---|
| `rac-blink` | `.rac-dots i` (base) |
| `rac-shake` | `.rac-chip` in delete mode (theme) |
| `rac-busy` | `.rac-select[aria-busy='true']::after`, the busy stripe (theme) |

All keep their own period (they loop, they are not transitions) and stop under reduced motion; the busy stripe then stays as a static line.

## Recipes

```css
/* rounded trigger that squares its bottom while open */
.rac-select {border-radius: 8px;}
.rac-select[aria-expanded='true'][data-placement='bottom'] {border-bottom-left-radius: 0; border-bottom-right-radius: 0;}

/* dimmed placeholder */
.rac-select[data-empty] .rac-title {opacity: 0.6;}

/* pill chips */
.rac-chip {border-radius: 999px; padding: 0 0.6em;}

/* no busy stripe, or your own indicator */
.rac-select[aria-busy='true']::after {content: none;}

/* taller trigger */
.rac-select {--rac-row: 2.75em;}

/* chips truncated at 12em instead of the row width */
.rac-chip {max-width: 12em;}

/* a trigger sized by its content, up to its container */
.toolbar {display: flex;}   /* the Select is a flex item: it grows, then truncates */

/* dark brand theme: every tint follows the two inputs */
/* className='brand' optionsClassName='brand' (the panel is a portal and inherits nothing from the trigger) */
.brand {--rac-bg: #1c1f26; --rac-fg: #8ab4ff;}
```

```jsx
// the same for one Select, trigger and panel
<Select style={{'--rac-bg': '#1c1f26', '--rac-fg': '#8ab4ff'}}/>
```

## Renamed in this version

| Before | Now |
|---|---|
| `rac-select-title-wrapper`, `rac-select-title`, `rac-title-container` | `rac-value` (one element) |
| `rac-title-text` | `rac-title` (the text is inside it directly) |
| `rac-loading-container`, `rac-loading-dots` | `rac-dots` |
| `rac-select-buttons` | removed (the buttons are root children) |
| `rac-select-cancel` | `rac-clear` (now a `<button>`) |
| `rac-select-arrow`, `--up`, `--open` | `rac-arrow` + `aria-expanded` / `data-placement` on the root |
| `rac-disabled-style`, `rac-loading-style`, `rac-error-style` | `aria-disabled`, `aria-busy`, `data-error` on the root |
| `rac-multiple-option` | `rac-chip-slot` |
| `rac-multiple-selected-option`, `--deleting-shake` | `rac-chip` + `data-deleting` on the root |
| `rac-multiple-del` | `rac-chip-del` (now a `<button>`) |
| `rac-select-list` | `rac-list` |
| `rac-select-option` | `rac-option` |
| `rac-selected`, `rac-highlighted` | `aria-selected`, `data-highlighted` |
| `rac-disabled-option`, `rac-invalid-option`, `rac-loading-option` | `aria-disabled`, `data-invalid`, `data-loading` |
| `rac-true-option`, `rac-false-option` | `data-bool='true'` / `'false'` |
| `rac-option-title`, `rac-loading-option-title` | `rac-option-text` |
| `rac-jsx-option` | `rac-option-jsx` |
| `rac-checkbox`, `rac-checkbox-default` | `rac-check` (+ `data-default`) |
| `rac-checkmark.--checked` | `rac-checkmark` inside `[aria-selected='true']` |
| `rac-check-box` | `rac-check-icon` |
| `rac-group-header`, `rac-disabled-group` | `rac-group` (+ `data-disabled`, `data-open`) |
| `rac-group-title-text` | `rac-group-text` |
| `rac-group-arrow.--open` | `rac-group-arrow` inside `[data-open]` |
| `rac-group-container` | `rac-group-items` |
| `rac-collapse`, `rac-collapse-x` | removed |
| `rac-del-spacer`, keyframe `rac-expand`, `--del-width` | removed (the inline delete room is now kept by `rac-spacer` row breaks) |
| `rac-select-selected`, `rac-group-option` | removed (were unused) |
| `select.css` | `base.css` + `theme.css` (`@layer rac.base`, `@layer rac.theme`) |
| `--rac-hover` | `--rac-tint-1` (derived from `--rac-fg` / `--rac-bg`) |
| `--rac-check-size` | removed (the frame and the mark are `1em`; set `width`/`height` on `.rac-check[data-default]`, `height` on `.rac-checkmark`) |
| `style` keys → `--rac-*` on the panel (`fontSize` → `--rac-font-size`) | only `--*` keys are copied |

Removed variables: every `--rac-select-*`, `--rac-list-*` (except `--rac-list-max-height`), `--rac-option-*`, `--rac-group-*`, `--rac-multiple-*`, `--rac-checkbox-*`, `--rac-dots-*`, `--rac-title-*`, `--rac-scroll-*`, `--rac-*-option-color`, `--rac-disabled-*`, `--rac-arrow-height`, `--rac-cancel-height`, `--rac-duration-base`, `--rac-duration-slow`. `--rac-muted` is now derived. `--rac-base-red` / `-green` became `--rac-danger` / `--rac-success`; `--rac-base-yellow` is gone (unused). Set the property on its class instead.
