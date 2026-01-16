# React Animated Select

A lightweight, high-performance, and fully customizable Select component for React. Featuring smooth CSS animations, accessible keyboard navigation, and flexible option rendering.

## Features

-  **Smooth Animations**

Powered by `react-transition-group` with height-expanding dropdowns and sliding side-elements.

-  **Accessible**

Full keyboard support (Arrow keys, Enter, Space, Escape, Tab) and ARIA attributes built-in.

-  **Flexible Data**

Supports simple arrays, objects, or declarative JSX children (`<Option />`).

-  **Smart Auto-Positioning**

Recalculates dropdown position using `ResizeObserver`.

-  **Zero-Config Styles**

The minimum styles required for the select to work are built into the project, but you can add your own on top of the basic ones.

-  **Search & Clear**

Built-in “Clear” button and intelligent state handling (loading, error, empty, disabled).

## Installation
```jsx
    npm  install  react-animated-select
```
### Basic Usage (Array of Strings)

```jsx
    import {Select} from 'react-animated-select'
    import {useState} from 'react'
    
    function App() {
    const options = ['Apple', 'Banana',  'Orange']
    const [value, setValue] = useState('')
    
    return (
	    <Select
		    options={options}
		    onChange={setValue}
		    value={value}
		    placeholder='Pick a fruit'
	    />
    )}
```
### Advanced Usage (JSX Children)
```jsx
import {Select, Option} from 'react-animated-select'

function App() {
  return (
    <Select defaultValue='react'>
      <Option id='react'>React</Option>
      <Option id='vue' disabled>Vue (Coming soon)</Option>
      <Option id='svelte' className='custom-svelte-style'>
        <b>Svelte</b> - The compiler
      </Option>
    </Select>
  )
}
```
## Props API

### `<Select />`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | Array \| Object | `[]` | Data source for options. The recommended format is an array of objects with `id`, `name`, and optional `disabled`. For compatibility, `value` may be used instead of `id`, and `label` instead of `name`. |
| `value` | `any` | `undefined` | The current value for a controlled component. |
| `defaultValue` | `any` | `undefined` | Initial value for an uncontrolled component. |
| `onChange` | `function` | `undefined` | Callback called when an option is selected. Arguments: (data, id). |
| `placeholder` | `string` | `"Choose option"` | Text shown when no option is selected. |
| `disabled` | `boolean` | `false` | Disables the entire component. |
| `loading` | `boolean` | `false` | Shows a loading animation and disables interaction. |
| `error` | `boolean` | `false` | Shows the error state and `errorText`. |

---

### Animation Controls

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `duration` | `number` | `300` | Speed of all transitions in milliseconds (mapped to CSS variable `--rac-duration`). |
| `easing` | `string` | `'ease-out'` | CSS transition timing function (e.g., `cubic-bezier(.4,0,.2,1)`). |
| `offset` | `number` | `2` | Vertical gap (in pixels) between the select trigger and the dropdown list. |
| `animateOpacity` | `boolean` | `true` | Enables or disables the fade effect during opening and closing. |

---

### Behavioral Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visibility` | `boolean` | `false` | Manually controls the visibility of the list (used with `ownBehavior`). |
| `ownBehavior` | `boolean` | `false` | If `true`, the component stops managing its own open/close state and relies on the `visibility` prop. |
| `alwaysOpen` | `boolean` | `false` | Keeps the list permanently visible. Primarily used for debugging or specific UI layouts. |
| `unmount` | `boolean` | `true` | When `true`, the list is removed from the DOM when closed. When `false`, it stays invisible in the DOM. |

---

### Text Customization

| Prop | Default | Description |
|------|---------|-------------|
| `emptyText` | `'No options'` | Text shown when the list is empty. |
| `loadingText` | `'Loading'` | Text shown in the title during the loading state. |
| `errorText` | `'Failed to load'` | Text shown when `error={true}`. |
| `disabledText` | `'Disabled'` | Text shown when `disabled={true}`. |

---

### `<Option />`

| Prop | Type | Description |
|------|------|-------------|
| `id` | `string` | Optional unique ID (generated automatically if not provided). value may be used instead of id (lower priority)|
| `disabled` | `boolean` | If true, this option cannot be selected or highlighted. |
| `className` | `string` | Custom class for individual option styling. |

---

## Keyboard Support

| Key | Action |
|-----|--------|
| `ArrowDown` | Open dropdown / Move highlight down. |
| `ArrowUp` | Open dropdown / Move highlight up. |
| `Enter` / `Space` | Select highlighted option / Open dropdown. |
| `Escape` | Close dropdown. |
| `Tab` | Close dropdown and move focus to next element. |

## Custom Styling

The component is built with a consistent BEM-like naming convention using the `rac-` prefix. You can easily override these classes in your CSS.

### CSS Variables (Theming)

The component uses CSS variables for deep styling. These are based on system colors and `color-mix` for automatic theme adaptation. You can override these in your `:root` or on a specific `.rac-select` instance.

