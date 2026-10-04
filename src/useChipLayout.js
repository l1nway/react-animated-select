import {useCallback, useContext, useEffect, useEffectEvent, useLayoutEffect, useRef, useState, useSyncExternalStore} from 'react'
import {flushSync} from 'react-dom'
import {SelectConfigContext, SelectActionsContext, SelectStateContext, createStore} from './state'
import {reducedMotion, watchMotion, followHeight} from './utils'
import {sameValue} from './model'
import {NONE, slotsOf, isBusy, isResizing, restBreaks, freeze, snapOf, flip, resizesOf, resize} from './chipGeometry'

// [DOC: delete-reserve]
const SLACK = 0.25

// [DOC: chip]
const chipStoreInitial = {hoverId: null, swipedId: null, held: false, breaks: NONE}

// [DOC: chip-keys]
const rekey = (chips, prev) => {
    const ids = new Set(chips.map(chip => chip.id))
    const byId = new Map(prev.map(([key, chip]) => [chip.id, key]))
    const free = prev.filter(([, chip]) => !ids.has(chip.id))
    const taken = new Set(prev.map(([key]) => key))
    return chips.map(chip => {
        if (byId.has(chip.id)) return [byId.get(chip.id), chip]
        const at = free.findIndex(([, old]) => sameValue(old.original, chip.original))
        if (at >= 0) return [free.splice(at, 1)[0][0], chip]
        let key = chip.id
        while (taken.has(key)) key += '~'
        taken.add(key)
        return [key, chip]
    })
}

// [DOC: chip-keys]
export const useChipKeys = (chips) => {
    const [last, setLast] = useState(() => ({chips, keyed: rekey(chips, [])}))
    if (last.chips === chips) return last.keyed
    const keyed = rekey(chips, last.keyed)
    setLast({chips, keyed})
    return keyed
}

// [DOC: chip-layout]
export default function useChipLayout(chips) {
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

    const holdRef = useRef({rows: null, reserve: 0, chips, swap: false, duration, easing})
    const snapRef = useRef(null)
    const heightRef = useRef({value: 0, root: '', anim: null})
    const valueRef = useRef(null)
    const delIconRef = useRef(null)
    const inline = deleteInline && !deleteAlways && !deleting && !!icons.remove
    const reserve = inline ? delWidth + SLACK : 0
    const probe = inline && !delWidth && chips.length > 0
    // [DOC: chip-resize]
    const look = !valueAsOption ? 0 : renderOption ? 2 : 1

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
        const time = hold.swap ? hold.duration / 2 : hold.duration
        if (resizing) hold.fit != null && followHeight(selectRef.current, heightRef.current, hold.fit, time, hold.easing, value)
        else if (observed || heightRef.current.value) followHeight(selectRef.current, heightRef.current, value.offsetHeight, time, hold.easing)
        if (!chipStore.get().held) chipStore.set({breaks: restBreaks(chipStore, value, hold.chips, hold.reserve)})
    })

    // [DOC: chip-layout]
    useLayoutEffect(() => {Object.assign(holdRef.current, {duration, easing})}, [duration, easing])

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
        const relayout = () => layout(true, true)
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(relayout)
        if (observer) observer.observe(valueRef.current)
        else relayout()
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
        const hold = holdRef.current
        const slots = slotsOf(value)
        const from = slots.map(el => el.getBoundingClientRect())
        const breaks = restBreaks(chipStore, value, hold.chips, hold.reserve)
        Object.assign(hold, {rows: null, floor: null, fit: null})
        flushSync(() => chipStore.set({held: false, breaks}))
        // [DOC: presence]
        hold.swap = isBusy(value)
        if (hold.swap) flushSync(() => freeze(chipStore, value, hold))
        if (!reducedMotion()) slots.forEach((el, index) => el.isConnected && flip(el, from[index], hold.swap ? duration / 2 : duration, easing))
    }, [chipStore, duration, easing])

    // [DOC: chip-hold]
    const snapshot = useCallback((sized) => {
        if (valueRef.current) snapRef.current = snapOf(valueRef.current, sized)
    }, [])

    // [DOC: chip-resize]
    useLayoutEffect(() => {
        const value = valueRef.current
        const hold = holdRef.current
        if (!value || !snapRef.current || !duration || reducedMotion()) return
        const runs = resizesOf(snapRef.current)
        if (!runs.length) return
        hold.floor = new Map(runs.map(({id, from}) => [id, from.width]))
        freeze(chipStore, value, hold)
        followHeight(selectRef.current, heightRef.current, hold.fit, duration, easing, value)
        resize(runs, duration, easing, () => {
            settle()
            layout(false, true)
        })
    }, [look, chipStore, duration, easing, selectRef, settle])

    useLayoutEffect(() => {
        const from = snapRef.current
        if (!from || breaks !== chipStore.get().breaks) return
        snapRef.current = null
        if (!reducedMotion()) from.forEach((rect, el) => el.isConnected && flip(el, rect, duration, easing))
    }, [breaks, chips, look, chipStore, duration, easing])

    // [DOC: value-height]
    useLayoutEffect(() => {
        const value = valueRef.current
        const hold = holdRef.current
        if (!value || !heightRef.current.value || isResizing(value)) return
        followHeight(selectRef.current, heightRef.current, value.offsetHeight, hold.swap ? hold.duration / 2 : hold.duration, hold.easing)
    }, [breaks, held, selectRef])

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

    return {chipStore, delGroup, valueRef, delIconRef, probe, settle, held, snapshot, look, wait: duration > 0 && !still}
}
