import {memo, useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react'
import {TransitionGroup} from 'react-transition-group'
import {SelectContext} from '../selectContext'
import RenderedItem from './RenderedItem'
import SlideLeft from '../slideLeft'
import Animated from '../animated'
import Options from '../options'

const getHorizontalMargin = (el) => {
    const style = window.getComputedStyle(el)
    return parseFloat(style.marginLeft) + parseFloat(style.marginRight)
}

// calculates total width for each row of elements
const getRowWidths = (elements) => {
    return elements.reduce((acc, el) => {
        const top = el.offsetTop
        const width = el.getBoundingClientRect().width
        acc[top] = (acc[top] || 0) + width
        return acc
    }, {})
}

const SelectJSX = memo(({deleteInline, selectRef, setVisibility, selectId, removeOption, renderOptions, selected, selectedIDs, setSelectedIds, normalizedOptions, title, visibility, active, hasOptions, hasActualValue, optionsClassName, selectedText, disabled, loading, error, registerOption, unregisterOption, handleBlur, handleFocus, toggleVisibility, handleKeyDown, handleListScroll, setAnimationFinished, clear, children, placeholder, className, style, duration, easing, offset, animateOpacity, unmount, OpenIcon, ClearIcon, DelIcon, renderIcon, hasMore, loadButton, deleting, setDeleting, showDelete}) => {

    const [bottomDirection, setBottomDirection] = useState(false)
    const [selectHeight, setSelectHeight] = useState(null)
    const [spacer, setSpacer] = useState(false)
    const [spacerWidths, setSpacerWidths] = useState({})
    const [swipedId, setSwipedId] = useState(null)
    const [activeHoverId, setActiveHoverId] = useState(null)
    const [leaving, setLeaving] = useState(false)
    const [entering, setEntering] = useState(false)

    const firstMount = useRef(true)
    const optionRef = useRef(null)

    const remove = useCallback((id) => {
        if (removeOption) {
            removeOption(id)
        } else {
            setSelectedIds(prev => prev.filter(o => o.id !== id))
        }
    }, [removeOption, setSelectedIds])
    
    const safeToggle = useCallback((e) => {
        if (deleting) {
            e.stopPropagation()
            e.preventDefault()
            setDeleting(false)
            return
        }
        toggleVisibility(e)
    }, [deleting, toggleVisibility])

    const registerItemWidth = useCallback((id, width) => {
        setSpacerWidths(prev => {
            if (prev[id] === width) return prev
            return {...prev, [id]: width}
        })
    }, [])

    useLayoutEffect(() => {
        const element = optionRef.current
        if (!element) return

        const observer = new ResizeObserver((entries) => {
            window.requestAnimationFrame(() => {
                if (!Array.isArray(entries) || !entries.length) return
                
                const newHeight = entries[0].contentRect.height
                
                setSelectHeight(newHeight)
            })
        })

        observer.observe(element)

        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        firstMount.current = false
        if (selectRef) {
            if (typeof selectRef === 'function') selectRef(selectRef.current)
            else selectRef.current = selectRef.current
        }
    }, [selectRef])

    useEffect(() => {
        (deleting && visibility && toggleVisibility()) && toggleVisibility?.()
        (deleting && selectedIDs?.length === 0) && setDeleting(false)
        setActiveHoverId(null)
    }, [selectedIDs?.length, deleting])

    useLayoutEffect(() => {
        const container = optionRef.current
        // terminate if options are missing or option container is invalid
        if (!container || !selectedIDs?.length || deleting) {
            if (!selectedIDs?.length) setSpacer({state: false, id: null, width: 0})
            return
        }

        // getting actual list of options in DOM 
        const items = Array.from(container.children)
            .filter(item => item.classList.contains('rac-multiple-option'))

        // option width
        const containerWidth = container.clientWidth

        // deletion case: checks if there are more options in the DOM than in the SelectedIDs array (cuz TransitionGroup keeps elements in DOM for exit animations)
        if (items.length > selectedIDs.length) {
            const selectedIdsSet = new Set(selectedIDs.map(s => s.id))

            // find the index of the element that being removed from the state
            const removeIdx = items.findIndex(item => !selectedIdsSet.has(item.id))
            if (removeIdx === -1) return

            const elementToRemove = items[removeIdx]
            const prevElement = items[removeIdx - 1]

            // check if option is first in row; if not, it won't need a spacer
            const optFirst = prevElement && elementToRemove.offsetTop !== prevElement.offsetTop

            if (!optFirst) {
                setSpacer({state: false, id: null, width: 0})
                return
            }

            // group elements by their vertical position to calculate row-based metrics
            const rows = getRowWidths(items)
            const rowOffsets = Object.keys(rows).map(Number).sort((a, b) => a - b)
            const elementRowIndex = rowOffsets.indexOf(elementToRemove.offsetTop)

            // first row check
            if (elementRowIndex <= 0) {
                setSpacer({state: false, id: null, width: 0})
                return
            }

            const prevRowTop = rowOffsets[elementRowIndex - 1]
            const prevRowWidth = rows[prevRowTop]

            // calculate remaining empty space in the previous row
            const remaining = containerWidth - prevRowWidth

            // set info for spacer appearance
            updateSpacer(prevElement?.id || null, true, remaining)
        } 

        // adding case
        else if (items.length === selectedIDs.length) {
            const lastItem = items[items.length - 1]
            const lastId = selectedIDs[selectedIDs.length - 1]?.id
            const lastItemWidth = spacerWidths[lastId]

            if (!lastItemWidth) return
            
            // calculating margin sizes
            const targetForMargin = lastItem?.firstElementChild || lastItem
            // 
            const childMargin = getHorizontalMargin(targetForMargin)
            const parentMargin = getHorizontalMargin(lastItem)
            
            // analyze previous items to determine current row layout
            const otherItems = items.slice(0, -1)
            const rows = getRowWidths(otherItems)
            const rowOffsets = Object.keys(rows).map(Number).sort((a, b) => a - b)

            let remaining = containerWidth
            if (rowOffsets.length > 0) {
                // calculate available space in the very last row
                const lastRowTop = Math.max(...rowOffsets)
                remaining = containerWidth - (rows[lastRowTop] || 0)
            }

            // spacer is required if the new item's width exceeds the remaining space (causing a wrap)
            const spacerNeeded = (lastItemWidth + childMargin + parentMargin) > remaining
            const prevId = selectedIDs[selectedIDs.length - 2]?.id

            updateSpacer(prevId, spacerNeeded, remaining)
        }
        /**
        * updates spacer state only if the values have changed to prevent unnecessary re-renders
        * @param {string|number|null} id — ID of the reference element for the spacer (preceding element in deletion, current in addition)
        * @param {boolean} state — whether the spacer should be active
        * @param {number} width — calculated width for the spacer
        */
        function updateSpacer(id, state, width) {
            setSpacer(prev => {
                if (prev.id === id && prev.state === state && prev.width === width) return prev
                return {state, id, width}
            })
        }
    }, [selectedIDs, spacerWidths, deleting])

    const deleteIcon = ClearIcon && hasActualValue && hasOptions && !disabled && !loading && !error && !deleting
    const openIcon = OpenIcon && active && !deleting

    const renderSelectIDs = selectedIDs?.map((element, index) => {
        const delSpacer = index === selectedIDs.length - 1
        return (
            <RenderedItem
                normalizedOptions={normalizedOptions}
                registerItemWidth={registerItemWidth}
                setActiveHoverId={setActiveHoverId}
                swiped={swipedId === element.id}
                activeHoverId={activeHoverId}
                setVisibility={setVisibility}
                deleteInline={deleteInline}
                key={element.id ?? index}
                setDeleting={setDeleting}
                setEntering={setEntering}
                setLeaving={setLeaving}
                renderIcon={renderIcon}
                showDelete={showDelete}
                selectRef={selectRef}
                setSpacer={setSpacer}
                onSwipe={setSwipedId}
                delSpacer={delSpacer}
                duration={duration}
                deleting={deleting}
                swipedId={swipedId}
                leaving={leaving}
                element={element}
                DelIcon={DelIcon}
                spacer={spacer}
                remove={remove}
                index={index}
            />
    )})
    
    return (
        <SelectContext.Provider value={{registerOption, unregisterOption}}>
            {children}
            <div
                ref={selectRef}
                style={{
                    '--rac-duration-fast': 'calc(var(--rac-duration) * 0.5)',
                    '--rac-duration-slow': 'calc(var(--rac-duration) * 1.3)',
                    '--rac-duration-base': 'var(--rac-duration)',
                    '--rac-duration': `${duration}ms`,
                    ...style,
                }}
                className={`
                    ${(!hasOptions || disabled) ? 'rac-disabled-style' : ''}
                    ${loading ? 'rac-loading-style' : ''}
                    ${error ? 'rac-error-style' : ''}
                    ${className}
                    rac-select
                `}
                {...(active && {
                    onKeyDown: handleKeyDown,
                    onFocus: handleFocus,
                    onClick: safeToggle,
                    onBlur: handleBlur
                })}
                aria-disabled={disabled || !hasOptions}
                aria-controls={`${selectId}-listbox`}
                tabIndex={active ? 0 : -1}
                aria-expanded={visibility}
                aria-label={placeholder}
                aria-haspopup='listbox'
                role='combobox'
            >
                <div
                    className={`rac-select-title-wrapper
                        ${(!error && !loading && selected?.type === 'boolean')
                    ?
                        (selected.raw ? 'rac-true-option' : 'rac-false-option')
                    : ''}
                    `}
                    style={{
                        alignItems: (selectedIDs?.length && !selectedText) ? 'flex-start' : 'center',
                        height: selectHeight ? `${selectHeight}px` : 'auto',
                        overflow: (leaving || entering) ? 'hidden' : '',
                    }}
                >
                    <div
                        style={{
                            alignItems: (selectedIDs?.length && !selectedText) ? 'flex-start' : 'center',
                            height: loading ? '100%' : 'auto',
                            flexWrap: (leaving || entering) ? 'nowrap' : '',
                        }}
                        className='rac-select-title'
                        ref={optionRef}
                    >
                        <TransitionGroup
                            enter={!firstMount.current}
                            component={null}
                            appear={false}
                        >
                            {selectedIDs?.length && !selectedText && !loading ?
                                renderSelectIDs
                            :
                                <Animated
                                    // key={hasActualValue ? title : 'placeholder'}
                                    className='rac-title-container'
                                    duration={duration}
                                    key={title}
                                    widthMode
                                >
                                    <span className='rac-title-text'>
                                        {title}
                                    </span>
                                    <SlideLeft
                                        className='rac-loading-container'
                                        visibility={loading && !error}
                                        duration={duration}
                                    >
                                        <span className='rac-loading-dots'>
                                            <i/><i/><i/>
                                        </span>
                                    </SlideLeft>
                                </Animated>
                            }
                        </TransitionGroup>
                    </div>
                </div>

                <SlideLeft
                    visibility={deleteIcon || openIcon}
                    className='rac-select-buttons'
                >
                    <TransitionGroup component={null}>
                        {deleteIcon &&
                            <SlideLeft
                                style={{display: 'grid'}}
                                duration={duration}
                                key='clear-icon'
                            >
                                {renderIcon(ClearIcon, { 
                                    className: 'rac-select-cancel', 
                                    onMouseDown: e => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                    }, 
                                    onClick: clear 
                                })}
                            </SlideLeft>
                        } {openIcon &&
                            <SlideLeft
                                style={{display: 'grid'}}
                                duration={duration}
                                key='open-button'
                            >
                                {renderIcon(OpenIcon, {className: `rac-select-arrow ${visibility ? '--open' : ''} ${!bottomDirection ? '--up' : ''}`})}
                            </SlideLeft>
                        }
                    </TransitionGroup>
                </SlideLeft>

                <Options
                    style={{'--rac-duration': `${duration}ms`, ...style}}
                    visibility={visibility && normalizedOptions.length}
                    onAnimationDone={() => setAnimationFinished(true)}
                    setBottomDirection={setBottomDirection}
                    animateOpacity={animateOpacity}
                    className={optionsClassName}
                    selectRef={selectRef}
                    duration={duration}
                    unmount={unmount}
                    easing={easing}
                    offset={offset}
                >
                    <div
                        onScroll={handleListScroll}
                        className='rac-select-list'
                        aria-label='Options'
                        role='listbox'
                        tabIndex='-1'
                    >
                        {renderOptions}
                        {(!loadButton && hasMore) &&
                            <div
                                className='rac-select-option rac-disabled-option rac-loading-option'
                                style={{justifyContent: 'initial', alignItems: 'end', gap: 0}}
                                onClick={e => e.stopPropagation()}
                            >
                                <span className='rac-loading-option-title'>Loading</span>
                                <div className='rac-loading-container'>
                                    <span
                                        style={{paddingBottom: '0.1em'}}
                                        className='rac-loading-dots'
                                    >
                                        <i/><i/><i/></span>
                                </div>
                            </div>
                        }
                    </div>
                </Options>
            </div>
        </SelectContext.Provider>
    )
})

export default SelectJSX