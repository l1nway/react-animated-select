import {useCallback, useEffect, useLayoutEffect, useRef} from 'react'

// [DOC: dropdown-position]
const nudge = (panel, side, by) => {if (Math.abs(by) > 0.5) panel.style[side] = `${parseFloat(panel.style[side]) + by}px`}
const shift = (panel, left, edge, upward, offset) => {
    const box = panel.getBoundingClientRect()
    const style = getComputedStyle(panel)
    nudge(panel, 'left', left - box.left + parseFloat(style.marginLeft))
    if (upward) nudge(panel, 'bottom', box.bottom + parseFloat(style.marginBottom) - edge + offset)
    else nudge(panel, 'top', edge + offset - box.top + parseFloat(style.marginTop))
}

// [DOC: dropdown-position]
const mark = (el, upward) => {if (el && el.dataset.placement !== (upward ? 'top' : 'bottom')) el.dataset.placement = upward ? 'top' : 'bottom'}
const hasIO = () => typeof IntersectionObserver !== 'undefined'
const isUp = (rect, height, below = window.innerHeight - rect.bottom) => below < height && rect.top > below

// [DOC: dropdown-position]
const clipsOf = (el) => {
    const list = [], {body, documentElement} = el.ownerDocument
    for (let node = el.parentElement; node && node !== body && node !== documentElement; node = node.parentElement)
        if (getComputedStyle(node).overflowY !== 'visible') list.push(node)
    return list
}
const visible = (rect, clips) => {
    let top = -Infinity, bottom = Infinity, left = -Infinity, right = Infinity
    for (const el of clips) {
        const box = el.getBoundingClientRect()
        top = Math.max(top, box.top + el.clientTop)
        bottom = Math.min(bottom, box.top + el.clientTop + el.clientHeight)
        left = Math.max(left, box.left + el.clientLeft)
        right = Math.min(right, box.left + el.clientLeft + el.clientWidth)
    }
    const pin = v => Math.min(Math.max(v, top), bottom)
    const span = v => Math.min(Math.max(v, left), right)
    return {pin, span, ratio: rect.height ? +((pin(rect.bottom) - pin(rect.top)) / rect.height).toFixed(3) : 1}
}

