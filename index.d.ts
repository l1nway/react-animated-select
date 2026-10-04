import {FC, FunctionComponent, ReactNode, CSSProperties, ElementType, Ref, FocusEvent, KeyboardEvent, AriaAttributes} from 'react'

/** Live region message: a template with {label} / {n}, or a function for plural forms. */
export type LiveText = string | ((value: string | number) => string)

export interface SelectTexts {
    empty: string
    disabled: string
    loading: string
    error: string
    clear: string
    remove: string
    loadMore: string
    loadingMore: string
    emptyOption: string
    invalidOption: string
    disabledOption: string
    emptyGroup: string
    /** State word in a group header's accessible name. Default `'expanded'`. */
    groupOpen: string
    /** State word in a group header's accessible name. Default `'collapsed'`. */
    groupClosed: string
    list: string
    /** Validation bubble text of an empty required Select; default: the browser's own. */
    required?: string
    /** Default `'Removed {label}'`. */
    removed?: LiveText
    /** Default `'Selection cleared'`. */
    cleared?: LiveText
    /** Default `'{n} selected'`. */
    selected?: LiveText
    /** Default `'{n} more options loaded'`. */
    loaded?: LiveText
}

export type SelectIcon = ElementType | string | ReactNode | null | false

export interface SelectIcons {
    arrow: SelectIcon
    clear: SelectIcon
    remove: SelectIcon
    check: SelectIcon
    checkbox: SelectIcon
}

export interface SelectProps extends AriaAttributes {
    [key: `data-${string}`]: string | number | boolean | undefined

    ref?: Ref<HTMLDivElement>
    children?: ReactNode

    /** A dictionary's values are the options, keys ignored; a key named name/label/id/value makes it one option, options/group a group. Array items take no className/style (use <Option/>). */
    options?: any[] | Record<string, any>
    /** undefined = uncontrolled; keep one mode, clear a controlled Select with null / [] (a switch warns in dev). */
    value?: any
    /** Initial value of an uncontrolled Select; also the target of form.reset(), in both modes, with or without name. */
    defaultValue?: any
    /** value: an array item as given (an object stays the whole object), an <Option/> as its `value`; a controlled value must have the shape of its source. */
    onChange?: (value: any, ids: any) => void
    multiple?: boolean
    childrenFirst?: boolean
    groupsClosed?: boolean

    disabled?: boolean
    loading?: boolean
    error?: boolean

    open?: boolean
    onOpenChange?: (open: boolean) => void
    /** false: no panel, a tag list: role="group" without the combobox ARIA, never opens, no arrow; chip deletion and clear keep working. Default true. */
    popup?: boolean
    onFocus?: (e: FocusEvent<HTMLDivElement>) => void
    onBlur?: (e: FocusEvent<HTMLDivElement>) => void
    /** Runs before the Select handles a key; event.preventDefault() makes the Select skip it. */
    onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void

    id?: string
    name?: string
    /** Id of the owner <form>, like <select form="id">: submits and resets with it even when placed outside. */
    form?: string
    required?: boolean

    hasMore?: boolean
    loadMore?: () => void | Promise<unknown>
    loadButton?: boolean
    loadOffset?: number
    loadAhead?: number

    placeholder?: string
    selectedText?: string
    texts?: Partial<SelectTexts>
    renderOption?: (item: any, state: {selected: boolean, disabled: boolean}) => ReactNode
    valueAsOption?: boolean

    icons?: Partial<SelectIcons>
    deleteInline?: boolean
    deleteAlways?: boolean

    className?: string
    optionsClassName?: string
    style?: CSSProperties
    container?: HTMLElement | null | (() => HTMLElement | null)
    duration?: number
    easing?: string
    offset?: number
    animateOpacity?: boolean
    keepMounted?: boolean

    /** @deprecated Removed in v0.7.5, has no effect. Use `open`. */
    visibility?: boolean
    /** @deprecated Removed in v0.7.5, has no effect. Use `onOpenChange`. */
    setVisibility?: (open: boolean) => void
    /** @deprecated Removed in v0.7.5, has no effect. Use `open` without `onOpenChange`. */
    ownBehavior?: boolean
    /** @deprecated Removed in v0.7.5, has no effect. Use `onOpenChange`. */
    onOpen?: () => void
    /** @deprecated Removed in v0.7.5, has no effect. Use `onOpenChange`. */
    onClose?: () => void
    /** @deprecated Removed in v0.7.5, has no effect. Use `keepMounted` (inverted). */
    unmount?: boolean
    /** @deprecated Removed in v0.7.5, has no effect. Use `deleteAlways`. */
    showDelete?: boolean

    /** @deprecated Removed in v0.7.5, has no effect. Use `icons.arrow`. */
    OpenIcon?: ElementType | string | ReactNode | boolean
    /** @deprecated Removed in v0.7.5, has no effect. Use `icons.clear`. */
    ClearIcon?: ElementType | string | ReactNode | boolean
    /** @deprecated Removed in v0.7.5, has no effect. Use `icons.remove`. */
    DelIcon?: ElementType | string | ReactNode | boolean
    /** @deprecated Removed in v0.7.5, has no effect. Use `icons.check`. */
    Checkmark?: ElementType | string | ReactNode | boolean
    /** @deprecated Removed in v0.7.5, has no effect. Use `icons.checkbox`. */
    Checkbox?: ElementType | string | ReactNode | boolean

    /** @deprecated Removed in v0.7.5, has no effect. Use `texts.empty`. */
    emptyText?: string
    /** @deprecated Removed in v0.7.5, has no effect. Use `texts.disabled`. */
    disabledText?: string
    /** @deprecated Removed in v0.7.5, has no effect. Use `texts.loading`. */
    loadingText?: string
    /** @deprecated Removed in v0.7.5, has no effect. Use `texts.error`. */
    errorText?: string
    /** @deprecated Removed in v0.7.5, has no effect. Use `texts.clear`. */
    clearText?: string
    /** @deprecated Removed in v0.7.5, has no effect. Use `texts.remove`. */
    removeText?: string
    /** @deprecated Removed in v0.7.5, has no effect. Use `texts.loadMore`. */
    loadButtonText?: string
    /** @deprecated Removed in v0.7.5, has no effect. Use `texts.loadingMore`. */
    loadMoreText?: string
    /** @deprecated Removed in v0.7.5, has no effect. Use `texts.emptyOption`. */
    emptyOption?: string
    /** @deprecated Removed in v0.7.5, has no effect. Use `texts.invalidOption`. */
    invalidOption?: string
    /** @deprecated Removed in v0.7.5, has no effect. Use `texts.disabledOption`. */
    disabledOption?: string
}

export const Select: FC<SelectProps>

export interface OptionProps {
    value?: any
    id?: any
    label?: any
    name?: any
    group?: string
    children?: ReactNode
    disabled?: boolean
    className?: string
    style?: CSSProperties
}

export const Option: FC<OptionProps>

export interface OptGroupProps {
    value?: any
    id?: any
    name?: any
    label?: any
    children?: ReactNode
    disabled?: boolean
    className?: string
    style?: CSSProperties

    /** @deprecated Removed in v0.7.5, has no effect. Use `texts.emptyGroup` on the `<Select/>`. */
    emptyGroupText?: string
}

export const OptGroup: FC<OptGroupProps>

/** Makes a reusable option component that `<Select/>` reads as data. `render` must be pure: no hooks. */
export function defineOption<P>(render: (props: P) => ReactNode): FunctionComponent<P>
