import {memo, useCallback} from 'react'
import {SelectContext} from './selectContext'
import Options from './options'
import SlideLeft from './slideLeft'
import Animated from './animated'
import {TransitionGroup} from 'react-transition-group'

const SelectedItem = memo(({element, index, remove, renderIcon, DelIcon, normalizedOptions}) => {
    let label = null

    if (element?.jsx) {
        label = element.jsx
    } else if (element?.name) {
        label = element.name
    } else if (element?.raw !== undefined) {
        const recovered = normalizedOptions.find(o =>
            o.raw === element.raw ||
            o.original === element.raw ||
            o.userId === element.raw
        )
        if (recovered) {
            label = recovered.jsx ?? recovered.name
        }
    }

    if (label == null) {
        label = typeof element === 'object' 
            ? (element.label ?? element.name ?? element.value ?? 'Selected item') 
            : String(element)
    }

    const handleDelete = useCallback((e) => {
        e.stopPropagation()
        e.preventDefault()
        remove(element.id)
    }, [element.id, remove])

    return (
        <div className='rac-multiple-selected-option'>
            {label} 
            {renderIcon(DelIcon, {onClick: handleDelete})}
        </div>
    )
})

const SelectJSX = memo(({
    selectRef,
    selectId,
    
    renderOptions,
    selected,
    selectedIDs,
    setSelectedIds,
    normalizedOptions,
    title,
    visibility,
    active,
    hasOptions,
    hasActualValue,
    
    disabled,
    loading,
    error,
    
    registerOption,
    unregisterOption,
    handleBlur,
    handleFocus,
    handleToggle,
    handleKeyDown,
    handleListScroll,
    setAnimationFinished,
    clear,
    
    children,
    renderedDropdown,
    placeholder,
    className,
    style,
    duration,
    easing,
    offset,
    animateOpacity,
    unmount,
    ArrowIcon,
    ClearIcon,
    DelIcon,
    renderIcon,
    hasMore,
    loadButton
}) => {

    const remove = useCallback((id) => {
        setSelectedIds(prev => prev.filter(o => o.id !== id))
    }, [setSelectedIds])

    const renderSelectIDs = selectedIDs.map((element, index) => (
        <Animated
            key={element.id ?? index}
            duration={duration}
        >
            <SelectedItem 
                key={element.id ?? index}
                element={element}
                index={index}
                remove={remove}
                renderIcon={renderIcon}
                DelIcon={DelIcon}
                normalizedOptions={normalizedOptions}
            />
        </Animated>
    ))

    return (
        <SelectContext.Provider
            value={{registerOption, unregisterOption}}
        >
            {children}
            {renderedDropdown}
            <div
                ref={selectRef}
                style={{'--rac-duration': `${duration}ms`, ...style}}
                className={
                    `rac-select
                    ${className}
                    ${(!hasOptions || disabled) ? 'rac-disabled-style' : ''}
                    ${loading ? 'rac-loading-style' : ''}
                    ${error ? 'rac-error-style' : ''}`}
                tabIndex={active ? 0 : -1}
                role='combobox'
                aria-haspopup='listbox'
                aria-expanded={visibility}
                aria-controls={`${selectId}-listbox`}
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
                    className={
                        `rac-select-title
                                ${(!error && !loading && selected?.type === 'boolean')
                            ?
                                (selected.raw ? 'rac-true-option' : 'rac-false-option')
                            : ''}
                    `}
                >
                    <TransitionGroup component={null}>
                        {selectedIDs.length ? renderSelectIDs :
                            <Animated
                                key='placeholder-content'
                                duration={duration}
                            >
                                <span className='rac-title-text' key={title}>{title}</span>
                                <SlideLeft visibility={loading && !error} duration={duration}>
                                    <span className='rac-loading-dots'><i/><i/><i/></span>
                                </SlideLeft>
                            </Animated>
                        }
                    </TransitionGroup>
                </div>

                <div className='rac-select-buttons'>
                    <SlideLeft
                        visibility={hasActualValue && hasOptions && !disabled && !loading && !error}
                        duration={duration}
                        style={{display: 'grid'}}
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
                        {!loadButton && hasMore && (
                            <div
                                className='rac-select-option rac-disabled-option rac-loading-option'
                                onClick={e => e.stopPropagation()}
                            >
                                <span className='rac-loading-option-title'>Loading</span>
                                <span className='rac-loading-dots'><i/><i/><i/></span>
                            </div>
                        )}
                    </div>
                </Options>
            </div>
        </SelectContext.Provider>
    )
})

export default SelectJSX