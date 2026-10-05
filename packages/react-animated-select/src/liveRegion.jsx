import {SelectConfigContext, SelectStateContext} from './state'
import {memo, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore} from 'react'

const DEBOUNCE = 250
const WIPE = 5000
const NONE = []
const subscribe = () => () => {}

// [DOC: live-region]
const fill = (text, v) => typeof text === 'function' ? text(v) : String(text ?? '').replace(/\{(n|label)\}/g, () => v)

// [DOC: live-region]
const compose = (base, now, texts, multiple) => {
    const parts = []
    if (base.picked.length && !now.picked.length) parts.push(fill(texts.cleared))
    else if (multiple) {
        const ids = new Set(now.picked.map(o => o.id)), had = new Set(base.picked.map(o => o.id))
        const gone = base.picked.filter(o => !ids.has(o.id))
        if (gone.length) parts.push(fill(texts.removed, gone.map(o => o.name).join(', ')))
        if (now.picked.some(o => !had.has(o.id))) parts.push(fill(texts.selected, now.picked.length))
    }
    if (now.open && base.count && now.count > base.count) parts.push(fill(texts.loaded, now.count - base.count))
    if (now.error && !base.error) parts.push(fill(texts.error))
    return parts.filter(Boolean).join('. ')
}

// [DOC: live-region]
const LiveRegion = /* @__PURE__ */ memo(function LiveRegion() {
    const {selectRef, selectId, multiple, texts} = useContext(SelectConfigContext)
    const {selected, selectedIDs, normalizedOptions, visibility, deleting, error} = useContext(SelectStateContext)
    const mounted = useSyncExternalStore(subscribe, () => true, () => false)
    const [message, setMessage] = useState('')
    const live = useRef({base: null, timer: 0, wipe: 0, latest: null})
    const count = useMemo(() => normalizedOptions.reduce((n, o) => 'original' in o ? n + 1 : n, 0), [normalizedOptions])

    // latest values
    useEffect(() => {
        const picked = multiple ? selectedIDs : selected ? [selected] : NONE
        live.current.latest = {snap: {picked, count, open: visibility, error: !!error}, texts, multiple, deleting}
    })

    // [DOC: live-region]
    useEffect(() => {
        const box = live.current
        const {snap, deleting} = box.latest
        if (!box.base || !box.timer && !deleting && !selectRef.current?.contains(document.activeElement)) {
            box.base = snap
            return
        }
        clearTimeout(box.timer)
        box.timer = setTimeout(() => {
            box.timer = 0
            const {snap, texts, multiple} = box.latest
            const text = compose(box.base, snap, texts, multiple)
            box.base = snap
            if (!text) return
            setMessage(prev => prev === text ? `${text}\u00a0` : text)
            clearTimeout(box.wipe)
            box.wipe = setTimeout(() => setMessage(''), WIPE)
        }, DEBOUNCE)
    }, [selected, selectedIDs, count, error, selectRef])

    // unmount cleanup
    useEffect(() => {
        const box = live.current
        return () => {clearTimeout(box.timer); clearTimeout(box.wipe)}
    }, [])

    if (!mounted) return null
    return (
        <div className='rac-live'>
            <div aria-live='polite' aria-atomic='true'>{message}</div>
            {error && <div id={`${selectId}-error`}>{fill(texts.error)}</div>}
        </div>
    )
})

export default LiveRegion
