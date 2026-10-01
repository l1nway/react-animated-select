import {useCallback, useContext, useEffect, useEffectEvent, useLayoutEffect, useRef, useState, useSyncExternalStore} from 'react'
import {flushSync} from 'react-dom'
import {SelectConfigContext, SelectActionsContext, SelectStateContext, createStore} from './state'

const SLOT = 'rac-chip-slot'
const FLIP = 'rac-flip'
const NONE = []
// [DOC: delete-reserve]
const SLACK = 0.25

// [DOC: chip]
const chipStoreInitial = {hoverId: null, swipedId: null, held: false, breaks: NONE}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const slotsOf = (parent) => Array.from(parent.children).filter(el => el.classList.contains(SLOT))
// collapse animations only
const isBusy = (value) => Array.from(value.children).some(el => el.getAnimations?.().some(a => a.constructor === Animation && a.id !== FLIP && a.playState === 'running'))
const sameList = (a, b) => a.length === b.length && a.every((item, i) => item === b[i])

// [DOC: chip-layout]
const rowsOf = (slots) => {
    const rows = []
    let bottom = -Infinity
    for (const el of slots) {
        const rect = el.getBoundingClientRect()
        if (rect.top >= bottom - 1) {
            rows.push([])
            bottom = rect.bottom
        }
        rows.at(-1).push(el)
        bottom = Math.max(bottom, rect.bottom)
    }
    return rows
}

// [DOC: chip-hold]
const ghostRows = (value, held, reserve, ids) => {
    const ghost = value.cloneNode(true)
    const {height, paddingInlineEnd} = getComputedStyle(value)
    ghost.style.cssText = `visibility: hidden; pointer-events: none; height: ${height}; min-height: 0; padding-inline-end: calc(${paddingInlineEnd} + ${reserve}px)`
    ghost.querySelectorAll(`:scope > :not(.${SLOT})`).forEach(el => el.remove())
    if (ids) slotsOf(ghost).forEach(el => ids.has(el.dataset.id) || el.remove())
    // [DOC: delete-reserve]
    if (reserve) ghost.querySelectorAll('.rac-chip-del').forEach(el => el.remove())
    const slots = slotsOf(ghost)
    const order = new Map(slots.map((el, index) => [el.dataset.id, index]))
    // rebuild held boundaries
    held?.slice(1).forEach((row, index) => {
        const start = Math.min(...row.map(id => order.get(id) ?? Infinity))
        const end = Math.max(...held[index].map(id => order.get(id) ?? -1).filter(at => at < start))
        if (end >= 0) slots[end].after(Object.assign(document.createElement('div'), {className: 'rac-spacer'}))
    })
    // [DOC: trigger-width]
    value.style.position = 'absolute'
    value.after(ghost)
    ghost.getAnimations?.({subtree: true}).forEach(a => a.effect?.getComputedTiming().endTime < Infinity && a.finish())
    const rows = rowsOf(slots).map(row => row.map(el => el.dataset.id))
    ghost.remove()
    value.style.position = ''
    return rows
}

// [DOC: chip-hold]
const breaksOf = (store, rows) => {
    const next = rows ? rows.slice(0, -1).map(row => row.at(-1)) : NONE
    const {breaks} = store.get()
    return sameList(breaks, next) ? breaks : next
}

// [DOC: delete-reserve]
const restBreaks = (store, value, chips, reserve) =>
    breaksOf(store, reserve && chips.length ? ghostRows(value, null, reserve, new Set(chips.map(chip => chip.id))) : null)

// [DOC: chip-hold]
const freeze = (store, value, hold) => {
    hold.rows = ghostRows(value, hold.rows, hold.reserve)
    store.set({held: true, breaks: breaksOf(store, hold.rows)})
}

// [DOC: chip-hold]
const flip = (el, from, duration, easing) => {
    if (!el.animate) return
    el.getAnimations().forEach(a => a.id === FLIP && a.cancel())
    const to = el.getBoundingClientRect()
    const x = from.left - to.left, y = from.top - to.top
    if (Math.abs(x) > 0.5 || Math.abs(y) > 0.5) el.animate([{transform: `translate(${x}px, ${y}px)`}, {transform: 'none'}], {id: FLIP, duration, easing})
}

// [DOC: value-height]
const followHeight = (root, memo, value, duration, easing) => {
    if (!root || value === memo.value) return
    const style = getComputedStyle(root)
    const from = memo.anim ? style.height : memo.root
    memo.anim?.cancel()
    memo.root = style.height
    const skip = !memo.value || from === memo.root || !root.animate || reducedMotion()
    memo.value = value
    memo.anim = null
    if (skip) return
    const frame = {overflow: 'hidden', alignItems: 'flex-start'}
    const anim = memo.anim = root.animate([{...frame, height: from}, {...frame, height: memo.root}], {duration, easing})
    anim.onfinish = () => {if (memo.anim === anim) memo.anim = null}
}

