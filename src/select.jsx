import './select.css'

import {XMarkIcon, ArrowUpIcon} from './icons'
import {useRef, useMemo, useState, useEffect, useCallback, useId} from 'react'

import {SelectContext} from './selectContext'
import useSelect from './useSelect'
import {useSelectLogic} from './useSelectLogic'
import {makeId} from './makeId'
import Options from './options'
import SlideLeft from './slideLeft'

export default function Select({children, renderedDropdown, ...props}) {

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

    // open/closed status select
    const [visibility, setVisibility] = useState(false)

    const {normalizedOptions, selected, selectOption, clear, hasOptions, active, selectedValue, disabled, loading, error, placeholder, invalidOption, options, value, defaultValue, isControlled, emptyText, disabledText, loadingText, errorText} = useSelectLogic({...props, visibility, setVisibility,jsxOptions})

    // event handler functions for interacting with the select
    const {handleBlur, handleFocus, handleToggle, handleKeyDown, highlightedIndex, setHighlightedIndex} = useSelect({
        disabled,
        isOpen: visibility,
        setIsOpen: setVisibility,
        options: normalizedOptions,
        selectOption: selectOption,
        selected: selected
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
                const elementId = `option-${makeId(option.name)}-${selectId}`
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
        
        if (selected) return selected.name

        if (hasActualValue) {
            return typeof selectedValue === 'object' 
                ? (selectedValue.name ?? selectedValue.label ?? String(selectedValue)) 
                : String(selectedValue)
        }

        if (!hasOptions) return emptyText

        return placeholder
    }, [disabled, loading, error, hasOptions, selected, selectedValue, placeholder, errorText, loadingText, disabledText, emptyText])

    const listboxId = `${selectId}-listbox`

    // option list rendering
    const renderOptions = useMemo(() => normalizedOptions?.map((element, index) => {
        const optionId = `option-${makeId(element.name)}-${selectId}`

        let optionClass = 'rac-select-option'
        if (element.className) optionClass += ` ${element.className}`

        if (index === highlightedIndex) optionClass += ' rac-highlighted'

        if (element.disabled) optionClass += ' rac-disabled-option'
        
        if (typeof element.raw === 'boolean') {
            optionClass += element.raw ? ' rac-true-option' : ' rac-false-option'
        }

        if (element.name == invalidOption) {
            optionClass += ' rac-invalid-option'
        }

        return (
            <div
                className={optionClass}
                onClick={(e) => selectOption(element, e)}
                onMouseEnter={() => !element.disabled && setHighlightedIndex(index)}
                key={element.id}
                id={optionId}
                role='option'
                aria-selected={selected?.id === element.id}
                aria-disabled={element.disabled}
            >
                {element.jsx ?? element.name}
            </div>
        )
    }), [normalizedOptions, selectOption, selectId, selected, highlightedIndex])

    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') {
            
            const receivedType = typeof options
            if (options && typeof options !== 'object') {
                console.error(
                    `%c[Select Library]:%c Invalid prop %coptions%c.\n` +
                    `Expected %cArray%c or %cObject%c, but received %c${receivedType}%c.\n`,
                    'color: #ff4d4f; font-weight: bold;', 'color: default;',
                    'color: #1890ff; font-weight: bold;', 'color: default;',
                    'color: #52c41a; font-weight: bold;', 'color: default;',
                    'color: #52c41a; font-weight: bold;', 'color: default;',
                    'color: #ff4d4f; font-weight: bold;', 'color: default;'
                )
            }

            if (isControlled && defaultValue !== undefined) {
                console.warn(
                    `%c[Select Library]:%c .\n` +
                    ``,
                    'color: #faad14; font-weight: bold;', 'color: default;'
                )
            }
        }
    }, [options, value, defaultValue, isControlled])

    return(
        <SelectContext.Provider
            value={{registerOption, unregisterOption}}
        >
            {children}
            {renderedDropdown}
            <div
                className={`rac-select
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
                    className={`rac-select-title ${selected?.type == 'boolean'
                        ? selected.raw ? 'rac-true-option' : 'rac-false-option'
                        : ''
                    }`}
                >
                    {title}
                    <SlideLeft
                        visibility={loading && !error}
                    >
                        <span className='rac-loading-dots'>
                            <i></i><i></i><i></i>
                        </span>
                    </SlideLeft>
                </div>
                <div
                    className='rac-select-buttons'
                >
                    <SlideLeft
                        visibility={hasActualValue && hasOptions && !disabled && !loading && !error}
                    >
                        <XMarkIcon
                            className='rac-select-cancel'
                            role='button'
                            aria-label='Clear selection'
                            onClick={(e) => clear(e)}
                        />
                    </SlideLeft>
                    <SlideLeft
                        visibility={active}
                    >
                        <span
                            className={`rac-select-arrow-wrapper
                                ${visibility ? '--open' : ''}
                                ${(!hasOptions || disabled) ? 'rac-disabled-style' : ''}
                                ${loading ? 'rac-loading-style' : ''}
                                ${error ? 'rac-error-style' : ''}`
                            }
                        >
                            <ArrowUpIcon
                                className='rac-select-arrow-wrapper'
                            />
                        </span>
                    </SlideLeft>
                </div>
                <Options
                    visibility={visibility}
                    selectRef={selectRef}
                    onAnimationDone={() => setAnimationFinished(true)}
                >
                    <div
                        className='rac-select-list'
                        role='listbox'
                        aria-label='Options'
                        style={{
                            // '--select-border': visibility ? '2px solid #2a2f38' : '2px solid transparent',
                            '--select-background': visibility ? '#1f1f1f' : 'transparent',
                            '--opacity': visibility ? 1 : 0
                        }}
                    >
                        {renderOptions}
                    </div>
                </Options>
            </div>
        </SelectContext.Provider>
    )
}