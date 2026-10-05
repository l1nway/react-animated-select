import {useCallback, useContext, useEffect, useEffectEvent, useLayoutEffect, useRef, useState, useSyncExternalStore} from 'react'
import {flushSync} from 'react-dom'
import {SelectConfigContext, SelectActionsContext, SelectStateContext, createStore} from './state'
import {reducedMotion, watchMotion, followHeight} from './utils'
import {NONE, slotsOf, restBreaks, freeze, snapRows} from './chipGeometry'
import {isBusy, isResizing, snapOf, flip, resizesOf, resize, shift, padOf, repad} from './chipMotion'

// [DOC: delete-reserve]
const SLACK = 0.25

// [DOC: chip]
const chipStoreInitial = {hoverId: null, swipedId: null, held: false, breaks: NONE}

// [DOC: chip-layout]
export default function useChipLayout(chips, {height, enter, leaving, onLeft}) {
    const {selectRef, duration, easing, deleteInline, deleteAlways, icons, valueAsOption, renderOption} = useContext(SelectConfigContext)
    const {selectedIDs, deleting, visibility, active} = useContext(SelectStateContext)
    const {setDeleting, setVisibility} = useContext(SelectActionsContext)

    const [delWidth, setDelWidth] = useState(0)
    const [chipStore] = useState(() => createStore(chipStoreInitial))
    // [DOC: delete-reserve]
    const [delGroup] = useState(() => new Set())
    // [DOC: chip-hold]
    const held = useSyncExternalStore(chipStore.subscribe, () => chipStore.get().held, () => false)
    const breaks = useSyncExternalStore(chipStore.subscribe, () => chipStore.get().breaks, () => NONE)
    // [DOC: presence]
    const still = useSyncExternalStore(watchMotion, reducedMotion, () => false)

    const holdRef = useRef({rows: null, reserve: 0, chips, swap: false, dress: false, wide: false, duration, easing})
    const snapRef = useRef(null)
    const padRef = useRef(null)
    const valueRef = useRef(null)
    const delIconRef = useRef(null)
    // [DOC: plugin-morph]
    const [entering, setEntering] = useState(() => !!enter && duration > 0 && !reducedMotion())
    const plain = leaving || entering
    const removable = !!icons.remove
    const inline = deleteInline && !deleteAlways && !deleting && removable
    const reserve = inline && !plain ? delWidth + SLACK : 0
    const probe = inline && !delWidth && chips.length > 0
    // [DOC: chip-resize]
    const look = plain ? 3 : !valueAsOption ? 0 : renderOption ? 2 : 1
    // [DOC: delete-mode]
    const dress = removable ? (deleteInline || deleting ? 1 : 0) | (deleteAlways || deleting ? 2 : 0) : 0
    const dressRef = useRef(dress)

    // [DOC: chip-layout]
    const layout = useEffectEvent((refreeze, observed) => {
        const value = valueRef.current
        const hold = holdRef.current
        if (!value) return
        // [DOC: chip-resize]
        const resizing = isResizing(value)
        if (resizing && observed) return
        if (refreeze && chipStore.get().held) freeze(chipStore, value, hold)
        // [DOC: value-height]
        if (resizing) hold.fit != null && followHeight(selectRef.current, height, hold.fit, hold.duration, hold.easing, value)
        else if (observed || height.value) followHeight(selectRef.current, height, value.offsetHeight, hold.duration, hold.easing)
        if (!chipStore.get().held) chipStore.set({breaks: restBreaks(chipStore, value, hold.chips, hold.reserve)})
    })

    // [DOC: chip-hold]
    const settle = useCallback(() => {
        const value = valueRef.current
        const hold = holdRef.current
        if (!value || !chipStore.get().held || isBusy(value, hold.dress)) return
        const slots = slotsOf(value)
        const from = slots.map(el => el.getBoundingClientRect())
        const breaks = restBreaks(chipStore, value, hold.chips, hold.reserve)
        Object.assign(hold, {rows: null, floor: null, fit: null, dress: false, wide: false})
        flushSync(() => chipStore.set({held: false, breaks}))
        // [DOC: presence]
        hold.swap = isBusy(value)
        if (hold.swap) flushSync(() => freeze(chipStore, value, hold))
        if (!reducedMotion()) slots.forEach((el, index) => el.isConnected && flip(el, from[index], hold.swap ? duration / 2 : duration, easing))
    }, [chipStore, duration, easing])

    // [DOC: chip-layout]
    useLayoutEffect(() => {Object.assign(holdRef.current, {duration, easing})}, [duration, easing])

    // [DOC: delete-mode]
    useLayoutEffect(() => {
        const was = dressRef.current, value = valueRef.current, hold = holdRef.current
        dressRef.current = dress
        if (was === dress || !value || !duration || reducedMotion()) return
        if ((was ^ dress) & 1) shift(value, !!(dress & 1), duration, easing, settle)
        if (!((was | dress) & 1) || !isBusy(value, true)) return
        const held = hold.rows, start = held ?? snapRows(snapRef.current)
        Object.assign(hold, {dress: true, wide: false, rows: start, reserve})
        if (start) freeze(chipStore, value, hold)
        if (start && hold.rows.length <= start.length) return
        Object.assign(hold, {wide: true, rows: held})
        freeze(chipStore, value, hold)
    }, [dress, reserve, chipStore, duration, easing, settle])

    // [DOC: chip-hold]
    useLayoutEffect(() => {
        const hold = holdRef.current
        const value = valueRef.current
        const changed = hold.chips !== chips
        Object.assign(hold, {chips, reserve})
        if (changed && value && isBusy(value, hold.dress)) freeze(chipStore, value, hold)
        layout(!changed)
    }, [chips, reserve, chipStore])

    // [DOC: delete-reserve]
    useLayoutEffect(() => {
        const relayout = () => layout(true, true)
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(relayout)
        if (observer) observer.observe(valueRef.current)
        else relayout()
        document.fonts?.addEventListener('loadingdone', relayout)
        return () => {observer?.disconnect(); document.fonts?.removeEventListener('loadingdone', relayout)}
    }, [])

    // [DOC: chip-hold]
    const snapshot = useCallback((sized) => {
        const value = valueRef.current
        if (!value) return
        snapRef.current = snapOf(value, sized)
        if (sized) padRef.current = padOf(value)
    }, [])

    // [DOC: chip-resize]
    useLayoutEffect(() => {
        const value = valueRef.current
        const hold = holdRef.current
        const pad = padRef.current
        padRef.current = null
        if (!value || !snapRef.current || !duration || reducedMotion()) return
        repad(value, pad, duration, easing)
        const runs = resizesOf(snapRef.current)
        if (!runs.length) return
        hold.floor = new Map(runs.map(({id, width}) => [id, width]))
        freeze(chipStore, value, hold)
        followHeight(selectRef.current, height, hold.fit, duration, easing, value)
        resize(runs, duration, easing, () => {settle(); layout(false, true)})
    }, [look, chipStore, duration, easing, selectRef, settle, height])

    // [DOC: plugin-morph]
    useEffect(() => {
        const frame = entering && requestAnimationFrame(() => setEntering(false))
        return () => cancelAnimationFrame(frame)
    }, [entering])
    useLayoutEffect(() => {
        const value = valueRef.current
        if (!leaving) return
        let frame
        const busy = () => chipStore.get().held || !!value?.getAnimations({subtree: true}).some(a => a.playState === 'running' && a.effect?.getComputedTiming().endTime < Infinity)
        const check = () => {if (busy()) frame = requestAnimationFrame(check); else onLeft()}
        check()
        return () => cancelAnimationFrame(frame)
    }, [leaving, onLeft, chipStore])

    useLayoutEffect(() => {
        const from = snapRef.current
        if (!from || breaks !== chipStore.get().breaks) return
        snapRef.current = null
        if (!reducedMotion()) from.forEach((rect, el) => el.isConnected && flip(el, rect, duration, easing))
    }, [breaks, chips, look, dress, chipStore, duration, easing])

    // [DOC: value-height]
    useLayoutEffect(() => {
        const value = valueRef.current
        const hold = holdRef.current
        if (!value || !height.value || isResizing(value)) return
        followHeight(selectRef.current, height, value.offsetHeight, hold.duration, hold.easing)
    }, [breaks, held, selectRef, height])

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

    return {chipStore, delGroup, valueRef, delIconRef, probe, settle, held, snapshot, look, dress, plain, wait: duration > 0 && !still}
}
