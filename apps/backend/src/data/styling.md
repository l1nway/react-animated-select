<!-- synced: react-animated-select@0.8.1 -->
# React Animated Select: styling reference (version 0.8.1)

## How overriding works
- All library styles live in the cascade layers `@layer rac.base, rac.theme;`. Any unlayered CSS you write wins over them whatever its specificity: `.rac-chip {border-radius: 1em}` is enough, no `!important`. If your app uses layers itself, declare the library first: `@layer rac, app;`.
- `rac.base` is what the Select needs to work (layout, chip mechanics, scrolling, arrow rotation, cursors); `rac.theme` is the neutral default look (colors, borders, spacing). Restyling means overriding theme properties.
- States are attributes, not modifier classes: `.rac-select[aria-expanded='true']`, `.rac-option[aria-selected='true']`.
- `className` and `style` go to the root `.rac-select`; `optionsClassName` goes to the panel `.rac-options`.
- The panel is a portal into `document.body` (or the `container` prop), outside your wrapper, so a parent selector like `.my-form .rac-option` does not reach it. Style it with global selectors, with `optionsClassName`, or with variables through the Select's `style` prop (its `--*` keys are copied onto the panel).
- Several Selects styled differently: give each its own `className` and `optionsClassName` (or `style` variables).
- CSS loads automatically with ES imports; with CommonJS import `react-animated-select/style.css` once. The chip CSS ships only with the `chips` plugin.

## DOM tree
```
div.rac-select [role=combobox]       root: className, style, ref, every state attribute
  div.rac-value                      value area: wrapping row, min-height = --rac-row
    div.rac-title                    placeholder, selected label or state text (+ span.rac-dots while loading)
    span.rac-pick (one per label)    multiple mode without chips
    div.rac-chip-slot > div.rac-chip multiple mode with the chips plugin
      span.rac-chip-text | div.rac-option-jsx
      button.rac-chip-del            chip delete button
    div.rac-spacer                   internal row break
  button.rac-clear                   clear button
  div.rac-arrow                      arrow wrapper
  input.rac-input                    internal hidden form fields
div.rac-live                         internal live region, sibling after the root
div.rac-options                      portal panel: optionsClassName
  div.rac-list [role=listbox]        scrolling list
    div.rac-option [role=option]
      span.rac-option-text | div.rac-option-jsx
      div.rac-check > .rac-checkmark | .rac-check-icon   multiple mode
    div.rac-group                    group header: span.rac-group-text, div.rac-group-arrow
    div.rac-group-items [role=group] the group's options
    div.rac-option [data-loading] | [data-error]   loading footer, "Load more" row, error row
```

## Classes
- `.rac-select`: root. Border, corner radius (`--rac-radius`), background, padding, cursor. `max-width: 100%; min-width: 0`: grows with content, never past its container.
- `.rac-value`: value area, a wrapping flex row; `box-sizing: border-box`, so added padding stays inside the `--rac-row` height.
- `.rac-title`: one line, truncated with an ellipsis. `data-bool='true'/'false'` for boolean values (green / red).
- `.rac-pick`: one picked label in multiple mode without chips. Theme: `0.3em` end margin and a `,` separator in `::after`; the last pick has `data-last`. `.rac-pick::after {content: none}` removes the commas.
- `.rac-dots` (`span` > `i`×3): loading dots, `currentColor`.
- `.rac-clear` (`button`), `.rac-arrow` (`div`, rotated from the root state), `.rac-icon` (`img` for an icon passed as a URL, `height: 1em`).
- Chips (`chips` plugin): `.rac-chip` (one value: background, padding, margin, half of `--rac-radius`, hover color, shake in delete mode; at most the row width, set `max-width` to truncate earlier), `.rac-chip-text` (label, ellipsis), `.rac-chip-del` (delete button: an overlay by default, inline with `deleteInline`; `:disabled` while the Select is inactive). `.rac-chip-slot` and `.rac-spacer` are internal: style `.rac-chip` instead, and space chips with `.rac-chip` margins, not `row-gap`.
- Panel: `.rac-options` (`position: absolute`, `overflow: clip`, so a `border-radius` rounds the list too; `z-index` in base), `.rac-list` (background, color, `max-height: var(--rac-list-max-height)`, thin scrollbar), `.rac-option` (row: padding, highlight and selected colors; there is no `:hover` rule, pointer hover sets `data-highlighted`), `.rac-option-text`, `.rac-option-jsx` (custom content; with `valueAsOption` the chip and title use it too, so `.rac-option-jsx, .rac-chip {…}` styles both).
- `.rac-check` (checkbox frame in multiple mode, 1em, `data-default` without a custom `icons.checkbox`), `.rac-checkmark` (the check icon, fades in on selected rows), `.rac-check-icon` (custom checkbox icon).
- Groups: `.rac-group` (header, bold and larger), `.rac-group-text`, `.rac-group-arrow`, `.rac-group-items` (indented container).
- Internal, do not style: `.rac-input`, `.rac-live` (keep it visually hidden; `display: none` silences it), `.rac-chip-slot`, `.rac-spacer`.

