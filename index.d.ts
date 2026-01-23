import {FC, ReactNode, CSSProperties, ElementType} from 'react'

export interface SelectProps {

    duration?: number
    easing?: string
    offset?: number
    animateOpacity?: boolean

    visibility?: boolean
    ownBehavior?: boolean
    alwaysOpen?: boolean
    unmount?: boolean

    children?: ReactNode
    renderedDropdown?: ReactNode
    
    options?: any[] | Record<string, any>
    value?: any
    defaultValue?: any
    onChange?: (data: any, id: any) => void

    disabled?: boolean
    loading?: boolean
    error?: boolean

    placeholder?: string
    emptyText?: string
    disabledText?: string
    loadingText?: string
    errorText?: string

    disabledOption?: string
    emptyOption?: string
    invalidOption?: string

    className?: string
    style?: CSSProperties
    ArrowIcon?: ElementType | string | ReactNode
    ClearIcon?: ElementType | string | ReactNode

    hasMore?: boolean
    loadMore?: () => void
    loadButton?: boolean
    loadButtonText?: string
    loadMoreText?: string
    loadOffset?: number
    loadAhead?: number
    childrenFirst?: boolean
}

export const Select: FC<SelectProps>

export interface OptionProps {
    value?: any
    id?: any
    children?: ReactNode
    disabled?: boolean
    className?: string
}

export const Option: FC<OptionProps>

export interface OptGroupProps {
    value?: any
    id?: any
    name?: any
    label?: any
}

export const OptGroup: FC<OptGroup>