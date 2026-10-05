# Styling reference

Every class, state attribute and CSS variable of `react-animated-select`. This is the source for the styling section of the demo page.

## How overriding works

- All library styles live in `@layer rac`. Any ordinary (unlayered) CSS you write wins over them, whatever its specificity: `.rac-chip {border-radius: 1em}` is enough, no `!important`.
- If your app uses cascade layers itself, declare the library layer first: `@layer rac, app;`.
- Inside it, `rac.base` (`base.css`) is what the Select needs to work (layout, chip mechanics, panel scrolling, arrow rotation, checkmark reveal, cursors) and `rac.theme` (`theme.css`) is the default look (colors, borders, spacing, typography, color transitions, the delete mode shake). Restyling usually means overriding theme properties; override base ones knowingly.
- The chip rules (both layers, every `rac-chip*` class, `rac-spacer`, the `data-deleting` / `data-inline-delete` chip styling and `rac-shake`) are in `chip.css`, which ships with the `chips` plugin: a bundle without `chips` has no chip CSS. The combined `style.css` of the package still contains everything.
- States are attributes, not modifier classes: `.rac-select[aria-expanded='true']`, `.rac-option[aria-selected='true']`.
- The options panel is a portal into `document.body`, outside your wrapper. Theme it with global selectors (`.rac-options`, `.rac-option`), or pass variables through the Select's `style` prop: its `--*` keys are copied onto the panel (`style={{'--rac-bg': '#222'}}`).
- `className` and `style` go to the root (`.rac-select`); `optionsClassName` goes to the panel (`.rac-options`).

## Classes

### Trigger

| Class | Element | What it is |
|---|---|---|
| `rac-select` | `div[role=combobox]` | The root. Border, corner radius (`--rac-radius`), background, padding, cursor. Carries every state attribute of the Select. `max-width: 100%` and `min-width: 0` (base): it grows with its content where your layout sizes it by content, never past its container. |
| `rac-value` | `div` | The value area: a wrapping flex row with the title, the picked labels or the chips. Its `min-height` (`--rac-row`) sets the trigger height. `box-sizing: border-box` (base): a padding you add stays inside that height. |
| `rac-title` | `div` | Placeholder, selected label or state text (`texts.loading`, `texts.error`, …). One line, truncated with an ellipsis when it is wider than the value area. |
| `rac-pick` | `span` | Multiple mode without the `chips` plugin: one per picked label, in the wrapping `rac-value` row. One line each, truncated with an ellipsis when wider than the row. Fades in; leaves by fading and closing its width and end margin. While picks are shown, `.rac-value` gets a block padding of `(--rac-row − 1lh) / 2` so the first row stays where the title was. Theme: a `0.3em` end margin and a `,` (`::after`) on every pick; on the last one (`data-last`) the comma fades to `opacity: 0` over `--rac-duration`. `.rac-pick::after {content: none}` removes the comma. While the `chips` plugin is toggled at runtime, the chip labels also carry `rac-pick` for the morph (`data-plain`), so your pick styles shape that animation too. |
| `rac-dots` | `span` > `i`×3 | The loading dots, after the title and in loading rows. Dots are `currentColor`. |
| `rac-clear` | `button` | The clear button (`icons.clear`), labelled by `texts.clear`. |
| `rac-arrow` | `div` | The arrow wrapper (`icons.arrow`). Rotated by CSS from the root state. |
| `rac-icon` | `img` | Any icon passed as a URL (any key of `icons`). `height: 1em`. |
| `rac-input` | `input` | Internal: the invisible form fields of `name` / `required`, stretched over the root so the browser's validation bubble points at the Select. Without `name` and `required` there is one `hidden` field (the form anchor, for reset). Do not style it. |
| `rac-live` | `div` | Internal: the visually hidden live region (announcements) and the error text for `aria-describedby`, a sibling right after the root, rendered on the client only. Keep it visually hidden; `display: none` would silence it. |

### Chips (multiple mode, `chips` plugin, `chip.css`)

