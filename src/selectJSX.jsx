import {memo} from 'react'
import {SelectContext} from './selectContext'
import Options from './options'
import SlideLeft from './slideLeft'

const SelectJSX = memo(({
    selectRef,
    selectId,
    
    renderOptions,
    selected,
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
    renderIcon,
    hasMore,
    loadButton
}) => {
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
                <div className={`rac-select-title ${(!error && !loading && selected?.type === 'boolean') ? (selected.raw ? 'rac-true-option' : 'rac-false-option') : ''}`}>
                    <span className='rac-title-text' key={title}>{title}</span>
                    <SlideLeft visibility={loading && !error} duration={duration}>
                        <span className='rac-loading-dots'><i/><i/><i/></span>
                    </SlideLeft>
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