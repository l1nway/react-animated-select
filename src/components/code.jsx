import {memo, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState} from 'react'
import {Copy, CopyCheck, Hammer} from 'lucide-react'
import {plain, tokenize} from './tokens'
import './code.css'

export function CopyButton({code}) {
    const [copied, setCopied] = useState(false)
    const timer = useRef()

    useEffect(() => () => clearTimeout(timer.current), [])

    const copy = () => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            aria-label={copied ? 'Copied' : 'Copy code'}
            data-copied={copied || undefined}
            className='rac-code-button'
            onClick={copy}
            type='button'
        >
            <Copy className='rac-copy-icon' aria-hidden='true'/>
            <CopyCheck className='rac-copy-icon' aria-hidden='true'/>
        </button>
    )
}

const PLAIN = {color: '#9CDCFE'}

// on-demand prism
let prism = null, loading = null
const load = () => loading ??= import('prism-react-renderer').then(module => {prism = module}, () => {})

const cut = (line, from, to) => {
    const out = []
    let at = 0
    for (const [content, s] of line) {
        const end = at + content.length
        const start = Math.max(from, at), stop = Math.min(to, end)
        if (start < stop) out.push([content.slice(start - at, stop - at), s])
        at = end
    }
    return out
}

const spans = (snip, i, from = 0, to = Infinity) => cut(snip.lines[i], from, to).map(([content, s], k) => <span key={k} className='token' style={snip.styles[s]}>{content}</span>)

export function CodeBlock({code, language = 'jsx', className = 'rac-code-solid'}) {
    const ref = useRef(null)
    const runtime = typeof code === 'string'
    const [lib, setLib] = useState(() => ({prism, fade: undefined}))

    // highlight once visible
    useEffect(() => {
        if (!runtime || lib.prism) return
        let live = true
        const io = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return
            io.disconnect()
            load().then(() => live && prism && setLib({prism, fade: true}))
        })
        io.observe(ref.current)
        return () => {
            live = false
            io.disconnect()
        }
    }, [runtime, lib.prism])

    const snip = useMemo(() => !runtime ? code : lib.prism ? tokenize(lib.prism, code, language) : plain(code), [runtime, code, language, lib.prism])

    return (
        <pre ref={ref} className={`rac-code ${className}`} style={PLAIN} data-fade={lib.fade}>
            {snip.lines.map((line, i) => <div key={i} className='token-line'>{line.length ? spans(snip, i) : '\n'}</div>)}
        </pre>
    )
}

// planned feature stub
export const Soon = ({title, code}) =>
    <div className='rac-soon' role='note'>
        <div className='rac-soon-badge rac-iconed'>
            <Hammer aria-hidden='true'/>
            <span><b>In development</b>{title && <>: {title}</>}</span>
        </div>
        {code && <CodeBlock code={code} className='rac-soon-code'/>}
    </div>

// line diff
const solid = text => text.replace(/\s/g, '').length
const lead = text => text.length - text.trimStart().length

const similar = (x, y) => {
    const max = Math.min(x.length, y.length)
    let p = 0, s = 0
    while (p < max && x[p] === y[p]) p++
    while (s < max - p && x.at(-1 - s) === y.at(-1 - s)) s++
    const shared = solid(x.slice(0, p)) + solid(x.slice(x.length - s))
    return shared && shared * 2 >= Math.min(solid(x), solid(y)) ? {p, s} : null
}

const hunk = (rows, A, B, dels, adds) => {
    let d = 0, from = 0
    dels.forEach((i, at) => {
        const k = adds.findIndex((j, n) => n >= from && similar(A[i], B[j]))
        if (k < 0) return
        rows.push(...dels.slice(d, at).map(a => ({a})), ...adds.slice(from, k).map(b => ({b})), {a: i, b: adds[k], ...similar(A[i], B[adds[k]])})
        d = at + 1
        from = k + 1
    })
    rows.push(...dels.slice(d).map(a => ({a})), ...adds.slice(from).map(b => ({b})))
}

const diff = (A, B) => {
    const L = Array.from({length: A.length + 1}, () => new Array(B.length + 1).fill(0))
    for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
    const rows = []
    let i = 0, j = 0, dels = [], adds = []
    while (i < A.length || j < B.length) {
        if (i < A.length && j < B.length && A[i] === B[j]) {
            hunk(rows, A, B, dels, adds)
            dels = []
            adds = []
            rows.push({a: i++, b: j++})
        } else if (j < B.length && (i === A.length || L[i][j + 1] >= L[i + 1][j])) adds.push(j++)
        else dels.push(i++)
    }
    hunk(rows, A, B, dels, adds)
    return rows
}

const seg = (on, snip, i, from, to) => to > from && <span className='rac-morph-seg' style={{'--n': to - from}} data-on={on || undefined}>{spans(snip, i, from, to)}</span>

// target side on
const morph = ([a, b], A, B, rows) => rows.map((row, k) => {
    // one side only
    if (row.a == null || row.b == null) {
        const on = row.b != null
        const [snip, i, text] = on ? [b, row.b, B[row.b]] : [a, row.a, A[row.a]]
        return (
            <div key={k} className='token-line rac-morph-row' data-on={on || undefined}>
                {spans(snip, i, 0, lead(text))}
                {seg(on, snip, i, lead(text), text.length)}
            </div>
        )
    }
    const text = B[row.b]
    if (row.p == null) return <div key={k} className='token-line'>{text ? spans(b, row.b) : '\n'}</div>
    // changed middle
    return (
        <div key={k} className='token-line'>
            {spans(b, row.b, 0, row.p)}
            {seg(false, a, row.a, row.p, A[row.a].length - row.s)}
            {seg(true, b, row.b, row.p, text.length - row.s)}
            {spans(b, row.b, text.length - row.s)}
        </div>
    )
})

// [DOC: code-morph]
export const CodeMorph = memo(function CodeMorph({code, onBusy}) {
    const ref = useRef(null)
    const [pair, setPair] = useState({from: code, to: code, step: 0})
    if (pair.to !== code) setPair({from: pair.to, to: code, step: pair.step + 1})
    const {from, to, step} = pair
    const [A, B] = useMemo(() => [from.text.split('\n'), to.text.split('\n')], [from, to])
    const rows = useMemo(() => from === to ? B.map((_, i) => ({a: i, b: i})) : diff(A, B), [from, to, A, B])
    const busy = useEffectEvent(value => onBusy?.(value))

    useLayoutEffect(() => {
        if (from === to) return
        const running = ref.current.getAnimations({subtree: true})
        const lock = running.length > 0
        let live = true
        if (lock) busy(true)
        // collapse to plain lines
        Promise.allSettled(running.map(item => item.finished)).then(() => live && setPair(prev => ({from: prev.to, to: prev.to, step: prev.step + 1})))
        return () => {
            live = false
            if (lock) busy(false)
        }
    }, [from, to])

    return <pre ref={ref} key={step} className='rac-code rac-code-solid' style={PLAIN}>{morph([from, to], A, B, rows)}</pre>
})
