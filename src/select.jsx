import './select.css'
import {XMarkIcon, ArrowUpIcon, CheckmarkIcon} from './icons'
import {forwardRef, useImperativeHandle, useRef, useMemo, useState, useEffect, useCallback, useId, isValidElement, cloneElement} from 'react'
import {makeId} from './makeId'

import SelectJSX from './SelectJSX'
import useSelect from './useSelect'
import useSelectLogic from './useSelectLogic'
import SlideDown from './slideDown'
import SlideLeft from './slideLeft'

// universal icon display
const renderIcon = (Icon, defaultProps) => {
    if (!Icon) return null
    if (typeof Icon === 'string') return <img src={Icon} {...defaultProps} alt=''/>
    if (isValidElement(Icon)) return cloneElement(Icon, defaultProps)
    if (typeof Icon === 'function' || (typeof Icon === 'object' && Icon.$$typeof)) {
        const IconComponent = Icon
        return <IconComponent {...defaultProps}/>
    }
    return null
}

// adding classes to style options according to their state
const getOptionClassName = (element, index, highlightedIndex, selectedId, loadingTitle, loadMoreText, invalidOption, selectedIDs) => {
    const multipleSelected = selectedIDs.some(o => o.id === element.id)

    if (element.groupHeader) {
        return 'rac-select-option rac-group-option'
    }

    return [
        'rac-select-option',
        element.className,
        (multipleSelected || selectedId === element.id) && 'rac-selected',
        index === highlightedIndex && 'rac-highlighted',
        (element.disabled || element.loading) && 'rac-disabled-option',
        (element.invalid || element.name === invalidOption) && 'rac-invalid-option',
        (element.loadMore && loadingTitle === loadMoreText) && 'rac-loading-option',
        typeof element.raw === 'boolean' && (element.raw ? 'rac-true-option' : 'rac-false-option')
    ].filter(Boolean).join(' ')
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
    DelIcon = XMarkIcon,
    CheckIcon = CheckmarkIcon,
    hasMore = false,
    loadMore = () => {console.warn('loadMore not implemented')},
    loadButton = false,
    loadButtonText = 'Load more',
    loadMoreText = 'Loading',
    loadOffset = 100,
    loadAhead = 3,
    childrenFirst = false,
    groupsClosed = false,
    ...props
}, ref) => {

    const reactId = useId()
    const selectId = useMemo(() => reactId.replace(/:/g, ''), [reactId])
    const [jsxOptions, setJsxOptions] = useState([])
    const [internalVisibility, setInternalVisibility] = useState(false)
    const [loadingTitle, setLoadingTitle] = useState(loadButton ? loadButtonText : loadMoreText)
    const [animationFinished, setAnimationFinished] = useState(false)
    const selectRef = useRef(null)


    const registerOption = useCallback((opt) => {
        setJsxOptions(prev => {
            const index = prev.findIndex(o => o.id === opt.id)
            if (index !== -1) {
                const existing = prev[index]
                if (
                    existing.label === opt.label &&
                    existing.value === opt.value &&
                    existing.disabled === opt.disabled &&
                    existing.group === opt.group
                ) {
                    return prev
                }
                const next = [...prev]
                next[index] = opt
                return next
            }
            return [...prev, opt]
        })
    }, [])

    const unregisterOption = useCallback((id) => {
        setJsxOptions(prev => {
            const filtered = prev.filter(o => o.id !== id)
            return filtered.length === prev.length ? prev : filtered
        })
    }, [])

    // select visibility control
    const visibility = alwaysOpen ? true : (ownBehavior ? !!externalVisibility : internalVisibility)
    
    const setVisibility = useCallback((newState) => {
        if (alwaysOpen || ownBehavior) return
        setInternalVisibility(newState)
    }, [alwaysOpen, ownBehavior])

    const logic = useSelectLogic({
        ...props, visibility, setVisibility, jsxOptions, hasMore, 
        loadButton, loadingTitle, loadMore, loadMoreText, setLoadingTitle, childrenFirst, groupsClosed
    })

    const {multiple, normalizedOptions, selected, selectOption, clear, hasOptions, active, selectedValue, disabled, loading, error, placeholder, invalidOption, emptyText, disabledText, loadingText, errorText, expandedGroups, selectedIDs, setSelectedIds} = logic

    const behavior = useSelect({setLoadingTitle, loadButton, loadButtonText, hasMore, loadMore, disabled, multiple, open: visibility, setOpen: setVisibility, options: normalizedOptions, selectOption, selected, loadOffset, loadAhead, expandedGroups})

    const {handleListScroll, handleBlur, handleFocus, handleToggle, handleKeyDown, highlightedIndex, setHighlightedIndex} = behavior

    useImperativeHandle(ref, () => selectRef.current)

    useEffect(() => {
        if (!visibility) setAnimationFinished(false)
    }, [visibility])

    useEffect(() => {
        if (error || disabled || loading || !hasOptions) setVisibility(false)
    }, [error, disabled, loading, hasOptions, setVisibility])

    useEffect(() => {
        if (visibility && animationFinished && highlightedIndex !== -1) {
            const option = normalizedOptions[highlightedIndex]
            if (option) {
                const domElement = document.getElementById(`opt-${selectId}-${makeId(option.id)}`)
                domElement?.scrollIntoView({block: 'nearest'})
            }
        }
    }, [highlightedIndex, visibility, animationFinished, normalizedOptions, selectId])

    const hasActualValue = useMemo(() => (
        selectedValue !== undefined && 
        selectedValue !== null && 
        !(Array.isArray(selectedValue) && selectedValue.length === 0) &&
        !(typeof selectedValue === 'object' && Object.keys(selectedValue).length === 0)
    ), [selectedValue])

    const title = useMemo(() => {
        if (error) return errorText
        if (loading) return loadingText
        if (disabled) return disabledText
        if (selected) return selected.jsx ?? selected.name
        
        if (hasActualValue) {
            const recovered = normalizedOptions.find(o => o.raw === selectedValue)
            if (recovered) return recovered.name
            return (typeof selectedValue === 'object' && selectedValue !== null) 
                ? (selectedValue.name ?? selectedValue.label ?? 'Selected Object') 
                : String(selectedValue)
        }
        return hasOptions ? placeholder : emptyText
    }, [disabled, loading, error, hasOptions, selected, selectedValue, placeholder, errorText, loadingText, disabledText, emptyText, hasActualValue, normalizedOptions])

    const renderOptions = useMemo(() => {
        const nodes = []
        let currentGroupChildren = []
        let currentGroupName = null

        const groupCounts = normalizedOptions.reduce((acc, opt) => {
            if (opt.group) {
                acc[opt.group] = (acc[opt.group] || 0) + 1
            }
            return acc
        }, {})

        const flushGroup = (name) => {
            if (name === null || currentGroupChildren.length === 0) return
            
            nodes.push(
                <SlideDown
                    key={`slide-${name}`}
                    visibility={expandedGroups.has(name)}
                >
                    {currentGroupChildren}
                </SlideDown>
            )
            currentGroupChildren = []
        }

        const createOptionNode = (element, index) => (
            <div
                key={element.id}
                id={`opt-${selectId}-${makeId(element.id)}`}
                role='option'
                aria-selected={selected?.id === element.id}
                aria-disabled={element.disabled || element.loading}
                className={getOptionClassName(element, index, highlightedIndex, selected?.id, loadingTitle, loadMoreText, invalidOption, selectedIDs)}
                onClick={(e) => !element.loading && selectOption(element, e)}
                onMouseEnter={() => (!element.disabled && !element.loading) && setHighlightedIndex(index)}
            >
                {element.jsx ?? element.name}
                {element.loading && <span className='rac-loading-dots'><i/><i/><i/></span>}
                {multiple && !element.disabled ? 
                    <div className='rac-checkbox'>
                        {renderIcon(
                            CheckmarkIcon, {
                                className: `
                                    rac-checkmark
                                    ${selectedIDs.some(o => o.id === element.id)
                                        ?
                                            '--checked'
                                        :
                                            ''
                        }`})}
                    </div> : null}
                
            </div>
        )

        normalizedOptions.forEach((element, index) => {
            const isHeader = element.groupHeader
            const belongsToGroup = !!element.group

            if (isHeader || (!belongsToGroup && currentGroupName !== null)) {
                flushGroup(currentGroupName)
                if (!isHeader) currentGroupName = null
            }

            if (isHeader) {
                currentGroupName = element.name
                const open = expandedGroups.has(element.name)
                const hasChildren = groupCounts[element.name] > 0

                nodes.push(
                    <div 
                        key={element.id} 
                        className={[
                            'rac-group-header',
                            element.disabled && 'rac-disabled-group'
                        ].filter(Boolean).join(' ')}
                        onClick={(e) => selectOption(element, e)}
                    >
                        <span className='rac-group-title-text'>{element.name}</span>
                        <SlideLeft
                            visibility={hasChildren && !element.disabled}
                            duration={duration}
                            style={{display: 'grid'}}
                        >
                            <span className={`rac-group-arrow-wrapper ${open ? '--open' : ''}`}>
                                {renderIcon(ArrowIcon, {className: 'rac-select-arrow-wrapper'})}
                            </span>
                        </SlideLeft>
                    </div>
                )
            } else if (belongsToGroup) {
                currentGroupChildren.push(createOptionNode(element, index))
            } else {
                nodes.push(createOptionNode(element, index))
            }
        })

        flushGroup(currentGroupName)

        return nodes
    }, [
        normalizedOptions, selectOption, selectId, selected, highlightedIndex, 
        loadingTitle, loadMoreText, invalidOption, setHighlightedIndex, 
        expandedGroups, ArrowIcon
    ])

    return (
        <SelectJSX 
            selectRef={selectRef}
            selectId={selectId}
            selectedIDs={selectedIDs}
            setSelectedIds={setSelectedIds}
            multiple={multiple}

            renderIcon={renderIcon}
            normalizedOptions={normalizedOptions}
            renderOptions={renderOptions}
            selected={selected}
            title={title}
            visibility={visibility}
            active={active}
            hasOptions={hasOptions}
            hasActualValue={hasActualValue}
            highlightedIndex={highlightedIndex}
            animationFinished={animationFinished}
            
            disabled={disabled}
            loading={loading}
            error={error}
            
            setVisibility={setVisibility}
            setHighlightedIndex={setHighlightedIndex}
            setAnimationFinished={setAnimationFinished}
            handleBlur={handleBlur}
            handleFocus={handleFocus}
            handleToggle={handleToggle}
            handleKeyDown={handleKeyDown}
            handleListScroll={handleListScroll}
            selectOption={selectOption}
            clear={clear}
            registerOption={registerOption}
            unregisterOption={unregisterOption}
            
            children={children}
            renderedDropdown={renderedDropdown}
            placeholder={placeholder}
            className={className}
            style={style}
            duration={duration}
            easing={easing}
            offset={offset}
            animateOpacity={animateOpacity}
            unmount={unmount}
            ArrowIcon={ArrowIcon}
            ClearIcon={ClearIcon}
            DelIcon={DelIcon}
            hasMore={hasMore}
            loadButton={loadButton}
        />
    )
})

export default Select