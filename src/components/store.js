import {useSyncExternalStore} from 'react'
import {ITEMS, groupOf} from '../menu/components'

const INITIAL = {cat: 'idle', scrollTo: null, shown: [], mounted: 0, target: null, restoring: false}
const INPUT = ['wheel', 'touchstart', 'keydown', 'pointerdown']
const listeners = new Set()
let state = INITIAL

export const subscribe = listener => {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export const getStore = () => state

export const setStore = next => {
    state = {...state, ...next}
    listeners.forEach(listener => listener())
}

export const useStore = select => useSyncExternalStore(subscribe, () => select(state), () => select(INITIAL))

// page parts in document order
export const PARTS = ['start', 'question', 'features', 'custom', 'dev']
const PARENT = {question: 'start'}
const KEY = 'rac-scroll'

export const partOf = id => PARTS.includes(id) ? id : groupOf(id)?.id
const withParent = id => PARENT[id] ? [PARENT[id], id] : [id]
export const idle = fn => window.requestIdleCallback ? requestIdleCallback(fn, {timeout: 400}) : setTimeout(fn, 40)
export const showAll = () => setStore({shown: PARTS})

const readTarget = () => {
    const nav = performance.getEntriesByType('navigation')[0]?.type
    const hash = decodeURIComponent(location.hash.slice(1))
    let saved = null
    try {saved = (nav === 'reload' || nav === 'back_forward') && JSON.parse(sessionStorage.getItem(KEY))} catch {/* storage blocked */}
    if (saved?.id && ITEMS.some(item => item.id === saved.id)) return saved
    return ITEMS.some(item => item.id === hash) ? {id: hash, dy: 20} : null
}

const save = () => {
    const anchor = ITEMS.map(item => document.getElementById(item.id)).filter(Boolean).findLast(el => el.getBoundingClientRect().top <= 1)
    try {
        if (anchor) sessionStorage.setItem(KEY, JSON.stringify({id: anchor.id, dy: Math.round(anchor.getBoundingClientRect().top)}))
        else sessionStorage.removeItem(KEY)
    } catch {/* storage blocked */}
}

// nearest part next
let pending = false
export const advance = () => {
    if (pending) return
    pending = true
    idle(() => {
        pending = false
        const {shown, target} = state
        const from = PARTS.indexOf(partOf(target?.id) ?? 'start')
        const rank = id => Math.abs(PARTS.indexOf(id) - from) * 2 + (PARTS.indexOf(id) < from)
        const next = PARTS.filter(id => !shown.includes(id)).sort((a, b) => rank(a) - rank(b))[0]
        next && setStore({shown: [...new Set([...shown, ...withParent(next)])]})
    })
}

export function boot() {
    history.scrollRestoration = 'manual'
    const target = readTarget()
    const part = target && partOf(target.id)
    const index = PARTS.indexOf(part)
    setStore({target, restoring: !!part, shown: index >= 0 ?PARTS.slice(index, index + 2).flatMap(withParent) : ['start']})
    // pin until input
    if (part) {
        const pin = new ResizeObserver(() => {
            let el = !state.restoring && document.getElementById(target.id), top = -target.dy
            for (; el; el = el.offsetParent) top += el.offsetTop
            top > -target.dy && scrollTo({top, behavior: 'instant'})
        })
        const unpin = () => {
            pin.disconnect()
            INPUT.forEach(type => removeEventListener(type, unpin))
        }
        pin.observe(document.body)
        INPUT.forEach(type => addEventListener(type, unpin, {passive: true}))
    }
    addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', () => document.hidden && save())
    // restore guard
    part && setTimeout(() => state.restoring && setStore({restoring: false, shown: [...new Set(['start', ...state.shown])]}), 3000)
}
