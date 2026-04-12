import {XMarkIcon, ArrowUpIcon, CheckmarkIcon} from './icons'
import {forwardRef, useImperativeHandle, useRef, useMemo, useState, useEffect, useCallback, useId, isValidElement, cloneElement} from 'react'
import SelectJSX from './selected-items/SelectJSX'
import useSelectLogic from './useSelectLogic'
import useSelect from './useSelect'
import SlideDown from './slideDown'
import SlideLeft from './slideLeft'
import {makeId} from './makeId'
import './select.css'

// universal icon display
const renderIcon = (Icon, defaultProps) => {
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
const getOptionClassName = (element, index, highlightedIndex, selectedId, loadingTitle, loadMoreText, invalidOption, selectedIDs) => {
    const multipleSelected = selectedIDs?.some(o => o.id === element.id)

    if (element.groupHeader) return 'rac-select-option rac-group-option'

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
    visibility: externalVisibility,
    setVisibility: setExternalVisibility = () => {},
    ownBehavior = false,
    duration = 300,
    easing = 'ease-in',
    offset = 1,
    animateOpacity = true,
    style = {},
    className = '',
    OpenIcon = ArrowUpIcon,
    ClearIcon = XMarkIcon,
    DelIcon = XMarkIcon,
    Checkmark = CheckmarkIcon,
    Checkbox = undefined,
    hasMore = false,
    loadMore = () => console.warn('loadMore not implemented'),
    loadButton = false,
    loadButtonText = 'Load more',
    loadMoreText = 'Loading',
    selectedText = undefined,
    loadOffset = 100,
    loadAhead = 3,
    optionsClassName = '',
    onOpen = () => {},
    onClose = () => {},
    deleteInline = false,
    showDelete = false,
    ...props
}, ref) => {

    const reactId = useId()
    const selectId = useMemo(() => reactId.replace(/:/g, ''), [reactId])
    const [jsxOptions, setJsxOptions] = useState([])
    const [internalVisibility, setInternalVisibility] = useState(false)
    const [loadingTitle, setLoadingTitle] = useState(loadButton ? loadButtonText : loadMoreText)
    const [animationFinished, setAnimationFinished] = useState(false)
    const selectRef = useRef(null)
    const [deleting, setDeleting] = useState(false)

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
    const isControlled = externalVisibility !== undefined

    const visibility = useMemo(() => {
        if (ownBehavior) return !!externalVisibility
        return isControlled ? !!externalVisibility : internalVisibility
    }, [ownBehavior, isControlled, externalVisibility, internalVisibility])
    
    const setVisibility = useCallback((newState) => {
        if (ownBehavior) return
        !isControlled && setInternalVisibility(newState)
        setExternalVisibility?.(newState)
    }, [ownBehavior, isControlled, setExternalVisibility])

    const logic = useSelectLogic({
        ...props, visibility, setVisibility, jsxOptions, hasMore, 
        loadButton, loadingTitle, loadMore, loadMoreText, setLoadingTitle
    })

    const {multiple, normalizedOptions, selected, selectOption, clear, removeOption, hasOptions, active, selectedValue, disabled, loading, error, placeholder, invalidOption, emptyText, disabledText, loadingText, errorText, expandedGroups, selectedIDs, setSelectedIds} = logic

    const behavior = useSelect({setDeleting, setLoadingTitle, loadButton, loadButtonText, hasMore, loadMore, disabled, multiple, open: visibility, setOpen: setVisibility, options: normalizedOptions, selectOption, selected, loadOffset, loadAhead, expandedGroups, selectedIDs, onOpen, onClose, deleting})

    const {handleListScroll, handleBlur, handleFocus, toggleVisibility, handleKeyDown, highlightedIndex, setHighlightedIndex} = behavior

    useImperativeHandle(ref, () => selectRef.current)

    useEffect(() => {
        if (!visibility) {
            setAnimationFinished(false)
            return
        }
        
        if (visibility && selectRef.current) {
            if (document.activeElement !== selectRef.current) {
                selectRef.current.focus()
            }
        }
    }, [visibility])

    useEffect(() => {(error || disabled || loading || !hasOptions) && setVisibility(false)}, [error, disabled, loading, hasOptions, setVisibility])

    useEffect(() => {isControlled && setInternalVisibility(!!externalVisibility)}, [externalVisibility, isControlled])

    useEffect(() => {
        if (visibility && animationFinished && highlightedIndex !== -1) {
            const option = normalizedOptions[highlightedIndex]
            if (option) {
                const domElement = document.getElementById(`${selectId}-${makeId(option.id)}`)
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
        if (hasActualValue && selectedText) return selectedText

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
                    visibility={expandedGroups.has(name)}
                    className='rac-group-container'
                    key={`slide-${name}`}
                >
                    {currentGroupChildren}
                </SlideDown>
            )
            currentGroupChildren = []
        }

        const createOptionNode = (element, index) => (
            <div
                className={getOptionClassName(element, index, highlightedIndex, selected?.id, loadingTitle, loadMoreText, invalidOption, selectedIDs)}
                style={{...element.style, ...(element.loading ? {justifyContent: 'initial', alignItems: 'end', gap: 0} : {})}}
                onMouseEnter={() => (!element.disabled && !element.loading) && setHighlightedIndex(index)}
                onClick={(e) => !element.loading && selectOption(element, e)}
                aria-disabled={element.disabled || element.loading}
                aria-selected={selected?.id === element.id}
                id={`${selectId}-${makeId(element.id)}`}
                key={element.id}
                role='option'   
            >
                {element.jsx
                    ? <div className='rac-jsx-option'>{element.jsx}</div>
                    : <span className='rac-option-title'>{element.name}</span>
                }
                {element.loading &&
                    <span
                        style={{paddingBottom: '0.1em'}}
                        className='rac-loading-dots'
                    >
                        <i/><i/><i/>
                    </span>
                }
                {(multiple && !element.disabled) &&
                    <div className={`rac-checkbox${Checkbox ? '' : '-default'}`}>
                        {renderIcon(Checkmark, {
                            style: {position: !Checkbox ? 'relative' : ''},
                            className: `
                                rac-checkmark
                                ${selectedIDs?.some(o => o.id === element.id)
                                    ? '--checked'
                                    : ''
                        }`})}
                        {renderIcon(Checkbox, {className: 'rac-check-box'})}
                    </div>}
                
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
                        className={[
                            'rac-group-header',
                            element.disabled && 'rac-disabled-group',
                            element.className
                        ].filter(Boolean).join(' ')}
                        onClick={(e) => selectOption(element, e)}
                        style={element.style}
                        key={element.id}
                        id={element.id}
                    >
                        <span className='rac-group-title-text'>{element.name}</span>
                        <SlideLeft
                            visibility={hasChildren && !element.disabled}
                            style={{display: 'grid'}}
                            duration={duration}
                        >
                            {renderIcon(OpenIcon, {className: `rac-group-arrow ${open ? '--open' : ''}`})}
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
    }, [normalizedOptions, selectOption, selectId, selected, highlightedIndex, loadingTitle, loadMoreText, invalidOption, setHighlightedIndex, expandedGroups, OpenIcon])

    return (
        <SelectJSX
            setDeleting={setDeleting}
            deleting={deleting}
            selectedText={selectedText}
            selectRef={selectRef}
            selectId={selectId}
            selectedIDs={selectedIDs}
            setSelectedIds={setSelectedIds}
            multiple={multiple}
            removeOption={removeOption}
            optionsClassName={optionsClassName}
            
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
            toggleVisibility={toggleVisibility}
            handleKeyDown={handleKeyDown}
            handleListScroll={handleListScroll}
            selectOption={selectOption}
            clear={clear}
            registerOption={registerOption}
            unregisterOption={unregisterOption}
            
            children={children}
            placeholder={placeholder}
            className={className}
            style={style}
            duration={duration}
            easing={easing}
            offset={offset}
            animateOpacity={animateOpacity}
            unmount={unmount}
            OpenIcon={OpenIcon}
            ClearIcon={ClearIcon}
            DelIcon={DelIcon}
            hasMore={hasMore}
            loadButton={loadButton}
            deleteInline={deleteInline}
            showDelete={showDelete}
        />
    )
})

export default Select