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
    import  {useState}  from  'react'
    
    function  App() {
    const  options  = ['Apple', 'Banana',  'Orange']
    const [value, setValue]  =  useState('')
    
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
| `options` | Array \| Object | `[]` | Data source for options. The recommended format is an array of objects with `id`, `name`, and optional `disabled`. For compatibility, `value` may be used instead of `id`, and `label` instead of `name` (lower priority). |
| `value` | `any` | `undefined` | The current value for a controlled component. |
| `defaultValue` | `any` | `undefined` | Initial value for an uncontrolled component. |
| `onChange` | `function` | `undefined` | Callback called when an option is selected. Arguments: (data, id). data is the original object/value, id is the primary key. |
| `placeholder` | `string` | `"Choose option"` | Text shown when no option is selected. |
| `disabled` | `boolean` | `false` | Disables the entire component. |
| `loading` | `boolean` | `false` | Shows a loading animation and disables interaction. |
| `error` | `boolean` | `false` | Shows the error state and `errorText`. |

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

### CSS Class Hierarchy

| Class Name | Target Element | Description |
|:---|:---|:---|
| `.rac-select` | **Main Wrapper** | The primary container of the select. |
| `.rac-select-title` | **Value Display** | The area showing the selected option or placeholder. |
| `.rac-loading-dots` | **Loader** | Wrapper for the loading animation (contains 3 `<i>` elements); each point is customized through `.rac-loading-dots  i`. |
| `.rac-loading-dots i` | **Loader** | To customize directly animated points. |
| `.rac-select-buttons` | **Action Group** | Wrapper for the Clear (X) and Arrow icons |
| `.rac-select-cancel` | **Clear Button** | The "X" icon for clearing the selection.|
| `.rac-select-arrow-wrapper` | **Arrow Icon** | Container for the dropdown arrow. |
| `.rac-select-list` | **Dropdown List** | The `listbox` container that holds all options. |
| `.rac-select-option` | **Option Item** | Individual item within the dropdown list. |

**Note on Animation:** The Clear button and Dropdown List are wrapped in `react-transition-group`.
*Clear button* uses: `rac-slide-left-enter`, `-active`, `-done` and `rac-slide-left-exit`, `-active`.
*Dropdown list* uses: `rac-slide-down-enter`, `-active`, `-done` and `rac-slide-down-exit`, `-active`.
**Edit with caution**, as overriding these may break the smooth transition behavior.

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
### 0.2
**Core Improvements**

-   **Smart Normalization:** Enhanced handling of diverse data types (`number`, `boolean`, `string`, `object`, `null`, `function`).

-   **Stable IDs:** Implemented unique ID generation for JSX children and Boolean values (e.g., `true-0`, `false-1`) to prevent rendering conflicts and handle identical values.
    
-   **Smart Highlighting:** On open, the selector now automatically highlights the already selected item or the first **available** (non-disabled) option.
    
-   **Refined Keyboard Navigation:** Up/Down arrows now skip disabled items and cycle correctly. Navigation is disabled if no options are available.
    

**API & Logic Changes**

-   **`onChange` arguments:** Swapped for better DX. First argument: **Original user data**; Second argument: **Unique ID**.
    
-   **Visual States:** Fixed "Hover vs. Selection" conflict. Hovering no longer clears the selection highlight; keyboard and mouse focus now coexist smoothly with polished CSS transitions.


**Bug Fixes**
    
-   **A11y & UI:** Added `scrollIntoView` support for keyboard navigation—the active option always remains visible.
    
-   **Empty State:** Improved stability when receiving empty, null, or undefined option arrays.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 l1nway