// [DOC: dropdown-position]
const useDropdownPosition = ({selectRef, panelRef, open, frozen, offset, onFlip}) => {
    const lastHeight = useRef(0)
    const clips = useRef(null)
    const held = useRef(frozen)
    const flip = useRef(onFlip)
    useLayoutEffect(() => {
        held.current = frozen
        flip.current = onFlip
    })
    const decide = useCallback((upward) => [selectRef.current, panelRef.current].forEach(el => mark(el, upward)), [selectRef, panelRef])

    const place = useCallback((panel) => {
        const select = selectRef.current
        if (!select || !panel) return
        const rect = select.getBoundingClientRect()
        const {pin, span, ratio} = visible(rect, clips.current ??= clipsOf(select))
        const start = span(rect.left), width = span(rect.right) - start
        if (width && panel.scrollHeight) lastHeight.current = panel.scrollHeight
        const side = panel.dataset.placement, height = lastHeight.current
        // [DOC: dropdown-flip]
        const fits = side === 'top' ? rect.top - offset >= height : window.innerHeight - rect.bottom - offset >= height
        let upward = side && (held.current || fits || ratio < 1) ? side === 'top' : isUp(rect, height)
        if (side && upward !== (side === 'top')) {
            flip.current?.()
            upward = side === 'top'
        }
        decide(upward)
        const edge = pin(upward ? rect.top : rect.bottom)
        panel.style.width = `${width}px`
        panel.style.left = `${start + window.scrollX}px`
        panel.style.top = upward ? 'auto' : `${edge + window.scrollY + offset}px`
        panel.style.bottom = upward ? `${window.innerHeight - edge - window.scrollY + offset}px` : 'auto'
        shift(panel, start, edge, upward, offset)
        // [DOC: dropdown-position]
        if (ratio < 1) panel.style.setProperty('--rac-visible', ratio)
        else panel.style.removeProperty('--rac-visible')
        panel.toggleAttribute('data-offscreen', ratio === 0 || width === 0)
    }, [selectRef, offset, decide])

    // [DOC: dropdown-position]
    const listRef = useCallback((list) => {if (list && open) place(list.parentElement)}, [place, open])
    // [DOC: dropdown-flip]
    const replace = useCallback((panel) => {
        panel?.removeAttribute('data-placement')
        place(panel)
    }, [place])

    // [DOC: dropdown-position]
    useEffect(() => {
        const select = selectRef.current
        if (open || !select || !hasIO()) return
        lastHeight.current ||= parseFloat(getComputedStyle(select).getPropertyValue('--rac-list-max-height')) || 250
        const side = {fits: true, lower: false}
        const watch = (rootMargin, threshold, read) => {
            const io = new IntersectionObserver(([{boundingClientRect: rect, rootBounds: root}]) => {
                if (!root) return
                read(rect, root)
                decide(!side.fits && side.lower)
            }, {rootMargin, threshold})
            io.observe(select)
            return io
        }
        const observers = [
            watch(`0px 0px ${-lastHeight.current}px 0px`, [0, 1], (rect, root) => {side.fits = rect.bottom <= root.bottom}),
            watch('0px 0px -50% 0px', [0, 0.5, 1], (rect, root) => {side.lower = rect.top + rect.bottom > 2 * root.bottom})
        ]
        return () => observers.forEach(io => io.disconnect())
    }, [open, selectRef, decide])

    // [DOC: dropdown-position]
    useLayoutEffect(() => {
        const select = selectRef.current
        if (!open || !select) return
        const doc = select.ownerDocument, panel = panelRef.current
        let frame = 0, still = 0, last = '', moved = null
        const key = () => {
            const rect = select.getBoundingClientRect()
            const box = panelRef.current?.getBoundingClientRect() ?? rect
            const upward = isUp(rect, lastHeight.current), room = lastHeight.current + offset
            const {pin, span, ratio} = visible(rect, clips.current ?? []), top = panelRef.current?.dataset.placement === 'top'
            return [span(rect.left) - box.left, top ? pin(rect.top) - box.bottom : pin(rect.bottom) - box.top, ratio, span(rect.right) - span(rect.left), window.innerHeight, panelRef.current?.scrollHeight, upward, rect.top >= room, window.innerHeight - rect.bottom >= room].join()
        }
        const arm = () => {
            moved?.disconnect()
            if (!hasIO()) return
            const rect = select.getBoundingClientRect()
            const {clientWidth, clientHeight} = doc.documentElement
            const rootMargin = [rect.top, clientWidth - rect.right, clientHeight - rect.bottom, rect.left].map(v => `${-Math.floor(v)}px`).join(' ')
            let armed = false
            moved = new IntersectionObserver(([entry]) => {
                if (armed && entry.intersectionRatio < 1) kick()
                armed = entry.intersectionRatio === 1
            }, {root: doc, rootMargin, threshold: 1})
            moved.observe(select)
        }
        const sync = () => {
            if (key() === last) return false
            place(panelRef.current)
            last = key()
            return true
        }
        const tick = () => {
            frame = 0
            if (sync()) still = 0
            else if (++still > 1) return arm()
            frame = requestAnimationFrame(tick)
        }
        const kick = () => {
            still = 0
            frame ||= requestAnimationFrame(tick)
        }

        place(panelRef.current)
        last = key()
        arm()
        window.addEventListener('scroll', kick, {capture: true, passive: true})
        window.addEventListener('resize', kick)
        const ro = typeof ResizeObserver !== 'undefined' && new ResizeObserver(kick)
        if (ro) [select, panelRef.current].forEach(el => el && ro.observe(el))
        // dom change before paint
        const outside = ({target}) => !select.contains(target) && !panelRef.current?.contains(target)
        const mo = typeof MutationObserver !== 'undefined' && new MutationObserver(list => {if (list.some(outside) && sync()) kick()})
        if (mo) mo.observe(doc.body, {subtree: true, childList: true, attributes: true, characterData: true})
        return () => {
            cancelAnimationFrame(frame)
            window.removeEventListener('scroll', kick, {capture: true})
            window.removeEventListener('resize', kick)
            for (const observer of [ro, mo, moved]) if (observer) observer.disconnect()
            // next open decides afresh
            panel?.removeAttribute('data-placement')
            clips.current = null
        }
    }, [open, place, offset, selectRef, panelRef])

    return [listRef, replace]
}

export default useDropdownPosition
