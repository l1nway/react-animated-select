import {advance, getStore, idle, setStore, useStore, PARTS} from './store'
import {startTransition, useEffect, useLayoutEffect, useState} from 'react'

const LOAD = {
    question: () => import('../start/question'),
    features: () => import('../features/features'),
    custom: () => import('../customization/customization'),
    dev: () => import('../dev/dev')
}
// loaded part modules
const READY = {}
const PENDING = {}
const fetchPart = id => PENDING[id] ??= LOAD[id]().then(module => {READY[id] = module.default}, () => {})
const INSTANT = {behavior: 'instant'}
let preloaded = false

// block reveal
let reveal
const show = (block, i) => {
    const {target, mounted} = getStore()
    block.style.setProperty('--i', i)
    block.dataset.reveal = target && mounted < PARTS.length ? 'fade' : 'in'
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

function Mounted({id}) {
    useLayoutEffect(() => {
        const {target, restoring, mounted} = getStore()
        const anchor = restoring && document.getElementById(target.id)
        const el = document.getElementById(id)
        let restored = false
        if (anchor) {
            const top = anchor.getBoundingClientRect().top + scrollY - target.dy
            scrollTo({top, ...INSTANT})
            restored = top <= document.documentElement.scrollHeight - innerHeight + 1
        } else if (!CSS.supports('overflow-anchor', 'auto') && el.getBoundingClientRect().bottom <= 0) {
            scrollBy({top: el.offsetHeight, ...INSTANT})
        }
        if (!restoring) watch(el)
        else if (restored) PARTS.forEach(part => {const root = document.getElementById(part); root && watch(root)})
        setStore(restored ? {mounted: mounted + 1, restoring: false} : {mounted: mounted + 1})
        if (!preloaded) idle(() => Object.keys(LOAD).forEach(fetchPart))
        preloaded = true
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
        fetchPart(id).then(() => live && READY[id] && startTransition(() => setComponent(() => READY[id])))
        return () => {live = false}
    }, [id])

    return Component && <><Component/><Mounted id={id}/></>
}

export function Part({id, children}) {
    const shown = useStore(state => state.shown.includes(id))
    if (!shown) return null
    return children ? <>{children}<Mounted id={id}/></> : <Loaded id={id}/>
}
