import './select.css'

import {XMarkIcon, ArrowUpIcon} from './icons'
import {forwardRef, useImperativeHandle, useRef, useMemo, useState, useEffect, useCallback, useId, isValidElement, cloneElement} from 'react'
import {SelectContext} from './selectContext'
import {makeId} from './makeId'

import useSelect from './useSelect'
import useSelectLogic from './useSelectLogic'
import Options from './options'
import SlideLeft from './slideLeft'

const renderIcon = (Icon, defaultProps) => {
    if (!Icon) return null

    if (typeof Icon === 'string') {
        return <img src={Icon} {...defaultProps} alt='' />
    }

    if (isValidElement(Icon)) {
        return cloneElement(Icon, defaultProps)
    }

    if (typeof Icon === 'function' || (typeof Icon === 'object' && Icon.$$typeof)) {
        const IconComponent = Icon
        return <IconComponent {...defaultProps} />
    }

    return null
}

const Select = forwardRef(({
    unmount,
    children,
    renderedDropdown,
    visibility: externalVisibility,
    ownBehavior = false,
    alwaysOpen = false,
    duration = 300,
    easing = 'ease-out',
    offset = 2,
    animateOpacity = true,
    style = {},
    className = '',
    ArrowIcon = ArrowUpIcon,
    ClearIcon = XMarkIcon,
    hasMore = false,
    loadMore = () => {},
    loadButton = false,
    loadButtonText = 'Load more',
    loadMoreText = 'Loading',
    loadOffset = 100,
    loadAhead = 3,
    childrenFirst = false,
    ...props
}, ref) => {

    const [loadingTitle, setLoadingTitle] = useState(loadButton ? loadButtonText : loadMoreText)

    const reactId = useId()

    const selectId = useMemo(() => reactId.replace(/:/g, ''), [reactId])

    const [jsxOptions, setJsxOptions] = useState([])

    const registerOption = useCallback((opt) => {
    setJsxOptions(prev => [...prev, opt])
    }, [])

    const unregisterOption = useCallback((id) => {
        setJsxOptions(prev => prev.filter(o => o.id !== id))
    }, [])

    // ref is needed to pass dimensions for the animation hook
    const selectRef = useRef(null)

    useEffect(() => {
        if (!ref) return
        if (typeof ref === 'function') {
            ref(selectRef.current)
        } else {
            ref.current = selectRef.current
        }
    }, [ref])

    useImperativeHandle(ref, () => selectRef.current)

    // open/closed status select
    const [internalVisibility, setInternalVisibility] = useState(false)

    const visibility = useMemo(() => {
        if (alwaysOpen) return true
        if (ownBehavior) return !!externalVisibility
        
        return internalVisibility
    }, [alwaysOpen, ownBehavior, externalVisibility, internalVisibility])

    const setVisibility = useCallback((newState) => {
        if (alwaysOpen) return
        if (ownBehavior) return 
        
        setInternalVisibility(prev => {
            const next = typeof newState === 'function' ? newState(prev) : newState
            return next
        })
    }, [alwaysOpen, ownBehavior])

    const {normalizedOptions, selected, selectOption, clear, hasOptions, active, selectedValue, disabled, loading, error, placeholder, invalidOption, emptyText, disabledText, loadingText, errorText} = useSelectLogic({...props, visibility, setVisibility, jsxOptions, hasMore,loadButton, loadingTitle, loadMore, loadMoreText, setLoadingTitle, childrenFirst})

    // event handler functions for interacting with the select
    const {handleListScroll, handleBlur, handleFocus, handleToggle, handleKeyDown, highlightedIndex, setHighlightedIndex} = useSelect({
        setLoadingTitle,
        loadButton,
        loadButtonText,
        hasMore,
        loadMore,
        disabled,
        isOpen: visibility,
        setIsOpen: setVisibility,
        options: normalizedOptions,
        selectOption,
        selected,
        loadOffset
    })

    const [animationFinished, setAnimationFinished] = useState(false)

    useEffect(() => {
        if (!visibility) {
            setAnimationFinished(false)
        }
    }, [visibility])

    useEffect(() => {
        if (error || disabled || loading || !hasOptions) {
            setVisibility(false)
        }
    }, [error, disabled, loading, hasOptions])

    useEffect(() => {
        if (visibility && animationFinished && highlightedIndex !== -1) {

            const option = normalizedOptions[highlightedIndex]
            if (option) {
                const elementId = `opt-${selectId}-${makeId(option.id)}`
                const domElement = document.getElementById(elementId)
                
                if (domElement) {
                    domElement.scrollIntoView({block: 'nearest'})
                }
            }
        }
    }, [highlightedIndex, visibility, animationFinished, normalizedOptions, selectId])

    const hasActualValue = 
        selectedValue !== undefined && 
        selectedValue !== null && 
        !(Array.isArray(selectedValue) && selectedValue.length === 0) &&
        !(typeof selectedValue === 'object' && Object.keys(selectedValue).length === 0)

    // displaying title according to state of select
    const title = useMemo(() => {
        if (error) return errorText
        if (loading) return loadingText
        if (disabled) return disabledText
        
        if (selected) return selected.jsx ?? selected.name
        
        if (hasActualValue) {
            const recovered = normalizedOptions.find(o => o.raw === selectedValue)
            if (recovered) return recovered.name

            if (typeof selectedValue === 'object' && selectedValue !== null) {
                return selectedValue.name ?? selectedValue.label ?? 'Selected Object'
            }
            return String(selectedValue)
        }

        if (!hasOptions) return emptyText

        return placeholder
    }, [disabled, loading, error, hasOptions, selected, selectedValue, placeholder, errorText, loadingText, disabledText, emptyText])

    const listboxId = `${selectId}-listbox`

    // option list rendering
    const renderOptions = useMemo(() => normalizedOptions?.map((element, index) => {
        const optionId = `opt-${selectId}-${makeId(element.id)}`

        let optionClass = 'rac-select-option'
        if (element.className) optionClass += ` ${element.className}`

        if (selected?.id === element.id) optionClass += ' rac-selected'

        if (index === highlightedIndex) optionClass += ' rac-highlighted'

        if (element.disabled || element.loading) optionClass += ' rac-disabled-option'

        if (element.invalid) optionClass += ' rac-invalid-option'

        if (element.loadMore && loadingTitle == loadMoreText) optionClass += ' rac-loading-option'
        
        if (typeof element.raw === 'boolean') {
            optionClass += element.raw ? ' rac-true-option' : ' rac-false-option'
        }

        if (element.name == invalidOption) {
            optionClass += ' rac-invalid-option'
        }

        return (
            <div
                className={optionClass}
                onClick={(e) => {
                    if (element.loading) {
                        e.stopPropagation()
                        return
                    }
                    selectOption(element, e)
                }}
                onMouseEnter={() => (!element.disabled && !element.loading) && setHighlightedIndex(index)}
                key={element.id}
                id={optionId}
                role='option'
                aria-selected={selected?.id === element.id}
                aria-disabled={element.disabled || element.loading}
                data-loading={element.loading}
            >
                {element.jsx ?? element.name}
                {element.loading && (
                    <span className='rac-loading-dots'>
                        <i/><i/><i/>
                    </span>
                )}
            </div>
        )
    }), [normalizedOptions, selectOption, selectId, selected, highlightedIndex])

    return(
        <SelectContext.Provider
            value={{registerOption, unregisterOption}}
        >
            {children}
            {renderedDropdown}
            <div
                style={{
                    '--rac-duration': `${duration}ms`,
                    ...style
                }}
                className={`rac-select
                    ${className}
                    ${(!hasOptions || disabled) ? 'rac-disabled-style' : ''}
                    ${loading ? 'rac-loading-style' : ''}
                    ${error ? 'rac-error-style' : ''}`
                }
                tabIndex={active ? 0 : -1}
                ref={selectRef}
                role='combobox'
                aria-haspopup='listbox'
                aria-expanded={visibility}
                aria-controls={listboxId}
                aria-label={placeholder}
                aria-disabled={disabled || !hasOptions}
                {...(active && {
                    onBlur: handleBlur,
                    onFocus: handleFocus,
                    onClick: handleToggle,
                    onKeyDown: handleKeyDown
                })}
            >
                <div
                    className={`rac-select-title ${(!error && !loading && selected?.type == 'boolean')
                        ? selected.raw ? 'rac-true-option' : 'rac-false-option'
                        : ''
                    }`}
                >
                    <span
                        className='rac-title-text'
                        key={title}
                    >
                        {title}
                    </span>
                    <SlideLeft
                        visibility={loading && !error}
                        duration={duration}
                    >
                        <span className='rac-loading-dots'>
                            <i/><i/><i/>
                        </span>
                    </SlideLeft>
                </div>
                <div
                    className='rac-select-buttons'
                >
                    <SlideLeft
                        visibility={hasActualValue && hasOptions && !disabled && !loading && !error}
                        duration={duration}
                        style={{display: 'grid'}}
                    >
                        {renderIcon(ClearIcon, { 
                            className: 'rac-select-cancel',
                            onMouseDown: (e) => {
                                e.preventDefault()
                                e.stopPropagation()
                            },
                            onClick: clear
                        })}
                    </SlideLeft>
                    <SlideLeft
                        visibility={active}
                        duration={duration}
                        style={{display: 'grid'}}
                    >
                        <span
                            className={`rac-select-arrow-wrapper ${visibility ? '--open' : ''}`}
                        >
                            {renderIcon(ArrowIcon, { 
                                className: 'rac-select-arrow-wrapper' 
                            })}
                        </span>
                    </SlideLeft>
                </div>
                <Options
                    visibility={visibility}
                    selectRef={selectRef}
                    onAnimationDone={() => setAnimationFinished(true)}
                    unmount={unmount}
                    duration={duration}
                    easing={easing}
                    offset={offset}
                    animateOpacity={animateOpacity}
                >
                    <div
                        onScroll={handleListScroll}
                        tabIndex='-1'
                        className='rac-select-list'
                        role='listbox'
                        aria-label='Options'
                    >
                        {renderOptions}
                        {!loadButton && hasMore ?
                            <div
                                onClick={e => e.stopPropagation()}
                                onMouseEnter={e => e.preventDefault()}
                                className='rac-select-option rac-disabled-option rac-loading-option'
                            >
                                <span
                                    className='rac-loading-option-title'
                                >
                                    Loading
                                </span>
                                <span className='rac-loading-dots'>
                                    <i/><i/><i/>
                                </span>
                            </div>
                        : null}
                    </div>
                </Options>
            </div>
        </SelectContext.Provider>
    )
})

export default Select