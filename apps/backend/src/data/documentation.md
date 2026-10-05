# [Installation and usage]
```bash
    npm  install  react-animated-select
```

Все доступные импорты:
```jsx
    import {Select, Option, OptGroup} from 'react-animated-select'
```
- Select: основной компонент, используется в случае отсутствия необходимости прокидывать уникальные JSX-опции, и если опции передаются через массив в проп `options`.
- Option: компонент для кастомной JSX-опции, используется в случае необходимости своей верстки опции (например, добавить иконку). Рекомендуемые пропсы: id/value. доступные пропсы: className (по умолчанию undefined; используется для стилизации обёртки над JSX-содержимым кастомной опции), disabled (по умолчанию false; используется для отключения опции).
- OptGroup: компонент для группировки JSX-опций, используется для группировки опций в группы. Чтобы поместить JSX опцию в группу, нужно вкладывать их в соответствующий OptGroup. Рекомендуемые пропсы: id/value. доступные пропсы: className (по умолчанию undefined; используется для стилизации названия группы опций), disabled (по умолчанию false; используется для группы опций).

## [Opening and Control]
Для открытия селекта необходимо кликнуть по нему или переключиться на него фокусом (селект открывается при попадании на него фокуса и закрывается, когда фокус потерян).

- `visibility` (boolean): Ручное управление состоянием статуса открытости.
- `ownBehavior` (boolean): Полностью отключает нативное поведение, переводя селект на внешнее управление.

## [Option Deletion and Layout]
Выбранные опции отдельно удалять можно в режиме множественного выбора (multiple={true}), рядом с которым при ховере (ПК) либо свайпу (Touch) появляется иконка удаления (по умолчанию «крестик»).
По умолчанию кнопка удаления не видна, но сделать её видимой у каждой опции сразу, можно сделать пропом `showDelete`.
По умолчанию кнопка удаления появляется поверх конкретной опции, чтобы не вызывать изменения позиций опций, но можно включить проп `deleteInline` что сделает иконку удаления фактической, и она будет выезжать справа от опции, но занимать место и «расталкивать» соседние опции. Во избежание проблем с вёрсткой была разработана специальная система «спейсеров», которые резервируют необходимое пространство для них ещё до проигрывания анимации, что позволяет избегать дребезгов вёрстки.

## [List of props]

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `Array \| Object` | `[]` | Data source for options. The recommended format is an array of objects with `id`, `name`, and optional `disabled`. For compatibility, `value` may be used instead of `id`, and `label` instead of `name`. |
| `value` | `any` | `undefined` | The current value for a controlled component. |
| `defaultValue` | `any` | `undefined` | Initial value for an uncontrolled component. |
| `onChange` | `function` | `undefined` | Callback called when an option is selected. Arguments: (data, id). |
| `multiple` | `boolean` | `false` | Allows select multiple options. |
| `placeholder` | `string` | `"Choose option"` | Text shown when no option is selected. |
| `disabled` | `boolean` | `false` | Disables the entire component. |
| `loading` | `boolean` | `false` | Shows a loading animation and disables interaction. |
| `error` | `boolean` | `false` | Shows the error state and `errorText`. |
| `style` | `object` | `{}` | Inline styles for the root container. |
| `className` | `string` | '' | Additional CSS class for the root container .rac-select. |
| `OpenIcon` | `ElementType \ string \ JSX` | Default icon | Custom open icon. Accepts a component, image path, or JSX. |
| `ClearIcon` | `ElementType \ string \ JSX` | Default icon | Custom clear selected option(s) icon. Accepts a component, image path, or JSX. |
| `DelIcon` | `ElementType \ string \ JSX` | Default icon | Custom delete icon (for options in multiple mode). Accepts a component, image path, or JSX. |
| `Checkmark` | `ElementType \ string \ JSX` | Default icon | A classic tick icon that signifies a successful selection. In multi-select mode, it appears inside the Checkbox to provide a clear visual confirmation that a specific option has been successfully toggled. |
| `Checkbox` | `ElementType \ string \ JSX` | `border: 0.1px solid gray` | By default, this is a simple border surrounding the Checkmark to indicate a toggleable state. However, it can be fully customized by uploading a unique icon to match your design system's specific multi-select aesthetic. |

---

### Animation Controls

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `duration` | `number` | `300` | Speed of all transitions in milliseconds (mapped to CSS variable `--rac-duration`). |
| `easing` | `string` | `'ease-out'` | CSS transition timing function (e.g., `cubic-bezier(.4,0,.2,1)`). |
| `offset` | `number` | `1` | Vertical gap (in pixels) between the select trigger and the dropdown list. |
| `animateOpacity` | `boolean` | `true` | Enables or disables the fade effect during opening and closing. |

---

### Behavioral Props

| Prop            | Type       | Default    | Description |
| --------------- | ---------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `unmount`       | `boolean`  | `true`     | In default, the dropdown unmounts from the React component tree and DOM when closed. false value keeps the dropdown mounted in the DOM with zero sizes and opacity. |
| `hasMore`       | `boolean`  | `false`    | Indicates whether more options are available for loading (used for infinite loading). |
| `loadMore`      | `function` | `() => {}` | Callback triggered when more options need to be loaded. |
| `loadMoreText`  | `string`   | `'Loading'`  | Text displayed inside the options list during loading. |
| `loadOffset`    | `number`   | `100`      | Distance (in pixels) from the bottom of the list that triggers `loadMore`. |
| `loadAhead`     | `number`   | `3`        | Number of remaining options before the end at which loading is triggered during keyboard navigation. |
| `loadButton`     | `boolean` | `false`       | Enables a manual “Load more” button instead of automatic loading. |
| `loadButtonText` | `string`  | `'Load more'` | Text displayed on the load button.                                |
| `childrenFirst` | `boolean`  | `false`    | Determines priority of JSX `<Option />` children over options passed via props. |
| `groupsClosed` | `boolean` | `false` | Default open status of groups. |
| `onClose`      | `function` | `() => {}` | Callback triggered when select opened. |
| `onOpen`      | `function` | `() => {}` | Callback triggered when select closed. |

---

### Text Customization

| Prop | Default | Description |
|------|---------|-------------|
| `emptyText` | `'No options'` | Text shown when the list is empty. |
| `loadingText` | `'Loading'` | Text shown in the title during the loading state. |
| `errorText` | `'Failed to load'` | Text shown when `error={true}`. |
| `disabledText` | `'Disabled'` | Text shown when `disabled={true}`. |

---