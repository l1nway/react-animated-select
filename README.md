# React Animated Select

A lightweight, high-performance, and fully customizable Select component for React. Featuring smooth CSS animations, accessible keyboard navigation, and flexible option rendering.

[![Docs](https://img.shields.io/badge/docs-documentation-blue?style=for-the-badge&logo=gitbook)](https://l1nway.github.io/react-animated-select-docs/)

## Installation
```jsx
  npm  install  react-animated-select
```

### Basic Usage
```jsx
  import {Select, Option} from 'react-animated-select'
  import {useState} from 'react'
  
  function App() {
    const options = ['Option 1', {name: 'Option 2', id: 2}, 'Option 3']
    const [value, setValue] = useState('')
    
    return (
      <Select
        placeholder='Pick a option'
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

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 l1nway