| Class | Element | What it is |
|---|---|---|
| `rac-chip` | `div` | One selected value. Background, padding, margins, corner radius (half of `--rac-radius`), hover color, shake in delete mode. `touch-action: pan-y` (base): vertical page scrolling stays, horizontal moves are the chip's swipe. With `valueAsOption` it also gets the option's own `className` and `style`. `box-sizing: border-box` and at most the row width (base, `max-width: inherit` from its slot); set your own `max-width` to truncate chips earlier. |
| `rac-chip-text` | `span` | The chip's text label (not with `valueAsOption`). Shrinks with an ellipsis when the chip is wider than the row. |
| `rac-chip > rac-option-jsx` | `div` | With `valueAsOption`: the chip's rich content. `min-width: 0; overflow-x: clip` (base): it shrinks with the chip and is clipped without an ellipsis, so the delete button stays inside the chip. |
| `rac-chip-del` | `button` | The chip's delete button (`icons.remove`), labelled `texts.remove` + name. An overlay by default, inline with `deleteInline` and in delete mode. `:disabled` while the Select is inactive (shown then only with `deleteAlways`). Its end corners inherit the chip's (theme), so the overlay background follows a rounded chip; round `.rac-chip` and the button follows. |
| `rac-chip-slot` | `div` | Internal: the animated slot around a chip, at most the row width. Style `.rac-chip` instead. |
| `rac-spacer` | `div` | Internal: a zero-height line break after a row end, present while chips animate and, with `deleteInline` (without `deleteAlways`), always (it keeps room for the inline delete button in every row). Do not style it; a `row-gap` on `.rac-value` adds one gap per break, so space chips with `.rac-chip` margins. |

**Touch targets.** Under `@media (any-pointer: coarse)` (base), `.rac-clear::before` and `.rac-chip-del::before` are transparent, absolutely positioned hit areas: each axis is padded up to 24×24 px around the button's centre (`inset: min(0px, 50% - 12px)`), and the layout does not change. `.rac-clear` gets `position: relative` and `.rac-arrow` `pointer-events: none` there. For a larger area override `inset`, e.g. `min(0px, 50% - 22px)` for 44 px (it may then overlap neighbouring buttons and chip rows).

### Panel and options

| Class | Element | What it is |
|---|---|---|
| `rac-options` | `div` (portal) | The floating panel. Corner radius (`--rac-radius`, theme); `z-index`, `box-sizing`, `overflow: clip` (base: a `border-radius` on it rounds the list, its scrollbar and the highlighted first or last option, at rest as during the open animation); receives `optionsClassName`. |
| `rac-list` | `div[role=listbox]` | The scrolling list. Background, color, `max-height` (`--rac-list-max-height`), scrollbar. |
| `rac-option` | `div[role=option]` | One option row, and the auto-loading footer. Padding, highlight and selected colors (pointer hover sets the highlight; there is no `:hover` rule). |
| `rac-option-text` | `span` | The text label of a row. |
| `rac-option-jsx` | `div` | The wrapper of custom row content (`<Option>` children or `renderOption`). With `valueAsOption` the chip and the single-mode title wrap the same content in it, so `.rac-option-jsx, .rac-chip {…}` styles both. |
| `rac-check` | `div` | The checkbox of a selectable row in multiple mode (not on disabled options, group headers or the "Load more" row). A 1em frame by default (`data-default`). |
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
| no `aria-haspopup` | `rac-select` | `popup={false}` (a tag list, `role='group'`): select with `.rac-select:not([aria-haspopup])`. Default cursor in base, no hover tint in the theme (its hover rules require `[aria-haspopup]`). |
| `aria-disabled='true'` | `rac-select` | `disabled`, an ancestor `<fieldset disabled>`, or no options: the Select is inactive. Dimmed, not-allowed cursor, no hover. |
| `aria-invalid='true'` | `rac-select` | Same moment as `data-invalid` (or passed by the consumer). Prefer `[data-invalid]` in CSS. |
| `aria-busy='true'` | `rac-select` | `loading`, or a pending `loadMore`. A moving stripe at the bottom (`::after`, `rac-busy`), progress cursor (wait while also inactive). Still interactive. |
| `data-error` | `rac-select` | `error`. Red border (kept on hover). Still interactive while there are options. |
| `data-invalid` | `rac-select` | A `required` Select failed validation (a submit, `checkValidity()`, `reportValidity()`) and is still empty. Red border like `data-error`. Gone on a pick, back on clearing, removed by `form.reset()`. |
| `data-empty` | `rac-select` | No value: the title shows the placeholder (or another state text). |
| `data-placement='top'` / `'bottom'` | `rac-select`, `rac-options` | The side the panel opens on (known before opening, updated while the page scrolls). Written by JS, not rendered: missing before the first measurement and in SSR HTML, where it means `bottom`. |
| `data-offscreen` | `rac-options` | While open, a scroll container clips the trigger away completely (visible fraction 0); base fades the panel to 0 over `--rac-duration`, then `visibility: hidden`, so it catches no clicks. Removed at once when any part of the trigger is visible again (no fade back: the opacity follows `--rac-visible`). |
| `data-deleting` | `rac-select` | Touch delete mode: chips shake and show their delete buttons (styled in `chip.css`). |
| `data-inline-delete` | `rac-select` | `deleteInline`: delete buttons sit inside the chip instead of over it (styled in `chip.css`). |
| `data-last` | `rac-pick` | The last present pick (a leaving pick keeps its old value until it is gone). The theme fades its comma out. |
| `data-plain` | `rac-chip-slot > div` | Internal (`chips`): while the plugin is toggled at runtime, the chip is shown in the pick look. It loses the `rac-chip` class, its label becomes a `span.rac-pick`, and base gives it `display: flex`, no shrink and `max-width: inherit`. Style the morph through `.rac-pick`, not this flag. |
| `data-sep` | chip label | Internal (`chips`): a pick comma fading out when the plugin is turned on (see `--rac-sep`). |
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

