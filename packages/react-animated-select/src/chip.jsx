import {Component, Fragment, memo, useCallback, useContext, useRef, useEffect, useState, useSyncExternalStore} from 'react'
import {flushSync} from 'react-dom'
import {SelectConfigContext, SelectActionsContext, SelectStateContext} from './state'
import {renderIcon, stopEvent, refocus, optionContent, withClass, flag} from './utils'
import {Collapse, Presence} from './motion'
import {Title} from './trigger'
import {NONE} from './chipGeometry'
import {sameValue} from './model'
import useChipLayout from './useChipLayout'
import './chip.css'

// [DOC: chip-keys]
const rekey = (chips, prev) => {
    const ids = new Set(chips.map(chip => chip.id))
    const byId = new Map(prev.map(([key, chip]) => [chip.id, key]))
    const free = prev.filter(([, chip]) => !ids.has(chip.id))
    const taken = new Set(prev.map(([key]) => key))
    return chips.map(chip => {
        if (byId.has(chip.id)) return [byId.get(chip.id), chip]
        const at = free.findIndex(([, old]) => sameValue(old.original, chip.original))
        if (at >= 0) return [free.splice(at, 1)[0][0], chip]
        let key = chip.id
        while (taken.has(key)) key += '~'
        taken.add(key)
        return [key, chip]
    })
}

// [DOC: chip-keys]
const useChipKeys = (chips) => {
    const [last, setLast] = useState(() => ({chips, keyed: rekey(chips, [])}))
    if (last.chips === chips) return last.keyed
    const keyed = rekey(chips, last.keyed)
    setLast({chips, keyed})
    return keyed
}

const PROBE_STYLE = {position: 'absolute', visibility: 'hidden', pointerEvents: 'none'}
const HOVERED = 1, SWIPED = 2
// [DOC: touch-delete]
const LONG_PRESS_MS = 600, JITTER = 10, SWIPE = 30

// [DOC: chip]
const SelectedItem = /* @__PURE__ */ memo(function SelectedItem({element, deleting, locked, plain, last, chipStore, delGroup, settle}) {
    const {selectRef, deleteInline, deleteAlways, icons, texts, valueAsOption, renderOption} = useContext(SelectConfigContext)
    const removable = !!icons.remove
    const {setVisibility, setDeleting, removeOption} = useContext(SelectActionsContext)

    const refs = useRef({longPressTimer: null, longPress: false, x: 0, y: 0})

    // [DOC: chip]
    const flags = useSyncExternalStore(chipStore.subscribe, () => {
        const {hoverId, swipedId} = chipStore.get()
        return (hoverId === element.id ? HOVERED : 0) | (swipedId === element.id ? SWIPED : 0)
    }, () => 0)
    const hovered = !!(flags & HOVERED)
    const swiped = !!(flags & SWIPED)

    // [DOC: touch-delete]
    const onTouchStart = useCallback((e) => {
        const {clientX, clientY} = e.touches[0]
        Object.assign(refs.current, {x: clientX, y: clientY, longPress: false})
        clearTimeout(refs.current.longPressTimer)
        if (removable) refs.current.longPressTimer = setTimeout(() => {
            // delete mode is committed before the focus below, which would otherwise open the list
            flushSync(() => setDeleting(true))
            refs.current.longPress = true
            selectRef.current?.focus({preventScroll: true})
            setVisibility(false)
            window.navigator.vibrate?.(50)
        }, LONG_PRESS_MS)
    }, [removable, setDeleting, setVisibility, selectRef])

    // [DOC: touch-delete]
    const onTouchMove = useCallback((e) => {
        const {clientX, clientY} = e.touches[0]
        const diff = refs.current.x - clientX
        if (Math.hypot(diff, refs.current.y - clientY) > JITTER) clearTimeout(refs.current.longPressTimer)
        if (diff > SWIPE && !swiped) chipStore.set({hoverId: null, swipedId: element.id})
        else if (diff < -SWIPE && swiped) chipStore.set({swipedId: null})
    }, [element.id, swiped, chipStore])

    // [DOC: touch-delete]
    const onTouchEnd = useCallback((e) => {
        clearTimeout(refs.current.longPressTimer)
        // swallow the release click
        if (refs.current.longPress && e.cancelable) e.preventDefault()
        refs.current.longPress = false
    }, [])

    // [DOC: chip]
    const onHover = useCallback(() => chipStore.set({hoverId: element.id, swipedId: null}), [element.id, chipStore])
    // clear only own hover
    const onLeave = useCallback(() => {if (chipStore.get().hoverId === element.id) chipStore.set({hoverId: null})}, [element.id, chipStore])

    useEffect(() => () => clearTimeout(refs.current.longPressTimer), [])

    // [DOC: option-content]
    const content = valueAsOption && !plain ? optionContent(element, renderOption, true) : null
    // [DOC: plugin-morph]
    const label = content ? <div className='rac-option-jsx'>{content}</div> : <span className={plain ? 'rac-pick' : 'rac-chip-text'} data-last={flag(last)}>{element.name || texts.emptyOption}</span>

    const removeAction = useCallback((e) => {
        chipStore.set({swipedId: null})
        refocus(e, selectRef)
        removeOption(element.id)
        stopEvent(e)
    }, [element.id, removeOption, chipStore, selectRef])

    // [DOC: touch-delete]
    const onClick = useCallback((e) => {
        stopEvent(e)
        if (deleting) removeAction(e)
    }, [deleting, removeAction])

    const showDel = removable && !plain && (deleteAlways || !locked && (hovered || swiped || deleting))

    return (
        <div
            className={plain ? undefined : withClass('rac-chip', content && element.className)}
            style={content ? element.style : undefined}
            data-plain={flag(plain)}
            {...(!locked && {onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd, onMouseEnter: onHover, onMouseLeave: onLeave, onClick})}
        >
            {label}
            <Collapse
                aria-label={`${texts.remove} ${element.name ?? ''}`.trim()}
                group={deleteInline && !deleteAlways && !deleting ? delGroup : undefined}
                onEntered={settle}
                onExited={settle}
                onMouseDown={stopEvent}
                onClick={removeAction}
                className='rac-chip-del'
                disabled={locked}
                tabIndex={-1}
                type='button'
                in={showDel}
                as='button'
                axis='x'
            >
                {renderIcon(icons.remove)}
            </Collapse>
        </div>
    )
})

