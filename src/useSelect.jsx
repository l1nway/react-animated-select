import {useState, useRef, useCallback, useEffect, useMemo} from 'react'

function useSelect({
    disabled,
    open,
    setOpen,
    options = [],
    selectOption,
    selected,
    multiple,
    hasMore,
    loadMore,
    loadButton,
    loadButtonText,
    setLoadingTitle,
    loadOffset,
    loadAhead,
    expandedGroups
}) {
    const justFocused = useRef(false)
    const lastWindowFocusTime = useRef(0)
    const loadingTriggered = useRef(false)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)

    // loading state synchronization
    useEffect(() => {
        // flag is reset if value of the loadButton or hasMore props has changed
        loadingTriggered.current = false

        if (loadButton) {
            setLoadingTitle(loadButtonText)
        }
    }, [options.length, hasMore, loadButton, loadButtonText, setLoadingTitle])

    // safely call loadMore prop
    const safeLoadMore = useCallback(() => {
        if (!hasMore || loadingTriggered.current) return
        loadingTriggered.current = true
        loadMore()
    }, [hasMore, loadMore])

    // calling a function when scrolling almost to the end;
    // loadOffset is a prop indicating how many pixels before end loadMore will be called
    const handleListScroll = useCallback((e) => {
        if (loadButton || !hasMore || loadingTriggered.current) return

        const {scrollTop, scrollHeight, clientHeight} = e.currentTarget
        if (scrollHeight - scrollTop <= clientHeight + loadOffset) {
            safeLoadMore()
        }
    }, [loadButton, hasMore, loadOffset, safeLoadMore])

    // call a function when scrolling through options using keys;
    // loadAhead prop how many options before the end it will be called
    useEffect(() => {
        if (!loadButton && open && hasMore && highlightedIndex >= options.length - loadAhead) {
            safeLoadMore()
        }
    }, [highlightedIndex, open, hasMore, options.length, loadAhead, loadButton, safeLoadMore])

    // force refocus blocking if the user exits the browser or the page
    useEffect(() => {
        const handleWindowFocus = () => {lastWindowFocusTime.current = Date.now()}
        window.addEventListener('focus', handleWindowFocus)
        return () => window.removeEventListener('focus', handleWindowFocus)
    }, [])

    // set highlighting to the first available option by default unless otherwise selected
    useEffect(() => {
        if (!open) {
            setHighlightedIndex(-1)
            return
        }

        // blocking the reset of an index if it is already within the array (exmpl after loading)
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            if (!options[highlightedIndex] || options[highlightedIndex].hidden || options[highlightedIndex].groupHeader) {
            } else return
        }

        let index = -1
        if (selected) {
            const firstSelected = multiple ? selected[0] : selected
            if (firstSelected) {
                index = options.findIndex(o => o.id === firstSelected.id && !o.disabled && !o.hidden && !o.groupHeader)
            }
        }
        
        if (index === -1) {
            index = options.findIndex(o => !o.disabled && !o.hidden && !o.groupHeader)
        }
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

    // closing the selector if focus is lost
    const handleBlur = useCallback((e) => {
        const clickedInsidePortal = e.relatedTarget?.closest('.rac-options')
        
        if (!e.currentTarget.contains(e.relatedTarget) && !clickedInsidePortal) {
            setOpen(false)
        }
    }, [setOpen])

    // opening the selector when receiving focus
    const handleFocus = useCallback(() => {
        if (disabled || document.hidden || (Date.now() - lastWindowFocusTime.current < 100)) return
        
        if (!open) {
            setOpen(true)
            justFocused.current = true
            setTimeout(() => {justFocused.current = false}, 200)
        }
    }, [disabled, open, setOpen])

    // processing toggle click on select
    const handleToggle = useCallback((e) => {
        if (disabled || e.target.closest('.rac-select-cancel') || justFocused.current) return
        setOpen(!open)
    }, [disabled, open, setOpen])

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

    return useMemo(() => ({
        handleBlur, handleFocus, handleToggle, handleKeyDown,
        highlightedIndex, setHighlightedIndex, handleListScroll
    }), [handleBlur, handleFocus, handleToggle, handleKeyDown, highlightedIndex, handleListScroll])
}

export default useSelect