| Variable | Default Value / Calculation | Description |
|:---|:---|:---|
| **Durations** | | |
| `--rac-duration-fast` | `calc(var(--rac-duration) * 0.5)` | Used for micro-interactions. |
| `--rac-duration-base` | `var(--rac-duration)` | Main transition speed. |
| `--rac-duration-slow` | `calc(var(--rac-duration) * 1.3)` | Used for larger list transitions. |
| **Colors** | | |
| `--rac-base-red` | `#e7000b` | Base semantic red. |
| `--rac-base-green` | `#4caf50` | Base semantic green. |
| `--rac-base-yellow` | `#ffc107` | Base semantic yellow. |
| **Select Trigger** | | |
| `--rac-select-background`| `color-mix(in srgb, Canvas 98%, CanvasText 2%)` | Main background. |
| `--rac-select-color` | `CanvasText` | Title text color. |
| `--rac-select-border` | `2px solid ...` | Default border style. |
| `--rac-select-border-error`| `2px solid ...` | Border style in error state. |
| `--rac-select-height` | `2em` | Fixed height of the select. |
| `--rac-select-padding` | `0em 0.5em` | Internal horizontal padding. |
| `--rac-disabled-opacity` | `0.75` | Opacity when `disabled={true}`. |
| **Loading Dots** | | |
| `--rac-dots-color` | `currentColor` | Color of the loader dots. |
| `--rac-dots-animation-duration`| `1.4s` | Full cycle of the dots animation. |
| `--rac-dots-gap` | `3px` | Space between points. |
| **Icons & Buttons** | | |
| `--rac-arrow-height` | `1em` | Dropdown arrow size. |
| `--rac-cancel-height` | `0.9em` | Clear icon size. |
| **Dropdown & Scroll** | | |
| `--rac-list-background` | `color-mix(in srgb, Canvas 98%, CanvasText 2%)` | Dropdown list background. |
| `--rac-list-max-height` | `250px` | Maximum height before scrolling. |
| `--rac-scroll-color` | `color-mix(...)` | Scrollbar thumb color. |
| **Options State** | | |
| `--rac-option-hover` | `color-mix(...)` | Background on mouse hover. |
| `--rac-option-highlight` | `color-mix(...)` | Background when keyboard navigating. |
| `--rac-option-selected` | `color-mix(...)` | Background of the active option. |
| `--rac-disabled-option-color`| `color-mix(...)` | Text color for disabled items. |
| `--rac-true-option-color` | `color-mix(...)` | Text color for "Boolean True" items. |
| `--rac-false-option-color` | `color-mix(...)` | Text color for "Boolean False" items. |

---

### CSS Class Hierarchy

| Class Name | Target Element | Description |
|:---|:---|:---|
| `.rac-select` | **Main Wrapper** | The primary container of the select. |
| `.rac-select-title` | **Value Display** | The area showing the selected option or placeholder. |
| `.rac-loading-dots` | **Loader** | Wrapper for the loading animation. |
| `.rac-loading-dots i` | **Loader Point** | Directly target animated points for styling. |
| `.rac-select-buttons` | **Action Group** | Wrapper for the Clear (X) and Arrow icons. |
| `.rac-select-cancel` | **Clear Button** | The "X" icon for clearing the selection. |
| `.rac-select-arrow-wrapper` | **Arrow Icon** | Container for the dropdown arrow. |
| `.rac-select-list` | **Dropdown List** | The `listbox` container that holds all options. |
| `.rac-select-option` | **Option Item** | Individual item within the dropdown list. |

**Note on Animation:** The Clear button and Dropdown List use `react-transition-group`. 
Customizing `rac-slide-left-*` (Clear button) and `rac-options-*` (Dropdown) classes is possible, but do so with caution to maintain sync with the JS logic.

### Component States

The select and its options react to internal states by applying the following classes:

#### Main Select States (applied to `.rac-select`)
- `.rac-disabled-style`: Applied when `disabled={true}` or when the options list is empty.
- `.rac-loading-style`: Applied during the `loading={true}` state.
- `.rac-error-style`: Applied when `error={true}`.

#### Option States (applied to `.rac-select-option`)
- `.rac-highlighted`: The option currently focused via keyboard or mouse hover.
- `.rac-disabled-option`: Applied to options that have their own `disabled: true` property.
- `.rac-invalid-option`: Applied to items that are not valid data types (e.g., functions).
- `.rac-true-option`: Specialized styling when the option's raw value is exactly `true`.
- `.rac-false-option`: Specialized styling when the option's raw value is exactly `false`.

#### Trigger States
- `.rac-select-arrow-wrapper.--open`: Applied to the arrow icon when the dropdown is expanded.

## Change log
### 0.2.5
**Added**
- System-Driven Theming: Implemented color-mix() utilizing CSS system colors (Canvas, CanvasText, AccentColor). This ensures the component is natively adaptive to Light/Dark modes and High Contrast accessibility settings.

- Advanced UX Logic: Added a window-focus protection mechanism to prevent the dropdown from auto-opening when switching back to the browser tab (Alt+Tab).

**Fixed**

- Duplicate ID Conflict: Resolved a critical bug where multiple options with identical IDs caused the highlighter to "stuck" on the first match. Now, every option receives a unique internal React ID while maintaining the user-provided ID for logic.

**Customization & Props**

- Total Styling Freedom: Exposed a full set of CSS variables (--rac-*) for durations, colors, offsets, and dimensions.
- Animation Controls: Added new props:
- - duration: Control the speed of all transitions.
- - easing: Set custom cubic-bezier or ease functions.
- - offset: Adjust the gap between the trigger and the dropdown.
- - animateOpacity: Toggle fade effects on/off.
- Behavioral Props:
- - ownBehavior: Allows external control of the open/closed state.
- - alwaysOpen: Debug/Special use mode where the list is permanently visible.
- - unmount: Toggle between display: none and full DOM removal on close.
- - visibility: Allows manually control the visibility of the list.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 l1nway