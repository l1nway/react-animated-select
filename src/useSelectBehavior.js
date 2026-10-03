import {useRef, useEffect, useLayoutEffect, useMemo} from 'react'
import {useStableActions} from './state'
import {stopEvent} from './utils'

// [DOC: highlight]
export const initialHighlight = {index: -1, fallback: -1, ready: false}
export const effectiveHighlight = ({index, fallback}) => index === -1 ? fallback : index
const PAGE = 10
const TYPEAHEAD_MS = 500
const MOVES = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'])

// [DOC: highlight]
const useReachable = (options, expandedGroups) => useMemo(() => {
    const filled = new Set(options.map(o => o.group).filter(Boolean))
    const reach = o => !!o && !o.disabled && !o.loading && (o.groupHeader ? filled.has(o.name) : !o.group || expandedGroups.has(o.group))
    return {reach, list: options.flatMap((o, i) => reach(o) ? [i] : [])}
}, [options, expandedGroups])

// [DOC: highlight]
const step = (list, at, key, noWrap) => {
    const last = list.length - 1
    if (last < 0) return -1
    if (key === 'Home') return list[0]
    if (key === 'End') return list[last]
    const dir = key === 'ArrowUp' || key === 'PageUp' ? -1 : 1
    const pos = list.indexOf(at)
    if (pos === -1) return list[dir > 0 ? 0 : last]
    const next = pos + dir * (key.startsWith('Page') ? PAGE : 1)
    if (next >= 0 && next <= last) return list[next]
    return key.startsWith('Page') || noWrap ? list[next < 0 ? 0 : last] : list[(next + list.length) % list.length]
}

// [DOC: typeahead]
const match = (options, list, at, query) => {
    const repeat = [...query].every(char => char === query[0])
    const text = repeat ? query[0] : query
    const pool = list.filter(i => 'original' in options[i])
    const from = Math.max(pool.indexOf(at) + (repeat ? 1 : 0), 0)
    for (let k = 0; k < pool.length; k++) {
        const index = pool[(from + k) % pool.length]
        if (String(options[index].name).toLowerCase().startsWith(text)) return index
    }
    return -1
}

