import {advance, getStore, hold, idle, liftFirst, partOf, release, setStore, useStore, PARTS} from './store'
import {startTransition, useEffect, useLayoutEffect, useState} from 'react'

const LOAD = {
    question: () => import('../start/question'),
    features: () => import('./group'),
    a11y: () => import('../features/a11y'),
    forms: () => import('../features/forms'),
    safety: () => import('../features/safety'),
    states: () => import('../features/states'),
    grouping: () => import('../features/grouping'),
    layout: () => import('../features/layout'),
    performance: () => import('../features/performance'),
    plugins: () => import('./group'),
    bundle: () => import('../plugins/bundle'),
    multiple: () => import('../plugins/multiple'),
    loading: () => import('../plugins/loading'),
    search: () => import('../plugins/search'),
    virtual: () => import('../plugins/virtual'),
    customization: () => import('./group'),
    styling: () => import('../customization/styling'),
    custom: () => import('../customization/custom'),
    icons: () => import('../customization/icons'),
    animations: () => import('../customization/animations'),
    dev: () => import('../dev/dev'),
    debug: () => import('../dev/debug'),
    ssr: () => import('../dev/ssr'),
    playground: () => import('../dev/playground'),
    author: () => import('../dev/author')
}
// loaded part modules
const READY = {}
const PENDING = {}
// [DOC: failed-part]
const fetchPart = id => PENDING[id] ??= LOAD[id]().then(module => {READY[id] = module.default}, error => {
    delete PENDING[id]
    console.error(error)
})
const INSTANT = {behavior: 'instant'}
let preloaded = false

// block reveal
let reveal
const show = (block, i) => {
    block.style.setProperty('--i', i)
    // dom check, strict mode safe
    block.dataset.reveal = getStore().target && !ready(PARTS) ? 'fade' : 'in'
}
const onReveal = entries => entries.filter(entry => entry.isIntersecting).forEach(({target}, i) => {
    reveal.unobserve(target)
    show(target, i)
})
const watch = el => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    reveal ??= new IntersectionObserver(onReveal)
    const blocks = el.tagName === 'ARTICLE' ? [...el.children] : [el]
    const rects = blocks.map(block => block.getBoundingClientRect())
    let i = 1
    blocks.forEach((block, n) => {
        if (block.dataset.reveal) return
        if (rects[n].top < innerHeight && rects[n].bottom > 0) return show(block, i++)
        block.dataset.reveal = 'wait'
        reveal.observe(block)
    })
}

// [DOC: scroll-restore]
const ready = parts => parts.every(part => document.getElementById(part))
// above mounted where required
const lifted = id => !liftFirst() || ready(PARTS.slice(0, PARTS.indexOf(partOf(id))))

// [DOC: wrapper-anchor]
const filled = (id, shift) => {
    const part = partOf(id)
    const box = document.getElementById(part)?.closest('.rac-section').getBoundingClientRect()
    return liftFirst() || box?.top - shift < 0 || box?.bottom - shift > innerHeight || ready(PARTS.slice(PARTS.indexOf(part) + 1))
}

// clamped target settled
const settled = id => {
    const at = PARTS.indexOf(partOf(id))
    if (!ready(PARTS.slice(at + 1))) return false
    for (let i = at - 1; i >= 0; i--) {
        const el = document.getElementById(PARTS[i])
        if (!el) return false
        if (el.getBoundingClientRect().top < 1) return true
    }
    return true
}

function Mounted({id}) {
    useLayoutEffect(() => {
        const {target, restoring, mounted} = getStore()
        const anchor = restoring && document.getElementById(target.id)
        const el = document.getElementById(id)
        let restored = false
        release()
        if (anchor) {
            const top = anchor.getBoundingClientRect().top + scrollY - target.dy
            const full = filled(target.id, top - scrollY)
            full && scrollTo({top, ...INSTANT})
            restored = full && lifted(target.id) && (top <= document.documentElement.scrollHeight - innerHeight + 1 || settled(target.id))
        }
        if (!restoring) watch(el)
        else if (restored) PARTS.forEach(part => {const root = document.getElementById(part); root && watch(root)})
        setStore(restored ? {mounted: mounted + 1, restoring: false} : {mounted: mounted + 1})
        // [DOC: preload-after-restore]
        if (!preloaded && (!getStore().restoring || liftFirst())) {
            preloaded = true
            idle(() => Object.keys(LOAD).forEach(fetchPart))
        }
        advance()
    }, [id])
    return null
}

// sliced render, no reveal throttle
function Loaded({id}) {
    const [Component, setComponent] = useState(null)
    fetchPart(id)

    useEffect(() => {
        let live = true
        fetchPart(id).then(() => {
            if (!live) return
            if (!READY[id]) return advance()
            hold()
            startTransition(() => setComponent(() => READY[id]))
        })
        return () => {live = false}
    }, [id])

    return Component && <><Component id={id}/><Mounted id={id}/></>
}

export function Part({id, children}) {
    const shown = useStore(state => state.shown.includes(id))
    if (!shown) return null
    return children ? <>{children}<Mounted id={id}/></> : <Loaded id={id}/>
}
