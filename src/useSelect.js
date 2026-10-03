import {useMemo, useReducer, useEffect, useLayoutEffect, useId, useRef, useState, useImperativeHandle} from 'react'
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
    picked: NO_PICK,
    fieldsetDisabled: false,
    invalid: false
})

// [DOC: select-store]
export default function useSelect(ownProps, jsxOptions) {
    const [state, setState] = useReducer(compactReducer, ownProps, initSelectState)
    const {internalVisibility, deleting, loadPending, fieldsetDisabled} = state
    // [DOC: fieldset-disabled]
    const props = useMemo(() => fieldsetDisabled && !ownProps.disabled ? {...ownProps, disabled: true} : ownProps, [ownProps, fieldsetDisabled])
    const {ref, open: externalOpen, onOpenChange, popup, hasMore, loadMore, loadButton, error, disabled, loading, required, texts} = props

    const reactId = useId()
    const selectId = useMemo(() => reactId.replace(/:/g, ''), [reactId])

    const selectRef = useRef(null)
    useImperativeHandle(ref, () => selectRef.current)

    // [DOC: fieldset-disabled]
    useLayoutEffect(() => {
        const input = selectRef.current?.querySelector('.rac-input')
        if (!input) return
        const check = () => setState({fieldsetDisabled: !ownProps.disabled && input.matches(':disabled')})
        check()
        const observer = new MutationObserver(check)
        for (let el = input.parentElement; el; el = el.parentElement) if (el.tagName === 'FIELDSET') observer.observe(el, {attributeFilter: ['disabled']})
        return () => observer.disconnect()
    }, [ownProps.disabled])

    const [highlightStore] = useState(() => createStore(initialHighlight))

    const isControlled = externalOpen !== undefined
    const requested = isControlled ? !!externalOpen : internalVisibility

    // scroll burst guard
    const loadLock = useRef(false)
    const wasActive = useRef(false)

    const core = useStableActions({
        // [DOC: select-store]
        setVisibility: (next) => {
            // [DOC: popup]
            if (next === requested || next && !popup) return
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
        setDeleting: (bool) => setState({deleting: bool}),
        // [DOC: form-field]
        markInvalid: () => setState({invalid: true})
    })

    const model = useSelectModel({props, jsxOptions, state, setState, setVisibility: core.setVisibility, loadMoreOnce: core.loadMoreOnce})
    const {normalizedOptions, expandedGroups, selected, selectedIDs, hasOptions, active, hasActualValue, title, valueOption, actions: modelActions} = model
    // [DOC: state-semantics]
    const visibility = active && requested && popup

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

    // [DOC: dev-warnings]
    const modes = useRef(null)
    const valueControlled = props.value !== undefined
    useEffect(() => {
        const next = {value: valueControlled, open: isControlled}
        for (const key in next) if (modes.current && modes.current[key] !== next[key]) warnOnce(`switch ${key}`, `\`${key}\` switched between controlled and uncontrolled (\`undefined\`) after mount. Pick one mode for the lifetime of the Select, like a React input${key === 'value' ? '; clear a controlled value with `null` or `[]`' : ''}.`)
        modes.current = next
    }, [valueControlled, isControlled])

    // [DOC: form-field]
    useLayoutEffect(() => {selectRef.current?.querySelector('.rac-input')?.setCustomValidity(required && !hasActualValue && texts.required || '')}, [required, hasActualValue, texts.required])
    const invalid = state.invalid && required && !hasActualValue && !disabled

    const actions = useMemo(() => ({...core, ...modelActions, ...behavior}), [core, modelActions, behavior])

    const selectState = useMemo(() => ({
        visibility, deleting, loadPending, expandedGroups, selectedIDs,
        normalizedOptions, selected, hasOptions, active, hasActualValue, title, valueOption,
        disabled, fieldsetDisabled, invalid, loading, error
    }), [visibility, deleting, loadPending, expandedGroups, selectedIDs, normalizedOptions, selected, hasOptions, active, hasActualValue, title, valueOption, disabled, fieldsetDisabled, invalid, loading, error])

    return {selectId, selectRef, highlightStore, state: selectState, actions}
}