// [DOC: select-behavior]
export default function useSelectBehavior({props, state, setState, normalizedOptions: options, expandedGroups, selected, selectedIDs, visibility: open, setVisibility: setOpen, modelActions, loadMoreOnce, highlightStore}) {
    const {disabled, multiple, hasMore, loadButton, loadOffset, loadAhead, icons, onFocus, onBlur, onKeyDown} = props
    const {selectOption, clear, removeOption} = modelActions
    const {deleting} = state
    const {reach, list} = useReachable(options, expandedGroups)

    const refs = useRef({lastWindowFocusTime: 0, justFocused: false, focusTimeout: null, query: '', queryTimeout: null})

    // [DOC: highlight]
    const fallbackHighlight = useMemo(() => {
        const selectedIds = new Set(multiple ? selectedIDs.map(o => o.id) : selected ? [selected.id] : [])
        const index = selectedIds.size ? options.findIndex(o => selectedIds.has(o.id) && reach(o)) : -1
        return index !== -1 ? index : list.find(i => !options[i].groupHeader) ?? list[0] ?? -1
    }, [options, selected, selectedIDs, multiple, reach, list])

    // [DOC: select-behavior]
    const loadAheadCheck = (index) => {
        if (!loadButton && open && hasMore && index >= options.length - loadAhead) loadMoreOnce()
    }

    // [DOC: highlight]
    useLayoutEffect(() => {
        const {index} = highlightStore.get()
        highlightStore.set({fallback: fallbackHighlight, index: index !== -1 && reach(options[index]) ? index : -1})
        loadAheadCheck(effectiveHighlight(highlightStore.get()))
    })

    // [DOC: select-behavior]
    useEffect(() => {
        const store = refs.current
        const handleWindowFocus = () => store.lastWindowFocusTime = Date.now()
        window.addEventListener('focus', handleWindowFocus)
        return () => {
            window.removeEventListener('focus', handleWindowFocus)
            clearTimeout(store.focusTimeout)
            clearTimeout(store.queryTimeout)
        }
    }, [])

    const highlight = (index) => {
        highlightStore.set({index})
        loadAheadCheck(index)
    }

    // [DOC: typeahead]
    const typeahead = (char, current) => {
        const store = refs.current
        clearTimeout(store.queryTimeout)
        store.queryTimeout = setTimeout(() => store.query = '', TYPEAHEAD_MS)
        store.query += char.toLowerCase()
        const index = match(options, list, current, store.query)
        if (index !== -1) highlight(index)
        if (!open) setOpen(true)
    }

    return useStableActions({
        highlight,

        handleListScroll: (e) => {
            if (loadButton) return
            const {scrollTop, scrollHeight, clientHeight} = e.currentTarget
            if (scrollHeight - scrollTop <= clientHeight + loadOffset) loadMoreOnce()
        },

        handleBlur: (e) => {
            const clickedInsidePortal = e.relatedTarget?.closest('.rac-options')
            if (e.currentTarget.contains(e.relatedTarget) || clickedInsidePortal) return
            onBlur?.(e)
            if (deleting) setState({deleting: false})
            if (open) setOpen(false)
        },

        // [DOC: select-behavior]
        handleFocus: (e) => {
            const inside = e.currentTarget.contains(e.relatedTarget)
            if (!inside) onFocus?.(e)
            // [DOC: nested-controls]
            if (inside || e.target !== e.currentTarget || open || disabled || deleting || document.hidden || Date.now() - refs.current.lastWindowFocusTime < 100) return
            clearTimeout(refs.current.focusTimeout)
            refs.current.focusTimeout = setTimeout(() => refs.current.justFocused = false, 200)
            refs.current.justFocused = true
            setOpen(true)
        },

        toggleVisibility: (e) => {
            // leave delete mode only
            if (deleting) {
                stopEvent(e)
                setState({deleting: false})
                return
            }
            if (disabled || refs.current.justFocused) return
            setOpen(!open)
        },

        handleKeyDown: (e) => {
            // [DOC: select-behavior]
            onKeyDown?.(e)
            if (e.defaultPrevented || disabled || e.nativeEvent?.isComposing) return
            const {key} = e
            // [DOC: nested-controls]
            if (e.target !== e.currentTarget && (key === 'Enter' || key.length === 1)) return
            const current = effectiveHighlight(highlightStore.get())

            // [DOC: typeahead]
            if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && (key !== ' ' || refs.current.query)) {
                e.preventDefault()
                typeahead(key, current)
                return
            }
            // [DOC: highlight]
            if (MOVES.has(key)) {
                e.preventDefault()
                if (open || key === 'Home' || key === 'End') highlight(step(list, current, key, !loadButton && hasMore))
                if (!open) setOpen(true)
                return
            }

            switch (key) {
                case 'Enter':
                case ' ':
                    e.preventDefault()
                    if (!open) setOpen(true)
                    else if (current !== -1 && options[current]) {
                        // pin highlight
                        highlight(current)
                        selectOption(options[current], e)
                    }
                    break
                // [DOC: select-behavior]
                case 'Escape':
                    if (deleting) setState({deleting: false})
                    else if (open) setOpen(false)
                    else break
                    stopEvent(e)
                    break
                case 'Tab':
                    if (open) setOpen(false)
                    break
                // [DOC: select-behavior]
                case 'Backspace':
                case 'Delete': {
                    const last = selectedIDs.at(-1)
                    if (multiple && key === 'Backspace' && icons.remove && last) removeOption(last.id)
                    else if (icons.clear && (selected || last)) clear()
                    else break
                    e.preventDefault()
                    break
                }
            }
        }
    })
}