## State attributes
On `.rac-select`:
- `aria-expanded='true'`: open. `data-placement='top'|'bottom'` (also on `.rac-options`): side the panel opens on; missing before the first measurement and in SSR, meaning bottom.
- `aria-disabled='true'`: disabled, inside `<fieldset disabled>`, or no options. `aria-busy='true'`: `loading` or a pending `loadMore` (moving stripe in `::after`).
- `data-error`: `error`. `data-invalid` / `aria-invalid='true'`: a `required` Select failed validation and is still empty (prefer `[data-invalid]`). `data-empty`: no value (placeholder shown).
- `data-deleting`: touch delete mode. `data-inline-delete`: `deleteInline`. No `aria-haspopup`: `popup={false}` (`.rac-select:not([aria-haspopup])`).
On `.rac-option`: `aria-selected='true'`, `aria-disabled='true'`, `data-highlighted` (keyboard or pointer), `data-invalid`, `data-loading`, `data-error`, `data-bool`.
On `.rac-group`: `data-open`, `data-highlighted`, `data-disabled`. On `.rac-options`: `data-offscreen` (the trigger is scrolled out of a scroll container; the panel fades out).
Valueless flags are present or absent: select them with `[data-error]`, not `[data-error='true']`.

## Variables
Every `--rac-*` variable inherits, so it may be set on any ancestor (`.checkout {--rac-row: 2.5em}`). The panel only sees its own ancestors: set panel variables on `:root`, on the `container`, on `optionsClassName`, or through `style`. Do not name your own variables with the `--rac-` prefix.
Inputs:
- `--rac-bg` (Canvas + 2% CanvasText): background, base of every tint.
- `--rac-fg` (CanvasText): text, color of every tint.
- `--rac-danger` (#e7000b): error border and row, false values, invalid options, delete colors.
- `--rac-success` (#4caf50): true values.
- `--rac-radius` (0px): corner radius of the trigger and the panel; chips get half. Needs a unit (`0px`, not `0`).
- `--rac-row` (2em): height of one row of the value area; chips are sized from it.
- `--rac-list-max-height` (250px): list height limit; also used to decide whether the panel opens upward.
Derived from `--rac-fg` / `--rac-bg` on `.rac-select` and `.rac-options` (override them there): `--rac-tint-1` (5%: trigger hover, scrollbar track), `--rac-tint-2` (10%: chips, highlighted option, scrollbar thumb), `--rac-tint-3` (20%: selected option, hovered chip), `--rac-muted` (55%: disabled options, checkbox frame, busy stripe), `--rac-duration-fast` (half the duration).
From props: `--rac-duration` (`duration`, 300ms) and `--rac-ease` (`easing`, 'ease') drive every transition; set the props, not the variables.
Written by JS, read only: `--rac-visible` (visible fraction of a partly clipped trigger, used as the panel opacity; with your own opacity write `calc(var(--rac-visible, 1) * 0.9)`). `--rac-sep` is internal (the chips plugin morph).
Reduced motion (`prefers-reduced-motion: reduce`): `--rac-duration` becomes 1ms and looping animations stop.
Keyframes: `rac-blink` (dots), `rac-shake` (chips in delete mode), `rac-busy` (busy stripe).

## Recipes
```css
:root {--rac-radius: 8px;}                         /* rounded trigger, panel and chips */
.rac-options {border: 1px solid var(--rac-tint-3);} /* panel border (no variable for it) */
.rac-select[aria-expanded='true'][data-placement='bottom'] {border-bottom-left-radius: 0; border-bottom-right-radius: 0;}
.rac-select[data-empty] .rac-title {opacity: 0.6;}  /* dimmed placeholder */
.rac-chip {border-radius: 999px; padding: 0 0.6em;} /* pill chips */
.rac-select[aria-busy='true']::after {content: none;} /* no busy stripe */
.rac-select {--rac-row: 2.75em;}                   /* taller trigger */
.rac-chip {max-width: 12em;}                        /* truncate chips earlier */
.rac-option[aria-selected='true'] {font-weight: bold;}
.brand {--rac-bg: #1c1f26; --rac-fg: #8ab4ff;}      /* dark theme: className='brand' optionsClassName='brand' */
```
```jsx
<Select style={{'--rac-bg': '#1c1f26', '--rac-fg': '#8ab4ff'}}/>  // one Select, trigger and panel
```
Icons need no CSS: pass them through the `icons` prop. To remove a control, use the prop, not `display: none`: `icons={{clear: null}}` (no clear button), `icons={{arrow: null}}` (no arrows), `icons={{remove: null}}` (no chip delete buttons). A border on the panel, a shadow, fonts: plain properties on `.rac-options`, `.rac-option`, `.rac-select`.

## Renamed in 0.7.5 (old class → now)
`rac-select-title-wrapper`, `rac-select-title`, `rac-title-container` → `rac-value`; `rac-title-text` → `rac-title`; `rac-loading-container`, `rac-loading-dots` → `rac-dots`; `rac-select-buttons` → removed; `rac-select-cancel` → `rac-clear`; `rac-select-arrow`, `rac-select-arrow-wrapper`, `--open` → `rac-arrow` + `aria-expanded`; `rac-disabled-style`, `rac-loading-style`, `rac-error-style` → `aria-disabled`, `aria-busy`, `data-error`; `rac-multiple-option` → `rac-chip-slot`; `rac-multiple-selected-option`, `--deleting-shake` → `rac-chip` + `data-deleting`; `rac-multiple-del` → `rac-chip-del`; `rac-select-list` → `rac-list`; `rac-select-option` → `rac-option`; `rac-selected`, `rac-highlighted` → `aria-selected`, `data-highlighted`; `rac-disabled-option`, `rac-invalid-option`, `rac-loading-option` → `aria-disabled`, `data-invalid`, `data-loading`; `rac-true-option`, `rac-false-option` → `data-bool`; `rac-option-title` → `rac-option-text`; `rac-jsx-option` → `rac-option-jsx`; `rac-checkbox` → `rac-check`; `rac-checkmark.--checked` → `rac-checkmark` inside `[aria-selected='true']`; `rac-group-header`, `rac-disabled-group` → `rac-group` + `data-disabled`, `data-open`; `rac-group-title-text` → `rac-group-text`; `rac-group-container` → `rac-group-items`.
Removed variables: every `--rac-select-*`, `--rac-option-*`, `--rac-group-*`, `--rac-multiple-*`, `--rac-checkbox-*`, `--rac-dots-*`, `--rac-title-*`, `--rac-scroll-*`, `--rac-duration-base`; `--rac-base-red` / `--rac-base-green` → `--rac-danger` / `--rac-success`. Set the property on the class instead.
