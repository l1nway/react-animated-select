import {memo, useCallback, useContext, useLayoutEffect, useRef, useSyncExternalStore} from 'react'
import {SelectConfigContext, SelectActionsContext, SelectStateContext} from './state'
import {dots, withClass} from './utils'
import {createPortal} from 'react-dom'
import {Collapse} from './motion'
import OptionList from './optionList'

// [DOC: options-panel]
const toVars = (style = {}) => Object.fromEntries(Object.entries(style).filter(([key]) => key.startsWith('--')))

// [DOC: dropdown-position]
// [DOC: dropdown-position]
const shift = (panel, rect, upward, offset) => {
    const box = panel.getBoundingClientRect()
    const style = getComputedStyle(panel)
    const dx = box.left - parseFloat(style.marginLeft) - rect.left
    const dy = upward ? box.bottom + parseFloat(style.marginBottom) - rect.top + offset : box.top - parseFloat(style.marginTop) - rect.bottom - offset
    if (Math.abs(dx) > 0.5) panel.style.left = `${rect.left - dx}px`
    if (Math.abs(dy) > 0.5) panel.style[upward ? 'bottom' : 'top'] = `${parseFloat(panel.style[upward ? 'bottom' : 'top']) + (upward ? dy : -dy)}px`
}

// [DOC: dropdown-position]
const useDropdownPosition = ({selectRef, panelRef, open, offset, store}) => {
    const lastHeight = useRef(0)

    const place = useCallback((panel) => {
        const select = selectRef.current
        if (!select) return
        const measured = open && panel ? panel.scrollHeight : 0
        if (measured) lastHeight.current = measured
        if (!lastHeight.current) lastHeight.current = parseFloat(getComputedStyle(select).getPropertyValue('--rac-list-max-height')) || 250

        const rect = select.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        const upward = spaceBelow < lastHeight.current && rect.top > spaceBelow
        store.set({upward})
        if (!open || !panel) return

        panel.style.width = `${rect.width}px`
        panel.style.left = `${rect.left}px`
        panel.style.top = upward ? 'auto' : `${rect.bottom + offset}px`
        panel.style.bottom = upward ? `${window.innerHeight - rect.top + offset}px` : 'auto'
        shift(panel, rect, upward, offset)
    }, [selectRef, open, offset, store])

    // [DOC: dropdown-position]
    const listRef = useCallback((list) => {if (list) place(list.parentElement)}, [place])

    useLayoutEffect(() => {
        const sync = () => place(panelRef.current)
        sync()
        window.addEventListener('resize', sync)
        const cleanups = [() => window.removeEventListener('resize', sync)]

        if (open) {
            // ancestor scroll, own resize
            window.addEventListener('scroll', sync, {capture: true, passive: true})
            cleanups.push(() => window.removeEventListener('scroll', sync, {capture: true}))
            if (typeof ResizeObserver !== 'undefined') {
                const ro = new ResizeObserver(sync)
                if (selectRef.current) ro.observe(selectRef.current)
                if (panelRef.current) ro.observe(panelRef.current)
                cleanups.push(() => ro.disconnect())
            }
        } else if (typeof IntersectionObserver !== 'undefined') {
            // closed: intersection estimate
            const io = new IntersectionObserver(sync, {threshold: [0, 0.25, 0.5, 0.75, 1]})
            if (selectRef.current) io.observe(selectRef.current)
            cleanups.push(() => io.disconnect())
        }
        return () => cleanups.forEach(fn => fn())
    }, [open, place, selectRef, panelRef])

    return [useSyncExternalStore(store.subscribe, () => store.get().upward, () => false), listRef]
}

// [DOC: options-panel]
const portalTarget = (container) => (typeof container === 'function' ? container() : container) || document.body

const noSubscribe = () => () => {}

// [DOC: options-panel]
const Dropdown = memo(function Dropdown() {
    const {selectRef, selectId, positionStore, multiple, offset, duration, easing, animateOpacity, keepMounted, optionsClassName, style, container, hasMore, loadButton, texts} = useContext(SelectConfigContext)
    const {visibility, normalizedOptions, loading, error} = useContext(SelectStateContext)
    const {handleListScroll, setListReady} = useContext(SelectActionsContext)
    const open = visibility && normalizedOptions.length > 0

    // [DOC: server-render]
    const client = useSyncExternalStore(noSubscribe, () => true, () => false)

    const panelRef = useRef(null)
    const [upward, listRef] = useDropdownPosition({selectRef, panelRef, open: visibility && client, offset, store: positionStore})

    const onEntered = useCallback(() => setListReady(true), [setListReady])

    if (!client) return null

    return createPortal(
        <Collapse
            axis='y'
            fade={animateOpacity}
            in={open}
            nodeRef={panelRef}
            unmountOnExit={!keepMounted}
            onEntered={onEntered}
            onMouseDown={(e) => e.preventDefault()}
            className={withClass('rac-options', optionsClassName)}
            data-placement={upward ? 'top' : 'bottom'}
            style={{...toVars(style), '--rac-duration': `${duration}ms`, '--rac-ease': easing, pointerEvents: open ? 'auto' : 'none', position: 'fixed'}}
        >
            <div
                onScroll={handleListScroll}
                className='rac-list'
                aria-multiselectable={multiple}
                id={`${selectId}-listbox`}
                aria-label={texts.list}
                role='listbox'
                tabIndex='-1'
                ref={listRef}
            >
                <OptionList/>
                {/* [DOC: state-semantics] */}
                {error
                    ? <div className='rac-option' data-error=''><span className='rac-option-text'>{texts.error}</span></div>
                    : (loading || (!loadButton && hasMore)) &&
                        <div className='rac-option' data-loading=''>
                            <span className='rac-option-text'>{loading ? texts.loading : texts.loadingMore}</span>
                            {dots}
                        </div>
                }
            </div>
        </Collapse>,
        portalTarget(container)
    )
})

export default Dropdown