// [DOC: chip]
const Chip = /* @__PURE__ */ memo(function Chip({element, chipStore, settle, ...chipProps}) {
    // [DOC: chip-hold]
    const breakAfter = useSyncExternalStore(chipStore.subscribe, () => chipStore.get().breaks.includes(element.id), () => false)
    return (
        <Fragment>
            <Collapse className='rac-chip-slot' onEntered={settle} onExited={settle} unmountOnExit={false} data-id={element.id} axis='x' fade>
                <SelectedItem element={element} chipStore={chipStore} settle={settle} {...chipProps}/>
            </Collapse>
            {breakAfter && <div className='rac-spacer'/>}
        </Fragment>
    )
})

// [DOC: chip-hold]
class Snapshot extends Component {
    getSnapshotBeforeUpdate(prev) {
        // [DOC: chip-resize]
        const sized = prev.look !== this.props.look
        // [DOC: delete-mode]
        if (sized || prev.chips !== this.props.chips || prev.dress !== this.props.dress) this.props.take(sized)
        return null
    }
    componentDidUpdate() {}
    render() {return null}
}

// [DOC: value]
export const ChipsValue = /* @__PURE__ */ memo(function ChipsValue(morph) {
    const {selectedText, icons} = useContext(SelectConfigContext)
    const {selectedIDs, deleting, active} = useContext(SelectStateContext)
    const showChips = selectedIDs.length > 0 && !selectedText
    const chips = showChips ? selectedIDs : NONE
    const {chipStore, delGroup, valueRef, delIconRef, probe, settle, held, snapshot, look, dress, plain, wait} = useChipLayout(chips, morph)
    const keyed = useChipKeys(chips)

    return (
        <div className='rac-value' ref={valueRef}>
            <Snapshot chips={chips} look={look} dress={dress} take={snapshot}/>
            <Title hidden={showChips} settle={settle}/>
            <Presence hold={held} wait={wait}>
                {keyed.map(([key, element], i) =>
                    <Chip key={key} element={element} deleting={deleting} locked={!active} plain={plain} last={plain && i === keyed.length - 1} chipStore={chipStore} delGroup={delGroup} settle={settle}/>
                )}
            </Presence>
            {probe && <button type='button' className='rac-chip-del' tabIndex={-1} aria-hidden='true' ref={delIconRef} style={PROBE_STYLE}>{renderIcon(icons.remove)}</button>}
        </div>
    )
})

// [DOC: plugins]
export const chips = {Value: ChipsValue}
