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
          <Option value='react'>React</Option>
          <Option value='vue' disabled>Vue (Coming soon)</Option>
          <Option value='svelte' className='custom-svelte-style'>
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
| `options` | Array \| Object | `[]` | Data source for options. Supports arrays of strings/numbers/objects or a simple object. |
| `value` | `any` | `undefined` | The current value for a controlled component. |
| `defaultValue` | `any` | `undefined` | Initial value for an uncontrolled component. |
| `onChange` | `function` | `undefined` | Callback: `(value, optionObject) => void`. |
| `placeholder` | `string` | `"Choose option"` | Text shown when no option is selected. |
| `disabled` | `boolean` | `false` | Disables the entire component. |
| `loading` | `boolean` | `false` | Shows a loading animation and disables interaction. |
| `error` | `boolean` | `false` | Shows the error state and `errorText`. |
| `duration` | `number` | `300` | Animation duration in milliseconds. |

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
| `value` | `any` | The underlying value of the option. |
| `id` | `string` | Optional unique ID (generated automatically if not provided). |
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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 l1nway