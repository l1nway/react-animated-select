import {useState, useRef, useCallback, useMemo, useEffect} from 'react'

function useSelect({
    disabled,
    isOpen,
    setIsOpen, 
    options,
    selectOption,
    selected,
    hasMore,
    loadMore,
    loadButton,
    loadButtonText,
    setLoadingTitle,
    loadOffset,
    loadAhead
}) {
    const justFocused = useRef(false)
    const lastWindowFocusTime = useRef(0)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)

    const loadingTriggered = useRef(false)

    const prevOptionsLength = useRef(options?.length || 0)

    useEffect(() => {
        if (options && options.length !== prevOptionsLength.current) {
            loadingTriggered.current = false
            prevOptionsLength.current = options.length
            loadButton && setLoadingTitle(loadButtonText)
        }
    }, [options])

    const safeLoadMore = useCallback(() => {
        if (!hasMore || loadingTriggered.current) return

        loadingTriggered.current = true
        loadMore()
    }, [hasMore, loadMore])

    const handleListScroll = useCallback((e) => {
        if (loadButton || !hasMore || loadingTriggered.current) return

        const {scrollTop, scrollHeight, clientHeight} = e.currentTarget
        
        const threshold = loadOffset 

        if (scrollHeight - scrollTop <= clientHeight + threshold) {
            safeLoadMore()
        }
    }, [loadButton, hasMore, safeLoadMore])

    useEffect(() => {
        if (loadButton) return

        if (isOpen && hasMore && highlightedIndex >= 0) {
            const threshold = loadAhead
            if (highlightedIndex >= options.length - threshold) {
                safeLoadMore()
            }
        }
    }, [loadButton, highlightedIndex, isOpen, hasMore, options.length, safeLoadMore])

    useEffect(() => {
        const handleWindowFocus = () => {
            lastWindowFocusTime.current = Date.now()
        }
        window.addEventListener('focus', handleWindowFocus)
        return () => window.removeEventListener('focus', handleWindowFocus)
    }, [])

    useEffect(() => {
        if (isOpen) {
            if (highlightedIndex >= 0 && highlightedIndex < options.length) {
                return 
            }

            let index = -1
            if (selected) {
                const selectedIndex = options.findIndex(o => o.id === selected.id && !o.disabled)
                if (selectedIndex >= 0) index = selectedIndex
            }
            if (index === -1) {
                index = options.findIndex(o => !o.disabled)
            }
            setHighlightedIndex(index)
        } else {
            setHighlightedIndex(-1)
        }
    }, [isOpen, options])

    const handleBlur = useCallback((e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return
        setIsOpen(false)
    }, [setIsOpen])

    const handleFocus = useCallback(() => {
        if (disabled) return
        
        if (document.hidden) return

        const timeSinceWindowFocus = Date.now() - lastWindowFocusTime.current
        if (timeSinceWindowFocus < 100) return

        if (!isOpen) {
            setIsOpen(true)
            justFocused.current = true
            setTimeout(() => {
                justFocused.current = false
            }, 200)
        }
    }, [disabled, isOpen, setIsOpen])

    const handleToggle = useCallback((e) => {
        if (disabled) return
        if (e.target.closest && e.target.closest('.rac-select-cancel')) return
        if (justFocused.current) return

        setIsOpen(!isOpen)
    }, [disabled, isOpen, setIsOpen])

    const getNextIndex = (current, direction) => {
        const isNavigable = (opt) => opt && !opt.disabled && !opt.loading

        if (!options.some(isNavigable)) return -1

        let next = current
        let loops = 0

        do {
            next += direction

            if (next >= options.length) {
                if (hasMore && !loadButton) return current
                next = 0
            }

            if (next < 0) {
                if (hasMore && !loadButton) return current
                next = options.length - 1
            }

            loops++
        } while (!isNavigable(options[next]) && loops <= options.length)

        return next
    }


    const handleKeyDown = useCallback((e) => {
        if (disabled) return

        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault()
                if (isOpen) {
                    if (highlightedIndex !== -1 && options[highlightedIndex]) {
                        selectOption(options[highlightedIndex], e)
                    }
                } else {
                    setIsOpen(true)
                }
                break
            case 'Escape':
                e.preventDefault()
                setIsOpen(false)
                break
            case 'ArrowDown':
                e.preventDefault()
                if (!isOpen) {
                    setIsOpen(true)
                } else {
                    setHighlightedIndex(prev => getNextIndex(prev, 1))
                }
                break
            case 'ArrowUp':
                e.preventDefault()
                if (!isOpen) {
                    setIsOpen(true)
                } else {
                    setHighlightedIndex(prev => getNextIndex(prev, -1))
                }
                break
            case 'Tab':
                if (isOpen) setIsOpen(false)
                break
            default:
                break
        }
    }, [disabled, isOpen, setIsOpen, highlightedIndex, options, selectOption])

    return useMemo(() => ({
        handleBlur, 
        handleFocus, 
        handleToggle, 
        handleKeyDown, 
        highlightedIndex, 
        setHighlightedIndex,
        handleListScroll
    }), [handleBlur, handleFocus, handleToggle, handleKeyDown, highlightedIndex, setHighlightedIndex])
}

export default useSelect