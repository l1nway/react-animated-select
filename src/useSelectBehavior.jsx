import {useState, useRef, useCallback, useEffect, useMemo, useEffectEvent} from 'react'

function useSelectBehavior({disabled, open, setOpen, options = [], selectOption, setState, selected, selectedIDs, multiple, hasMore, loadMore, loadButton, loadButtonText, loadOffset, loadAhead, expandedGroups, onOpen, onClose, deleting}) {
    const [highlightedIndex, setHighlightedIndex] = useState(-1)

    const refs = useRef({
        loadingTriggered: false,
        lastWindowFocusTime: 0,
        justFocused: false,
        focusTimeout: null
    })

    // loading state synchronization
    useEffect(() => {
        // flag is reset if value of the loadButton or hasMore props has changed
        refs.current.loadingTriggered = false

        loadButton && setState({loadingTitle: loadButtonText})
    }, [options.length, hasMore, loadButton, loadButtonText])

    // safely call loadMore prop
    const safeLoadMore = useCallback(() => {
        if (!hasMore || refs.current.loadingTriggered) return
        refs.current.loadingTriggered = true
        loadMore()
    }, [hasMore, loadMore])

    // calling a function when scrolling almost to the end;
    // loadOffset is a prop indicating how many pixels before end loadMore will be called
    const handleListScroll = useCallback((e) => {
        if (loadButton || !hasMore || refs.current.loadingTriggered) return

        const {scrollTop, scrollHeight, clientHeight} = e.currentTarget
        (scrollHeight - scrollTop <= clientHeight + loadOffset) && safeLoadMore()
    }, [loadButton, hasMore, loadOffset, safeLoadMore])

    // call a function when scrolling through options using keys;
    // loadAhead prop how many options before the end it will be called
    useEffect(() => {(!loadButton && open && hasMore && highlightedIndex >= options.length - loadAhead) && safeLoadMore()}, [highlightedIndex, open, hasMore, options.length, loadAhead, loadButton, safeLoadMore])

    // force refocus blocking if the user exits the browser or the page
    useEffect(() => {
        const handleWindowFocus = () => refs.current.lastWindowFocusTime = Date.now()
        window.addEventListener('focus', handleWindowFocus)
        return () => {
            window.removeEventListener('focus', handleWindowFocus)
            clearTimeout(refs.current.focusTimeout)
        }
    }, [])

    // set highlighting to the first available option by default unless otherwise selected
    useEffect(() => {
        if (!open) {
            setHighlightedIndex(-1)
            return
        }

        // blocking the reset of an index if it is already within the array (exmpl after loading)
        const currentOption = options[highlightedIndex]
        const valid = currentOption && !currentOption.hidden && !currentOption.groupHeader

        if (highlightedIndex >= 0 && highlightedIndex < options.length && valid) return

        let index = -1
        if (selected && !multiple) {
            const firstSelected = multiple ? selected[0] : selected
            if (firstSelected) {
                index = options.findIndex(o => o.id === firstSelected.id && !o.disabled && !o.hidden && !o.groupHeader)
            }
        }

        if (multiple && selectedIDs.length) {
            const ids = new Set(selectedIDs.map(o => o.id))
            index = options.findIndex(
                o =>
                ids.has(o.id) &&
                !o.disabled &&
                !o.hidden &&
                !o.groupHeader
            )
        }
        
        if (index === -1) index = options.findIndex(o => !o.disabled && !o.hidden && !o.groupHeader)
        setHighlightedIndex(index)
    }, [open, options, selected])

    // find the next available option to switch to using the keyboard
    const getNextIndex = useCallback((current, direction) => {
        const isNavigable = (opt) => 
            opt &&
            !opt?.groupHeader &&
            (!opt?.group || expandedGroups?.has(opt?.group)) &&
            !opt?.disabled &&
            !opt?.loading
        const len = options.length
        if (len === 0) return -1

        let next = current
        // я не шарю нихуя в математике
        for (let i = 0; i < len; i++) {
            next = (next + direction + len) % len

            // if autoloading is active but loadButton is inactive, then infinite scrolling is blocked
            if (!loadButton && hasMore) {
                if (direction > 0 && next === 0) return current
                if (direction < 0 && next === len - 1) return current
            }

            if (isNavigable(options[next])) return next
        }
        return current
    }, [options, hasMore, loadButton, expandedGroups])

    // closing the select if focus is lost
    const handleBlur = useCallback((e) => {
        const clickedInsidePortal = e.relatedTarget?.closest('.rac-options')
        
        if (!e.currentTarget.contains(e.relatedTarget) && !clickedInsidePortal) {
            deleting && setState({deleting: false})
            open && setOpen(false)
        }
    }, [deleting, open, setState, setOpen])

    // opening the select when receiving focus
    const handleFocus = useCallback(() => {
        if (disabled || deleting || document.hidden || (Date.now() - refs.current.lastWindowFocusTime < 100)) return
        
        if (!open) {
            clearTimeout(refs.current.focusTimeout)
            refs.current.focusTimeout = setTimeout(() => refs.current.justFocused = false, 200)
            refs.current.justFocused = true
            setOpen(true)
        }
    }, [disabled, open, setOpen, deleting])

    const onOpenEvent = useEffectEvent(() => onOpen?.())
    const onCloseEvent = useEffectEvent(() => onClose?.())

    useEffect(() => {
        if (open) onOpenEvent()
        else onCloseEvent()
    }, [open])

    // processing toggle click on select
    const toggleVisibility = useCallback((e) => {
        if (disabled || deleting || e?.target?.closest('.rac-select-cancel') || refs.current.justFocused) return
        setOpen(!open)
    }, [disabled, open, setOpen, onOpen, onClose, deleting])

    // hotkey processing
    const handleKeyDown = useCallback((e) => {
        if (disabled) return

        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault()
                if (open) {
                    if (highlightedIndex !== -1 && options[highlightedIndex]) {
                        selectOption(options[highlightedIndex], e)
                    }
                } else setOpen(true)
                break
            case 'Escape':
                e.preventDefault()
                setOpen(false)
                break
            case 'ArrowDown':
                e.preventDefault()
                open ? setHighlightedIndex(prev => getNextIndex(prev, 1)) : setOpen(true)
                break
            case 'ArrowUp':
                e.preventDefault()
                open ? setHighlightedIndex(prev => getNextIndex(prev, -1)) : setOpen(true)
                break
            case 'Tab':
                if (open) setOpen(false)
                break
        }
    }, [disabled, open, setOpen, highlightedIndex, options, selectOption, getNextIndex])

    return useMemo(() => ({handleBlur, handleFocus, toggleVisibility, handleKeyDown, highlightedIndex, setHighlightedIndex, handleListScroll}), [handleBlur, handleFocus, toggleVisibility, handleKeyDown, highlightedIndex, handleListScroll])
}

export default useSelectBehavior