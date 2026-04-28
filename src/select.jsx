import {XMarkIcon, ArrowUpIcon, CheckmarkIcon} from './icons'
import {renderIcon, getOptionClassName} from './selectUtils'
import SelectJSX from './selected-items/SelectJSX'
import {forwardRef, useMemo} from 'react'
import useSelect from './useSelect'
import SlideDown from './slideDown'
import SlideLeft from './slideLeft'
import {makeId} from './makeId'
import './select.css'

const Select = forwardRef(({
    loadMore = () => console.warn('loadMore not implemented'),
    setVisibility: setExternalVisibility = () => {},
    visibility: externalVisibility,
    loadButtonText = 'Load more',
    Checkmark = CheckmarkIcon,
    loadMoreText = 'Loading',
    selectedText = undefined,
    OpenIcon = ArrowUpIcon,
    animateOpacity = true,
    ClearIcon = XMarkIcon,
    optionsClassName = '',
    Checkbox = undefined,
    deleteInline = false,
    ownBehavior = false,
    DelIcon = XMarkIcon,
    onClose = () => {},
    showDelete = false,
    easing = 'ease-in',
    loadButton = false,
    onOpen = () => {},
    loadOffset = 100,
    hasMore = false,
    className = '',
    duration = 300,
    loadAhead = 3,
    offset = 1,
    style = {},
    children,
    unmount,
    ...restProps
}, ref) => {

    const selectState = useSelect({externalVisibility, setExternalVisibility, ownBehavior, loadButton, loadButtonText, loadMoreText, loadMore, loadOffset, loadAhead, hasMore, onOpen, onClose, ref, props: restProps})

    const {logic, behavior, selectId, hasActualValue, loadingTitle} = selectState

    const {normalizedOptions, selected, multiple, selectedIDs, invalidOption, selectOption, hasOptions, error, loading, disabled, selectedValue, expandedGroups, placeholder, emptyText, errorText, loadingText, disabledText} = logic

    const {highlightedIndex, setHighlightedIndex} = behavior

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
            if (opt.group) acc[opt.group] = (acc[opt.group] || 0) + 1
            return acc
        }, {})

        const flushGroup = (name) => {
            if (name === null || currentGroupChildren.length === 0) return
            
            nodes.push(
                <SlideDown
                    visibility={expandedGroups.has(name)}
                    className='rac-group-container'
                    key={`slide-${name}`}
                    duration={duration}
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
            )}
            else if (belongsToGroup) currentGroupChildren.push(createOptionNode(element, index))
            else nodes.push(createOptionNode(element, index))
        })

        flushGroup(currentGroupName)

        return nodes
    }, [normalizedOptions, selectOption, selectId, selected, highlightedIndex, loadingTitle, loadMoreText, invalidOption, setHighlightedIndex, expandedGroups, OpenIcon])

    return (
        <SelectJSX
            optionsClassName={optionsClassName}
            animateOpacity={animateOpacity}
            renderOptions={renderOptions}
            deleteInline={deleteInline}
            showDelete={showDelete}
            className={className}
            ClearIcon={ClearIcon}
            Checkmark={Checkmark}
            OpenIcon={OpenIcon}
            Checkbox={Checkbox}
            duration={duration}
            children={children}
            DelIcon={DelIcon}
            unmount={unmount}
            {...selectState}
            easing={easing}
            offset={offset}
            title={title}
            style={style}
            {...behavior}
            {...logic}
        />
    )
})

export default Select