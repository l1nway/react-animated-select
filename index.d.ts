import {FC, ReactNode} from 'react'

export interface SelectProps {
    children?: ReactNode
    renderedDropdown?: ReactNode
    
    options?: any[] | Record<string, any>
    value?: any
    defaultValue?: any
    onChange?: (value: any, option: any) => void

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
    id?: string
}

export const Select: FC<SelectProps>

export interface OptionProps {
    value: any
    children: ReactNode
    disabled?: boolean
    className?: string
}

export const Option: FC<OptionProps>