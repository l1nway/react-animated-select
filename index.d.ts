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
    
    options?: any[] | Record<string, any>
    value?: any
    defaultValue?: any
    onChange?: (data: any, id: any) => void
    multiple?: boolean

    disabled?: boolean
    loading?: boolean
    error?: boolean

    placeholder?: ElementType | string | ReactNode
    emptyText?: string
    disabledText?: string
    loadingText?: string
    errorText?: string
    selectedText?: string

    disabledOption?: string
    emptyOption?: string
    invalidOption?: string

    className?: string
    optionsClassName?: string
    style?: CSSProperties
    
    OpenIcon?: ElementType | string | ReactNode | boolean
    ClearIcon?: ElementType | string | ReactNode | boolean
    DelIcon?: ElementType | string | ReactNode | boolean
    Checkmark?: ElementType | string | ReactNode | boolean
    Checkbox?: ElementType | string | ReactNode | boolean

    hasMore?: boolean
    loadMore?: () => void
    loadButton?: boolean
    loadButtonText?: string
    loadMoreText?: string
    loadOffset?: number
    loadAhead?: number
    
    childrenFirst?: boolean
    groupsClosed?: boolean
    deleteInline?: boolean
    showDelete?: boolean
    onClose?: () => void
    onOpen?: () => void
}

export const Select: FC<SelectProps>

export interface OptionProps {
    value?: any
    id?: any
    label?: any
    name?: any
    children?: ReactNode
    disabled?: boolean
    className?: string
}

export const Option: FC<OptionProps>

export interface OptGroupProps {
    value?: any
    id?: any
    children?: ReactNode
    disabled?: boolean
    name?: any
    label?: any
    className?: string
}

export const OptGroup: FC<OptGroupProps>