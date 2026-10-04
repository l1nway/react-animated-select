import {memo, useContext, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore} from 'react'
import {SelectConfigContext, SelectActionsContext, SelectStateContext} from './state'
import {effectiveHighlight} from './useSelectBehavior'
import {StatusRow} from './dropdown'
import {warnOnce} from './utils'

// [DOC: paging]
const request = ({props: {hasMore, loadMore}, lock, setPending}) => {
    if (!hasMore || lock.current) return
    if (!loadMore) return warnOnce('no loadMore', '`hasMore` is set, but there is no `loadMore` to call.')
    lock.current = true
    setPending(true)
    const settle = () => setPending(false)
    try {
        loadMore()?.then?.(settle, settle)
    } catch (error) {
        // sync throw
        lock.current = false
        settle()
        const report = globalThis.reportError ?? console.error
        report(error)
    }
}

// [DOC: paging]
const row = ({hasMore, loadButton, loadPending, moreText, pendingText}) => hasMore && loadButton
    ? {id: 'special-load-more-id', name: loadPending ? pendingText : moreText, loadMore: true, loading: loadPending, type: 'special'}
    : null

// [DOC: paging]
export const PagingFooter = /* @__PURE__ */ memo(function PagingFooter() {
    const {highlightStore, hasMore, loadButton, loadOffset, loadAhead} = useContext(SelectConfigContext)
    const {visibility, normalizedOptions, loadPending} = useContext(SelectStateContext)
    const {loadMoreOnce} = useContext(SelectActionsContext)
    const ref = useRef(null)
    const on = !loadButton && hasMore
    const count = normalizedOptions.length
    // [DOC: paging]
    const [armed, setArmed] = useState(count)
    if (!loadPending && armed !== count) setArmed(count)

    // load ahead
    const near = useSyncExternalStore(highlightStore.subscribe, () => {
        const index = effectiveHighlight(highlightStore.get())
        return index >= count - loadAhead ? index : null
    }, () => null)
    useLayoutEffect(() => {if (on && near !== null && visibility) loadMoreOnce()}, [on, near, visibility, count, loadMoreOnce])

    // [DOC: paging]
    useEffect(() => {
        const row = ref.current
        const list = on && visibility && row?.parentElement
        if (!list || typeof IntersectionObserver === 'undefined') return
        let near = false
        const value = Number(loadOffset)
        const offset = Number.isFinite(value) ? value : 0
        const margin = offset - (parseFloat(getComputedStyle(list).paddingBottom) || 0)
        const observer = new IntersectionObserver(entries => {
            const {isIntersecting, boundingClientRect, rootBounds} = entries.at(-1)
            // row end in zone
            near = isIntersecting && !!rootBounds && boundingClientRect.bottom <= rootBounds.bottom + 0.5
            if (near) loadMoreOnce()
        }, {root: list, rootMargin: `0px 0px ${margin}px 0px`, threshold: [0, 1]})
        observer.observe(row)
        // retry by scroll, stale guard
        const retry = () => {if (near && list.scrollHeight - list.scrollTop <= list.clientHeight + offset) loadMoreOnce()}
        list.addEventListener('scroll', retry, {passive: true})
        return () => {
            observer.disconnect()
            list.removeEventListener('scroll', retry)
        }
    }, [on, visibility, loadOffset, armed, loadMoreOnce])

    return <StatusRow ref={ref} more={on}/>
})

// [DOC: plugins]
export const paging = {Footer: PagingFooter, request, row}
