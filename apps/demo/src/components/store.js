import {useSyncExternalStore} from 'react'
import {ITEMS, MENU, groupOf, dyOf} from '../menu/components'

// [DOC: prerender]
const INITIAL = {cat: 'idle', scrollTo: null, shown: ['start'], mounted: 0, target: null, restoring: false}
export const INPUT = ['wheel', 'touchstart', 'keydown', 'pointerdown']
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
const NESTED = MENU.slice(1)
export const PARTS = ['start', 'question', ...NESTED.flatMap(group => [group.id, ...group.sub.map(sub => sub.id)])]
const PARENT = Object.fromEntries([['question', 'start'], ...NESTED.flatMap(group => group.sub.map(sub => [sub.id, group.id]))])
const KEY = 'rac-scroll'

export const partOf = id => PARTS.includes(id) ? id : groupOf(id)?.id
const withParent = id => PARENT[id] ? [PARENT[id], id] : [id]
export const idle = fn => window.requestIdleCallback ? requestIdleCallback(fn, {timeout: 400}) : setTimeout(fn, 40)
export const showAll = () => setStore({shown: PARTS})

const readTarget = () => {
    const nav = performance.getEntriesByType('navigation')[0]?.type
    const path = location.pathname.slice(import.meta.env.BASE_URL.length).split('/')[0]
    let saved = null
    try {saved = (nav === 'reload' || nav === 'back_forward') && JSON.parse(sessionStorage.getItem(KEY))} catch {/* storage blocked */}
    // legacy hash links
    const route = [location.hash.slice(1), path].find(id => ITEMS.some(item => item.id === id))
    if (saved?.id && ITEMS.some(item => item.id === saved.id)) return {...saved, route}
    return route ? {id: route, dy: dyOf(route), route} : null
}

const save = () => {
    const anchor = ITEMS.map(item => document.getElementById(item.id)).filter(Boolean).findLast(el => el.getBoundingClientRect().top <= 1)
    try {
        if (anchor) sessionStorage.setItem(KEY, JSON.stringify({id: anchor.id, dy: Math.round(anchor.getBoundingClientRect().top)}))
        else sessionStorage.removeItem(KEY)
    } catch {/* storage blocked */}
}

// [DOC: manual-scroll-anchor]
let held = null
export const anchored = () => CSS.supports('overflow-anchor', 'auto')
// [DOC: mount-above-first]
export const liftFirst = () => !anchored() || matchMedia('(pointer: fine)').matches
export const hold = () => {
    if (anchored()) return
    const all = PARTS.map(id => document.getElementById(id)).filter(Boolean)
    const parts = all.filter(el => el.offsetHeight && el.getBoundingClientRect().bottom > 0 && !all.some(other => other !== el && el.contains(other)))
    const node = parts.findLast(el => el.getBoundingClientRect().top < innerHeight / 3) ?? parts[0]
    held = node && {node, top: node.getBoundingClientRect().top}
}
export const release = () => {
    const shift = held?.node.isConnected ? held.node.getBoundingClientRect().top - held.top : 0
    held = null
    shift && scrollBy({top: shift, behavior: 'instant'})
}

// nearest part next
let pending = false
export const advance = () => {
    if (pending) return
    pending = true
    idle(() => {
        pending = false
        const {shown, target, restoring} = state
        const from = PARTS.indexOf(partOf(target?.id) ?? 'start')
        // above first
        const lift = restoring && liftFirst() ? PARTS.length * 2 : 0
        const rank = id => {const i = PARTS.indexOf(id); return Math.abs(i - from) * 2 + (i < from) - (i < from) * lift}
        const next = PARTS.filter(id => !shown.includes(id)).sort((a, b) => rank(a) - rank(b))[0]
        if (!next) return
        hold()
        setStore({shown: [...new Set([...shown, ...withParent(next)])]})
    })
}

export function boot() {
    history.scrollRestoration = 'manual'
    const target = readTarget()
    const part = target && partOf(target.id)
    const index = PARTS.indexOf(part)
    setStore({target, restoring: !!part, shown: index >= 0 ?PARTS.slice(index, index + 2).flatMap(withParent) : ['start']})
    // [DOC: scroll-restore]
    if (part) {
        const pin = new ResizeObserver(() => {
            const el = !state.restoring && document.getElementById(target.id)
            el && scrollTo({top: el.getBoundingClientRect().top + scrollY - target.dy, behavior: 'instant'})
        })
        const unpin = () => {
            if (state.restoring) return
            pin.disconnect()
            INPUT.forEach(type => removeEventListener(type, unpin))
        }
        pin.observe(document.body)
        INPUT.forEach(type => addEventListener(type, unpin, {passive: true}))
    }
    addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', () => document.hidden && save())
    // restore guard
    part && setTimeout(() => state.restoring && (hold(), setStore({restoring: false, shown: [...new Set(['start', ...state.shown])]})), 3000)
}
