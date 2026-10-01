import {SelectConfigContext, SelectActionsContext, SelectStateContext} from './state'
import {memo, useContext, useLayoutEffect, useMemo, useRef, useSyncExternalStore} from 'react'
import {effectiveHighlight} from './useSelectBehavior'
import {renderIcon, optionDomId, optionContent, flag, dots, withClass} from './utils'
import {Collapse} from './motion'

const NONE = 0, HIGHLIGHTED = 1, HIGHLIGHTED_READY = 2

// [DOC: highlight]
const useHighlighted = (index) => {
    const {highlightStore} = useContext(SelectConfigContext)
    const ref = useRef(null)
    const mode = useSyncExternalStore(highlightStore.subscribe, () => {
        const snapshot = highlightStore.get()
        if (effectiveHighlight(snapshot) !== index) return NONE
        return snapshot.ready ? HIGHLIGHTED_READY : HIGHLIGHTED
    }, () => NONE)

    useLayoutEffect(() => {
        if (mode === HIGHLIGHTED_READY) ref.current?.scrollIntoView?.({block: 'nearest'})
    }, [mode])
    return [ref, mode !== NONE]
}

// [DOC: option-list]
const GroupHeader = memo(function GroupHeader({option, index, open, hasChildren}) {
    const {selectId, icons} = useContext(SelectConfigContext)
    const {selectOption, highlight} = useContext(SelectActionsContext)
    const [ref, highlighted] = useHighlighted(index)
    const interactive = hasChildren && !option.disabled

    return (
        <div
            className={withClass('rac-group', option.className)}
            onMouseEnter={() => interactive && highlight(index)}
            onClick={(e) => selectOption(option, e)}
            data-highlighted={flag(highlighted)}
            data-disabled={flag(option.disabled)}
            id={optionDomId(selectId, option.id)}
            data-open={flag(open)}
            style={option.style}
            ref={ref}
        >
            <span className='rac-group-text'>{option.name}</span>
            <Collapse axis='x' in={hasChildren && !option.disabled} className='rac-group-arrow' aria-hidden='true'>
                {renderIcon(icons.arrow)}
            </Collapse>
        </div>
    )
})

// [DOC: option-list]
const OptionItem = memo(function OptionItem({option, index, isSelected, showCheckbox}) {
    const {selectId, icons, renderOption} = useContext(SelectConfigContext)
    const {selectOption, highlight} = useContext(SelectActionsContext)
    const [ref, highlighted] = useHighlighted(index)

    const interactive = !option.disabled && !option.loading

    // [DOC: option-list]
    const content = optionContent(option, renderOption, isSelected)

    return (
        <div
            className={withClass('rac-option', option.className)}
            onMouseEnter={() => interactive && highlight(index)}
            onClick={(e) => !option.loading && selectOption(option, e)}
            aria-disabled={option.disabled || option.loading}
            data-invalid={flag(option.invalid)}
            data-bool={typeof option.raw === 'boolean' ? String(option.raw) : undefined}
            data-highlighted={flag(highlighted)}
            data-loading={flag(option.loading)}
            id={optionDomId(selectId, option.id)}
            aria-selected={isSelected}
            style={option.style}
            role='option'
            ref={ref}
        >
            {content
                ? <div className='rac-option-jsx'>{content}</div>
                : <span className='rac-option-text'>{option.name}</span>
            }
            {option.loading && dots}
            {showCheckbox &&
                <div className='rac-check' data-default={flag(!icons.checkbox)}>
                    {renderIcon(icons.check, {className: 'rac-checkmark'})}
                    {renderIcon(icons.checkbox, {className: 'rac-check-icon'})}
                </div>
            }
        </div>
    )
})

// [DOC: option-list]
const OptionList = memo(function OptionList() {
    const {selectId, multiple} = useContext(SelectConfigContext)
    const {normalizedOptions, selected, selectedIDs, expandedGroups} = useContext(SelectStateContext)
    const selectedId = selected?.id

    return useMemo(() => {
        const selectedIdSet = new Set(selectedIDs.map(o => o.id))
        const groupCounts = normalizedOptions.reduce((acc, opt) => {
            if (opt.group) acc[opt.group] = (acc[opt.group] || 0) + 1
            return acc
        }, {})

        const nodes = []
        let groupChildren = []
        let groupName = null
        let headerId = null

        const flushGroup = () => {
            if (groupName !== null && groupChildren.length) {
                nodes.push(
                    <Collapse axis='y' in={expandedGroups.has(groupName)} className='rac-group-items' role='group' aria-labelledby={headerId} key={`slide-${groupName}`}>
                        {groupChildren}
                    </Collapse>
                )
            }
            groupChildren = []
        }

        const itemNode = (option, index) => (
            <OptionItem
                isSelected={selectedIdSet.has(option.id) || selectedId === option.id}
                showCheckbox={multiple && !option.disabled}
                key={option.id}
                option={option}
                index={index}
            />
        )

        normalizedOptions.forEach((option, index) => {
            if (option.groupHeader) {
                flushGroup()
                groupName = option.name
                headerId = optionDomId(selectId, option.id)
                nodes.push(
                    <GroupHeader
                        hasChildren={groupCounts[option.name] > 0}
                        open={expandedGroups.has(option.name)}
                        key={option.id}
                        option={option}
                        index={index}
                    />
                )
            } else if (option.group) {
                groupChildren.push(itemNode(option, index))
            } else {
                flushGroup()
                groupName = null
                nodes.push(itemNode(option, index))
            }
        })
        flushGroup()

        return nodes
    }, [normalizedOptions, selectedId, selectedIDs, expandedGroups, multiple, selectId])
})

export default OptionList
