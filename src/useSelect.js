import {useMemo, useReducer, useEffect, useId, useRef, useState, useImperativeHandle} from 'react'
import {useStableActions, compactReducer, createStore} from './state'
import {warnOnce} from './utils'
import useSelectBehavior, {initialHighlight} from './useSelectBehavior'
import useSelectModel, {NO_PICK} from './useSelectModel'

// [DOC: select-store]
const initSelectState = (props) => ({
    internalVisibility: false,
    deleting: false,
    loadPending: false,
    toggledGroups: new Set(),
    internalValue: props.defaultValue,
    picked: NO_PICK
})

// [DOC: select-store]
export default function useSelect(props, jsxOptions) {
    const {ref, open: externalOpen, onOpenChange, hasMore, loadMore, loadButton, error, disabled, loading} = props

    const reactId = useId()
    const selectId = useMemo(() => reactId.replace(/:/g, ''), [reactId])

    const selectRef = useRef(null)
    useImperativeHandle(ref, () => selectRef.current)

    const [state, setState] = useReducer(compactReducer, props, initSelectState)
    const {internalVisibility, deleting, loadPending} = state

    const [highlightStore] = useState(() => createStore(initialHighlight))
    // [DOC: dropdown-position]
    const [positionStore] = useState(() => createStore({upward: false}))

    const isControlled = externalOpen !== undefined
    const requested = isControlled ? !!externalOpen : internalVisibility

    // scroll burst guard
    const loadLock = useRef(false)
    const wasActive = useRef(false)

    const core = useStableActions({
        // [DOC: select-store]
        setVisibility: (next) => {
            if (next === requested) return
            if (!isControlled) setState({internalVisibility: next})
            onOpenChange?.(next)
        },
        // [DOC: select-store]
        loadMoreOnce: () => {
            if (!hasMore || loadLock.current) return
            if (!loadMore) return warnOnce('no loadMore', '`hasMore` is set, but there is no `loadMore` to call.')
            loadLock.current = true
            setState({loadPending: true})
            const settle = () => setState({loadPending: false})
            try {
                loadMore()?.then?.(settle, settle)
            } catch (error) {
                // sync throw
                loadLock.current = false
                settle()
                const report = globalThis.reportError ?? console.error
                report(error)
            }
        },
        setListReady: (ready) => highlightStore.set({ready}),
        setDeleting: (bool) => setState({deleting: bool})
    })

    const model = useSelectModel({props, jsxOptions, state, setState, setVisibility: core.setVisibility, loadMoreOnce: core.loadMoreOnce})
    const {normalizedOptions, expandedGroups, selected, selectedIDs, hasOptions, active, hasActualValue, title, valueOption, actions: modelActions} = model
    // [DOC: state-semantics]
    const visibility = active && requested

    const behavior = useSelectBehavior({
        props, state, setState, normalizedOptions, expandedGroups, selected, selectedIDs, visibility, highlightStore,
        setVisibility: core.setVisibility, loadMoreOnce: core.loadMoreOnce, modelActions
    })

    // release pending load
    useEffect(() => {setState({loadPending: false})}, [normalizedOptions.length, hasMore, loadButton])
    useEffect(() => {if (!loadPending) loadLock.current = false}, [loadPending])

    // open focuses, close resets
    useEffect(() => {
        if (visibility && selectRef.current && document.activeElement !== selectRef.current) selectRef.current.focus()
        if (!visibility) highlightStore.set({index: -1, ready: false})
    }, [visibility, highlightStore])

    // [DOC: state-semantics]
    useEffect(() => {
        if (wasActive.current && !active) core.setVisibility(false)
        wasActive.current = active
    }, [active, core])

    const actions = useMemo(() => ({...core, ...modelActions, ...behavior}), [core, modelActions, behavior])

    const selectState = useMemo(() => ({
        visibility, deleting, loadPending, expandedGroups, selectedIDs,
        normalizedOptions, selected, hasOptions, active, hasActualValue, title, valueOption,
        disabled, loading, error
    }), [visibility, deleting, loadPending, expandedGroups, selectedIDs, normalizedOptions, selected, hasOptions, active, hasActualValue, title, valueOption, disabled, loading, error])

    return {selectId, selectRef, highlightStore, positionStore, state: selectState, actions}
}
