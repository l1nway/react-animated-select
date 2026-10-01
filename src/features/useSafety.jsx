import {useCallback, useReducer, useLayoutEffect, useRef, useMemo} from 'react'
import {shake} from '../start/components'

export const parse = (option) => {
    if (typeof option === 'function') return 'function () {[native code]}'
    if (typeof option === 'object') return JSON.stringify(option)
    if (typeof option === 'string') return `'${option}'`
    if (option === undefined) return 'undefined'
    if (option === null) return 'null'

    return String(option)
}

const sameWidths = (a, b) => Object.keys(a).length === Object.keys(b).length && Object.keys(b).every(key => a[key] === b[key])

export function useSafety() {
    const [state, dispatch] = useReducer((prev, next) => {
        const actualNext = typeof next === 'function' ? next(prev) : next
        return actualNext ? {...prev, ...actualNext} : prev
    }, {
        options: ['Option 1', true, false, undefined, null, console.log, {name: 'Option 7', disabled: true}, {name: 'Option 8'}, {random: 'Option 9'}, {name: 'Option 10', id: 2}, {id: 'Option 11'}],
        value: undefined,
        height: null,
        option: '',
        widths: {}
    })

    const {options, option, height, widths} = state

    const contentRef = useRef(null)
    const inputRef = useRef(null)
    const itemsRef = useRef({})

    useLayoutEffect(() => {
        const measure = () => {
            const next = {height: contentRef.current ? Math.round(contentRef.current.getBoundingClientRect().height) : null, widths: {}}
            Object.keys(itemsRef.current).forEach(key => {
                const el = itemsRef.current[key]
                if (el) next.widths[key] = Math.round(el.scrollWidth)
                else delete itemsRef.current[key]
            })
            // skip unchanged sizes
            dispatch(prev => prev.height === next.height && sameWidths(prev.widths, next.widths) ? null : next)
        }

        const resizeObserver = new ResizeObserver(measure)

        if (contentRef.current) {
            resizeObserver.observe(contentRef.current)
            measure()
        }

        return () => resizeObserver.disconnect()
    }, [options])

    const containerAnim = useMemo(() => ({
        animate: {height: height === null ? 'auto' : height + 2, opacity: 1, borderWidth: '1px'},
        initial: {height: 0, opacity: 0, borderWidth: 0},
        exit: {height: 0, opacity: 0, borderWidth: 0},
        transition: {duration: 0.3}
    }), [height])

    const itemAnim = useCallback((key) => ({
        animate: {width: key in widths ? widths[key] + 2 : 'auto', opacity: 1, marginRight : '0.5em', borderWidth: '1px'},
        initial: {width: 0, opacity: 0, marginRight: 0, borderWidth: 0},
        exit: {width: 0, opacity: 0, marginRight: 0, borderWidth: 0},
        transition: {duration: 0.3}
    }), [widths])

    const addOption = useCallback((e) => {
        e && e?.preventDefault()
        if (!option.trim()) {
            shake(inputRef.current)
            return
        }

        let parsedValue
        try {
            if (option.startsWith('{') || option.startsWith('[')) parsedValue = new Function(`return ${option}`)()
            
            else if (option.includes('=>') || option.includes('function')) parsedValue = new Function(`return ${option}`)()
            else if (!isNaN(option) && option.trim() !== '') parsedValue = Number(option)
            else if (option === 'undefined') parsedValue = undefined
            else if (option === 'false') parsedValue = false
            else if (option === 'true') parsedValue = true
            else if (option === 'null') parsedValue = null

            else parsedValue = option
            
            if (options.some(opt => parse(opt) === parse(parsedValue))) {
                shake(itemsRef.current[parse(option)])
                return
            }
            dispatch(s => ({options: [...s.options, parsedValue], option: ''}))
        } catch {
            if (options.some(opt => parse(opt) === parse(option))) {
                shake(itemsRef.current[parse(option)])
                return
            }
            dispatch(s => ({options: [...s.options, option], option: ''}))
        }
    }, [option, options])

    const removeOption = useCallback((removing) => dispatch(s => ({options: s.options.filter((_, index) => index !== removing)})), [])

    return {state, dispatch, containerAnim, itemAnim, addOption, removeOption, itemsRef, contentRef, inputRef}
}