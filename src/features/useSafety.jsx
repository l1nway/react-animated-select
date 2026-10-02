import {useCallback, useReducer, useRef, useMemo, isValidElement, cloneElement} from 'react'
import {Option} from 'react-animated-select'
import {shake, clearShake} from '../components/helpers'
import {CodeBlock} from '../components/code'

// demo data
const loop = {name: 'Circular'}
loop.self = loop

const PRESETS = {
    shapes: ['Option 1', true, false, undefined, null, console.log, {name: 'Option 7', disabled: true}, {name: 'Option 8'}, {random: 'Option 9'}, {name: 'Option 10', id: 2}, {id: 'Option 11'}, loop, new Date('2026-10-01'), new URL('https://npmjs.com'), <Option value={0}/>],
    duplicates: [1, 1, 1, true, true, true, 'Same', 'Same', NaN, NaN, {name: 'Twin'}, {name: 'Twin'}, null, undefined, '', <Option id='twin'>Twin JSX</Option>, <Option id='twin'>Twin JSX</Option>]
}

const entries = (preset) => PRESETS[preset].map((value, i) => ({key: `${preset}-${i}`, value}))

const circular = () => {
    const seen = new WeakSet()
    return (_, v) => typeof v !== 'object' || v === null ? v : seen.has(v) ? '[Circular]' : (seen.add(v), v)
}

const instance = (o) => o !== null && typeof o === 'object' && ![Object.prototype, Array.prototype, null].includes(Object.getPrototypeOf(o))
const attr = ([k, v]) => typeof v === 'string' ? ` ${k}='${v}'` : ` ${k}={${parse(v)}}`
const tag = ({props: {children, ...rest}}) => `<Option${Object.entries(rest).map(attr).join('')}${children == null ? '/>' : `>${children}</Option>`}`

export const parse = (option) => {
    if (isValidElement(option)) return tag(option)
    if (typeof option === 'function') return 'function () {[native code]}'
    if (option instanceof Date) return `new Date('${option.toISOString().slice(0, 10)}')`
    if (instance(option)) return `new ${option.constructor?.name}('${option}')`
    if (typeof option === 'object') return JSON.stringify(option, circular())
    if (typeof option === 'string') return `'${option}'`
    return String(option)
}

const WORDS = {undefined, null: null, true: true, false: false, NaN}

const read = (text) => {
    try {
        if (/^[[{]|=>|function/.test(text)) return new Function(`return ${text}`)()
    } catch {
        return text
    }
    if (Object.hasOwn(WORDS, text)) return WORDS[text]
    return text.trim() !== '' && !isNaN(text) ? Number(text) : text
}

const reducer = (prev, next) => {
    const patch = typeof next === 'function' ? next(prev) : next
    return patch ? {...prev, ...patch} : prev
}

const init = () => ({preset: 'shapes', list: entries('shapes'), multiple: false, value: null, option: '', seq: 0})

// [DOC: safety-list]
const chip = ({key, value}) => {
    const code = parse(value)
    return <Option key={key} id={key} value={key} label={code} className='rac-safety-chip'><CodeBlock code={code} className='rac-safety-code'/></Option>
}

export function useSafety() {
    const [state, dispatch] = useReducer(reducer, null, init)
    const {list, option} = state

    const inputRef = useRef(null)

    // select props
    const options = useMemo(() => list.map(item => item.value).filter(value => !isValidElement(value)), [list])
    const children = useMemo(() => list.filter(item => isValidElement(item.value)).map(item => cloneElement(item.value, {key: item.key})), [list])

    // list editor props
    const keys = useMemo(() => list.map(item => item.key), [list])
    const chips = useMemo(() => list.map(chip), [list])

    const addOption = useCallback((e) => {
        e?.preventDefault()
        if (!option.trim()) {
            shake(inputRef.current)
            return
        }
        const value = read(option)
        // array items before jsx
        dispatch(s => {
            const at = s.list.findIndex(item => isValidElement(item.value))
            const next = [...s.list]
            next.splice(at < 0 ? next.length : at, 0, {key: `add-${s.seq}`, value})
            return {list: next, option: '', seq: s.seq + 1}
        })
    }, [option])

    const edit = useCallback((e) => {
        clearShake(inputRef.current)
        dispatch({option: e.target.value})
    }, [])

    const load = useCallback((preset) => dispatch(s => ({preset, list: entries(preset), value: s.preset === preset ? s.value : null})), [])
    const prune = useCallback((left) => dispatch(s => ({list: s.list.filter(item => left.includes(item.key))})), [])
    const toggle = useCallback((multiple) => dispatch({multiple, value: null}), [])
    const change = useCallback((value) => dispatch({value}), [])

    return useMemo(() => ({state, options, children, keys, chips, addOption, edit, load, prune, toggle, change, inputRef}), [state, options, children, keys, chips, addOption, edit, load, prune, toggle, change])
}
