import {memo, useEffect, useMemo, useRef, useState} from 'react'
import {Copy, CopyCheck} from 'lucide-react'
import {plain, tokenize} from './tokens'

export const CopyButton = ({copy, code, keyId, copied}) =>
    <button
        onClick={() => copy(code, keyId)}
        data-copied={copied === keyId || undefined}
        className='rac-code-button'
        tabIndex={-1}
    >
        <Copy className='rac-copy-icon'/>
        <CopyCheck className='rac-copy-icon'/>
    </button>

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

const morph = ([a, b], A, B, rows, onA) => rows.map((row, k) => {
    // one side only
    if (row.a == null || row.b == null) {
        const own = row.a != null
        const [snip, i, text] = own ? [a, row.a, A[row.a]] : [b, row.b, B[row.b]]
        return (
            <div key={k} className='token-line rac-morph-row' data-on={own === onA || undefined}>
                {spans(snip, i, 0, lead(text))}
                {seg(own === onA, snip, i, lead(text), text.length)}
            </div>
        )
    }
    const [snip, i, text] = onA ? [a, row.a, A[row.a]] : [b, row.b, B[row.b]]
    if (row.p == null) return <div key={k} className='token-line'>{text ? spans(snip, i) : '\n'}</div>
    // changed middle
    return (
        <div key={k} className='token-line'>
            {spans(snip, i, 0, row.p)}
            {seg(onA, a, row.a, row.p, A[row.a].length - row.s)}
            {seg(!onA, b, row.b, row.p, B[row.b].length - row.s)}
            {spans(snip, i, text.length - row.s)}
        </div>
    )
})

export const CodeMorph = memo(function CodeMorph({codes, active}) {
    const [A, B] = useMemo(() => codes.map(code => code.text.split('\n')), [codes])
    const rows = useMemo(() => diff(A, B), [A, B])
    return <pre className='rac-code rac-code-solid' style={PLAIN}>{morph(codes, A, B, rows, active === 0)}</pre>
})