Every `--rac-*` variable inherits like any custom property, so it may be set on any ancestor: `.checkout-form {--rac-row: 2.5em; --rac-fg: navy}` themes every Select inside that form. Two limits: the panel is a portal (into `document.body` or `container`), so it sees the variables of its own ancestors, not of the Select's; set panel variables on `:root`, on the `container`, or through the Select's `style` (its `--*` keys are copied onto the panel). The derived variables and the prop variables are declared again on `.rac-select` / `.rac-options` (and inline), so an ancestor value of those is overridden; set their inputs instead (`--rac-fg` / `--rac-bg`, or the `duration` / `easing` props). The `--rac-` prefix is reserved for the library: a page variable named `--rac-something` (a table's own `--rac-row`) silently changes every Select inside it, so name your own variables differently.

Inputs (on `:root`; set them anywhere, for example on one Select through a class or `style`):

| Variable | Default | Used for |
|---|---|---|
| `--rac-bg` | `Canvas` + 2% `CanvasText` | Trigger and list background, trigger border; the base of every tint. |
| `--rac-fg` | `CanvasText` | Trigger and list text; the color of every tint. |
| `--rac-danger` | `#e7000b` | Error border and error row, `false` values, invalid options, chip delete colors, delete mode. |
| `--rac-success` | `#4caf50` | `true` values. |
| `--rac-radius` | `0px` | Corner radius of the trigger and the panel (the panel clips, so the list and its first and last rows follow); chips get half of it, and the chip delete overlay follows the chip. A length with a unit (`0px`, not `0`). |
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

Written by JS (inline on the panel; read it, do not set it):

| Variable | Written when | Used for |
|---|---|---|
| `--rac-visible` | While open, a scroll container partly clips the trigger: the visible fraction of its height (`0`..`1`, three decimals); absent when fully visible. | Base `opacity` of `.rac-options` (`var(--rac-visible, 1)`): the panel fades in step with the trigger. With your own opacity, write `calc(var(--rac-visible, 1) * 0.9)` to keep it. |
| `--rac-sep` | Internal (`chips`): while the `chips` plugin is turned on at runtime, on a chip label whose pick comma is fading out, with `data-sep`; the computed `content` of the old `.rac-pick::after`. | `chip.css` base: `[data-sep]::after {content: var(--rac-sep)}`. Do not style it. |

## Keyframes

| Name | Used by |
|---|---|
| `rac-blink` | `.rac-dots i` (base) |
| `rac-shake` | `.rac-chip` in delete mode (theme, `chip.css`) |
| `rac-busy` | `.rac-select[aria-busy='true']::after`, the busy stripe (theme) |

All keep their own period (they loop, they are not transitions) and stop under reduced motion; the busy stripe then stays as a static line.

## Recipes

```css
/* rounded theme: trigger, panel (and with it the list), chips at half */
:root {--rac-radius: 8px;}

/* panel border: one rule, no variable; the radius rounds it too */
.rac-options {border: 1px solid var(--rac-tint-3);}

/* animated radius change (a theme switch): only the property list changes, durations and easing cycle from the theme */
.rac-select, .rac-chip {transition-property: background-color, border-color, opacity, border-radius;}

/* rounded trigger that squares its bottom while open */
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
