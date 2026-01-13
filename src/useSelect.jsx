import {useState, useRef, useCallback, useMemo, useEffect} from 'react'

function useSelect({
    disabled,
    isOpen,
    setIsOpen, 
    options,
    selectOption,
    selected
}) {
    const justFocused = useRef(false)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)

    useEffect(() => {
        if (isOpen) {
            const index = selected 
                ? options.findIndex(o => o.id == selected.id) 
                : -1
            setHighlightedIndex(index >= 0 ? index : 0)
        } else {
            setHighlightedIndex(-1)
        }
    }, [isOpen, selected])

    const handleBlur = useCallback((e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return
        setIsOpen(false, 'force rerender if its in object')
    }, [setIsOpen])

    const handleFocus = useCallback(() => {
        if (disabled) return
        if (document.hidden || !document.hasFocus()) return
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
        if (e.target.closest('.rac-select-cancel')) return
        if (justFocused.current) return

        setIsOpen(!isOpen)
    }, [disabled, isOpen, setIsOpen])

    const getNextIndex = (current, direction) => {
        let next = current + direction
        if (next < 0) next = options.length - 1
        if (next >= options.length) next = 0
        
        let loops = 0
        while (options[next]?.disabled && loops < options.length) {
            next += direction
            if (next < 0) next = options.length - 1
            if (next >= options.length) next = 0
            loops++
        }
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
        }
    }, [disabled, isOpen, setIsOpen, highlightedIndex, options, selectOption])

    return useMemo(() => ({handleBlur, handleFocus, handleToggle, handleKeyDown, highlightedIndex, setHighlightedIndex}),
    [handleBlur, handleFocus, handleToggle, handleKeyDown, highlightedIndex, setHighlightedIndex])
}

export default useSelect