// [DOC: chip-layout]
export default function useChipLayout(chips) {
    const {selectRef, duration, easing, multiple, deleteInline, deleteAlways, icons} = useContext(SelectConfigContext)
    const {selectedIDs, deleting, visibility, active} = useContext(SelectStateContext)
    const {setDeleting, setVisibility} = useContext(SelectActionsContext)

    const [delWidth, setDelWidth] = useState(0)
    const [chipStore] = useState(() => createStore(chipStoreInitial))
    // [DOC: delete-reserve]
    const [delGroup] = useState(() => new Set())
    // [DOC: chip-hold]
    const held = useSyncExternalStore(chipStore.subscribe, () => chipStore.get().held, () => false)
    const breaks = useSyncExternalStore(chipStore.subscribe, () => chipStore.get().breaks, () => NONE)

    const holdRef = useRef({rows: null, reserve: 0, chips})
    const snapRef = useRef(null)
    const heightRef = useRef({value: 0, root: '', anim: null})
    const valueRef = useRef(null)
    const delIconRef = useRef(null)
    const inline = deleteInline && !deleteAlways && !deleting && !!icons.remove
    const reserve = inline ? delWidth + SLACK : 0
    const probe = multiple && inline && !delWidth

    // [DOC: chip-layout]
    const layout = useEffectEvent((refreeze) => {
        const value = valueRef.current
        const hold = holdRef.current
        if (!value) return
        if (refreeze && chipStore.get().held) freeze(chipStore, value, hold)
        followHeight(selectRef.current, heightRef.current, value.offsetHeight, duration, easing)
        if (!chipStore.get().held) chipStore.set({breaks: restBreaks(chipStore, value, hold.chips, hold.reserve)})
    })

    // [DOC: chip-hold]
    useLayoutEffect(() => {
        const hold = holdRef.current
        const value = valueRef.current
        const changed = hold.chips !== chips
        Object.assign(hold, {chips, reserve})
        if (changed && value && isBusy(value)) freeze(chipStore, value, hold)
        layout(!changed)
    }, [chips, reserve, chipStore])

    // [DOC: delete-reserve]
    useLayoutEffect(() => {
        const relayout = () => layout(true)
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(relayout)
        observer?.observe(valueRef.current)
        document.fonts?.addEventListener('loadingdone', relayout)
        return () => {
            observer?.disconnect()
            document.fonts?.removeEventListener('loadingdone', relayout)
        }
    }, [])

    // [DOC: chip-hold]
    const settle = useCallback(() => {
        const value = valueRef.current
        if (!value || !chipStore.get().held || isBusy(value)) return
        const slots = slotsOf(value)
        const from = slots.map(el => el.getBoundingClientRect())
        const breaks = restBreaks(chipStore, value, holdRef.current.chips, holdRef.current.reserve)
        holdRef.current.rows = null
        flushSync(() => chipStore.set({held: false, breaks}))
        if (!reducedMotion()) slots.forEach((el, index) => el.isConnected && flip(el, from[index], duration, easing))
    }, [chipStore, duration, easing])

    // [DOC: chip-hold]
    const snapshot = useCallback(() => {
        if (valueRef.current) snapRef.current = new Map(slotsOf(valueRef.current).map(el => [el, el.getBoundingClientRect()]))
    }, [])

    useLayoutEffect(() => {
        const from = snapRef.current
        if (!from || breaks !== chipStore.get().breaks) return
        snapRef.current = null
        if (!reducedMotion()) from.forEach((rect, el) => el.isConnected && flip(el, rect, duration, easing))
    }, [breaks, chips, chipStore, duration, easing])

    useEffect(() => () => heightRef.current.anim?.cancel(), [])

    // [DOC: touch-delete]
    useEffect(() => {
        if (deleting && visibility) setVisibility(false)
        if (deleting && (!selectedIDs.length || !active)) setDeleting(false)
        chipStore.set({hoverId: null, ...(!active && {swipedId: null})})
    }, [selectedIDs.length, deleting, visibility, active, setDeleting, setVisibility, chipStore])

    // [DOC: delete-reserve]
    useLayoutEffect(() => {
        const el = delIconRef.current
        if (!probe || !el) return
        const style = getComputedStyle(el)
        setDelWidth(el.getBoundingClientRect().width + parseFloat(style.marginLeft) + parseFloat(style.marginRight))
    }, [probe])

    return {chipStore, delGroup, valueRef, delIconRef, probe, settle, held, snapshot}
}
