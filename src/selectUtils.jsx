import {isValidElement, cloneElement} from 'react'

export const initialState = (props) => ({
    loadingTitle: props.loadButton ? props.loadButtonText : props.loadMoreText,
    internalVisibility: false,
    animationFinished: false,
    deleting: false,
    jsxOptions: []
})

export const selectReducer = (state, action) => {   
    if (action.type === 'SET') {
        const update = action.payload
        return {
            ...state,
            ...(typeof update === 'function' ? update(state) : update)
        }
    }
    return state
}

// universal icon display
export const renderIcon = (Icon, defaultProps) => {
    if (!Icon) return null

    const mergeProps = (props = {}) => ({
        ...defaultProps,
        ...props,
        style: {
            ...defaultProps?.style,
            ...props?.style
        }
    })

    if (typeof Icon === 'string') return <img src={Icon} {...mergeProps()} alt=''/>
    if (isValidElement(Icon)) return cloneElement(Icon, mergeProps(Icon.props))
    if (typeof Icon === 'function' || (typeof Icon === 'object' && Icon.$$typeof)) {
        const IconComponent = Icon
        return <IconComponent {...mergeProps()}/>
    }
    return null
}

// adding classes to style options according to their state
export const getOptionClassName = (element, index, highlightedIndex, selectedID, loadingTitle, loadMoreText, invalidOption, selectedIDs) => {
    const multipleSelected = selectedIDs?.some(o => o.id === element.id)

    if (element.groupHeader) return 'rac-select-option rac-group-option'

    return [
        'rac-select-option',
        element.className,
        (multipleSelected || selectedID === element.id) && 'rac-selected',
        index === highlightedIndex && 'rac-highlighted',
        (element.disabled || element.loading) && 'rac-disabled-option',
        (element.invalid || element.name === invalidOption) && 'rac-invalid-option',
        (element.loadMore && loadingTitle === loadMoreText) && 'rac-loading-option',
        typeof element.raw === 'boolean' && (element.raw ? 'rac-true-option' : 'rac-false-option')
    ].filter(Boolean).join(' ')
}