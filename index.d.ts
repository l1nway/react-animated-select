import {FC, FunctionComponent, ReactNode, CSSProperties, ElementType, Ref, FocusEvent, AriaAttributes} from 'react'

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
    list: string
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

    options?: any[] | Record<string, any>
    value?: any
    defaultValue?: any
    onChange?: (value: any, ids: any) => void
    multiple?: boolean
    childrenFirst?: boolean
    groupsClosed?: boolean

    disabled?: boolean
    loading?: boolean
    error?: boolean

    open?: boolean
    onOpenChange?: (open: boolean) => void
    onFocus?: (e: FocusEvent<HTMLDivElement>) => void
    onBlur?: (e: FocusEvent<HTMLDivElement>) => void

    id?: string
    name?: string
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
