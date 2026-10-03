import {Fragment, memo, useCallback, useContext, useRef, useEffect, useSyncExternalStore} from 'react'
import {SelectConfigContext, SelectActionsContext} from './state'
import {renderIcon, stopEvent, refocus, optionContent, withClass} from './utils'
import {Collapse} from './motion'

const HOVERED = 1, SWIPED = 2
// [DOC: touch-delete]
const LONG_PRESS_MS = 600, JITTER = 10, SWIPE = 30

// [DOC: chip]
const SelectedItem = memo(function SelectedItem({element, deleting, locked, chipStore, delGroup}) {
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
            setDeleting(true)
            refs.current.longPress = true
            selectRef.current?.focus()
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
    const content = valueAsOption ? optionContent(element, renderOption, true) : null
    const label = content ? <div className='rac-option-jsx'>{content}</div> : <span className='rac-chip-text'>{element.name || texts.emptyOption}</span>

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

    const showDel = removable && (deleteAlways || !locked && (hovered || swiped || deleting))

    return (
        <div
            className={withClass('rac-chip', content && element.className)}
            style={content ? element.style : undefined}
            {...(!locked && {onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd, onMouseEnter: onHover, onMouseLeave: onLeave, onClick})}
        >
            {label}
            <Collapse
                aria-label={`${texts.remove} ${element.name ?? ''}`.trim()}
                group={deleteInline && !deleteAlways && !deleting ? delGroup : undefined}
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
const Chip = memo(function Chip({element, chipStore, settle, ...chipProps}) {
    // [DOC: chip-hold]
    const breakAfter = useSyncExternalStore(chipStore.subscribe, () => chipStore.get().breaks.includes(element.id), () => false)
    return (
        <Fragment>
            <Collapse className='rac-chip-slot' onEntered={settle} onExited={settle} unmountOnExit={false} data-id={element.id} axis='x' fade>
                <SelectedItem element={element} chipStore={chipStore} {...chipProps}/>
            </Collapse>
            {breakAfter && <div className='rac-spacer'/>}
        </Fragment>
    )
})

export default Chip
