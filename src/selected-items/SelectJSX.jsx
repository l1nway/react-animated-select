import {TransitionGroup} from 'react-transition-group'
import {SelectContext} from '../selectContext'
import useItemsLogic from './useItemsLogic'
import {renderIcon} from '../selectUtils'
import RenderedItem from './RenderedItem'
import useDirection from './useDirection'
import SlideLeft from '../slideLeft'
import Animated from '../animated'
import Options from '../options'
import {memo} from 'react'

const SelectJSX = memo((props) => {
    const {state, setState, optionRef, firstMount, remove, safeToggle, registerItemWidth, delIcon} = useItemsLogic(props)
    const {bottomDirection, selectHeight, swipedId, rowEndIds, delWidth} = state
    
    const {selectRef, selectId, renderOptions, selected, selectedIDs, normalizedOptions, title, visibility, active, hasOptions, hasActualValue, optionsClassName, selectedText, disabled, loading, error, registerOption, unregisterOption, handleBlur, handleFocus, handleKeyDown, handleListScroll, setAnimationFinished, clear, children, placeholder, className, style, duration, easing, offset, animateOpacity, unmount, OpenIcon, ClearIcon, DelIcon, hasMore, loadButton, deleting} = props

    useDirection({visibility, selectRef, setBottomDirection: (val) => setState({bottomDirection: val})})
    const deleteIcon = ClearIcon && hasActualValue && hasOptions && !disabled && !loading && !error && !deleting
    const openIcon = OpenIcon && active && !deleting

    const renderSelectIDs = selectedIDs?.map((element, index) => 
        <RenderedItem
            rowEnd={rowEndIds.includes(element.id)}
            registerItemWidth={registerItemWidth}
            swiped={swipedId === element.id}
            setState={setState}
            element={element}
            key={element.id}
            remove={remove}
            index={index}
            {...props}
            {...state}
        />
    )
    
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
                    }}
                >
                    <div
                        style={{
                            alignItems: (selectedIDs?.length && !selectedText) ? 'flex-start' : 'center',
                            height: loading ? '100%' : 'auto',
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
                                        e.stopPropagation()
                                        e.preventDefault()
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
                    setBottomDirection={(val) => setState({bottomDirection: val})}
                    style={{'--rac-duration': `${duration}ms`, ...style}}
                    visibility={visibility && normalizedOptions.length}
                    onAnimationDone={() => setAnimationFinished(true)}
                    bottomDirection={state.bottomDirection}
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
                                    <span className='rac-loading-dots'><i/><i/><i/></span>
                                </div>
                            </div>
                        }
                    </div>
                </Options>
            </div>
            {/* used to calculate actual size of icon (for example, if user has customized it) */}
            {!delWidth &&
                <div style={{position: 'absolute', visibility: 'hidden', pointerEvents: 'none', zIndex: -1}}>
                    <div ref={delIcon}>
                        {renderIcon(DelIcon)}
                    </div>
                </div>
            }
        </SelectContext.Provider>
    )
})

export default SelectJSX