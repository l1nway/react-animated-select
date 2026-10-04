import {useCallback, useEffect, useLayoutEffect, useRef} from 'react'

// [DOC: dropdown-position]
const nudge = (panel, side, by) => {if (Math.abs(by) > 0.5) panel.style[side] = `${parseFloat(panel.style[side]) + by}px`}
const shift = (panel, rect, upward, offset) => {
    const box = panel.getBoundingClientRect()
    const style = getComputedStyle(panel)
    nudge(panel, 'left', rect.left - box.left + parseFloat(style.marginLeft))
    if (upward) nudge(panel, 'bottom', box.bottom + parseFloat(style.marginBottom) - rect.top + offset)
    else nudge(panel, 'top', rect.bottom + offset - box.top + parseFloat(style.marginTop))
}

// [DOC: dropdown-position]
const mark = (el, upward) => {if (el && el.dataset.placement !== (upward ? 'top' : 'bottom')) el.dataset.placement = upward ? 'top' : 'bottom'}
const hasIO = () => typeof IntersectionObserver !== 'undefined'
const isUp = (rect, height, below = window.innerHeight - rect.bottom) => below < height && rect.top > below

// [DOC: dropdown-position]
const useDropdownPosition = ({selectRef, panelRef, open, frozen, offset, onFlip}) => {
    const lastHeight = useRef(0)
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
        if (panel.scrollHeight) lastHeight.current = panel.scrollHeight
        const rect = select.getBoundingClientRect()
        const side = panel.dataset.placement, height = lastHeight.current
        // [DOC: dropdown-flip]
        const fits = side === 'top' ? rect.top - offset >= height : window.innerHeight - rect.bottom - offset >= height
        let upward = side && (held.current || fits) ? side === 'top' : isUp(rect, height)
        if (side && upward !== (side === 'top')) {
            flip.current?.()
            upward = side === 'top'
        }
        decide(upward)
        panel.style.width = `${rect.width}px`
        panel.style.left = `${rect.left + window.scrollX}px`
        panel.style.top = upward ? 'auto' : `${rect.bottom + window.scrollY + offset}px`
        panel.style.bottom = upward ? `${window.innerHeight - rect.top - window.scrollY + offset}px` : 'auto'
        shift(panel, rect, upward, offset)
    }, [selectRef, offset, decide])

    // [DOC: dropdown-position]
    const listRef = useCallback((list) => {if (list) place(list.parentElement)}, [place])
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
            return [rect.left - box.left, upward ? rect.top - box.bottom : rect.bottom - box.top, rect.width, window.innerHeight, panelRef.current?.scrollHeight, upward, rect.top >= room, window.innerHeight - rect.bottom >= room].join()
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

        panelRef.current?.removeAttribute('data-offscreen')
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
        // clipped by a scroll ancestor
        const seen = hasIO() && new IntersectionObserver(([{isIntersecting, boundingClientRect: r, rootBounds: v}]) => {
            const clipped = !isIntersecting && !!v && r.bottom > v.top && r.top < v.bottom && r.right > v.left && r.left < v.right
            panelRef.current?.toggleAttribute('data-offscreen', clipped)
        })
        if (seen) seen.observe(select)
        return () => {
            cancelAnimationFrame(frame)
            window.removeEventListener('scroll', kick, {capture: true})
            window.removeEventListener('resize', kick)
            for (const observer of [ro, mo, seen, moved]) if (observer) observer.disconnect()
            // next open decides afresh
            panel?.removeAttribute('data-placement')
        }
    }, [open, place, offset, selectRef, panelRef])

    return [listRef, replace]
}

export default useDropdownPosition
