import {normalizeOptions, resolveSelection, isPlain} from './model'
import {useStableActions, useDeepStable, deepEqual} from './state'
import {stopEvent} from './utils'
import {useMemo} from 'react'

export const NO_PICK = []

// [DOC: option-model]
export default function useSelectModel({props, jsxOptions, state, setState, ext, setVisibility, loadMoreOnce}) {
    const {onChange, disabled, loading, error, multiple, childrenFirst, groupsClosed, hasMore, loadButton, placeholder, selectedText, texts} = props
    const {disabledOption, emptyOption, invalidOption, emptyGroup, loadMore: moreText, loadingMore: pendingText} = texts
    const {loadPending, internalValue, toggledGroups, picked} = state

    // stabilize inline literals
    const options = useDeepStable(props.options)
    const controlledValue = useDeepStable(props.value)

    const isControlled = controlledValue !== undefined
    const value = isControlled ? controlledValue : internalValue

    // [DOC: paging]
    const tail = useMemo(() => ext.row?.({hasMore, loadButton, loadPending, moreText, pendingText}) ?? null, [ext, hasMore, loadButton, loadPending, moreText, pendingText])

    const normalizedOptions = useMemo(() => normalizeOptions({
        options, jsxOptions, childrenFirst, tail,
        emptyOption, invalidOption, disabledOption, emptyGroup
    }), [options, jsxOptions, childrenFirst, tail, emptyOption, invalidOption, disabledOption, emptyGroup])

    // [DOC: option-model]
    const expandedGroups = useMemo(() => new Set(normalizedOptions
        .filter(o => o.groupHeader && !o.disabled && groupsClosed === toggledGroups.has(o.name))
        .map(o => o.name)
    ), [normalizedOptions, toggledGroups, groupsClosed])

    // [DOC: selection-identity]
    const {selected, selectedIDs} = useMemo(() => resolveSelection(value, normalizedOptions, multiple, picked), [value, normalizedOptions, multiple, picked])

    const hasOptions = normalizedOptions.length > 0
    // [DOC: state-semantics]
    const active = !disabled && hasOptions

    // [DOC: state-semantics]
    const hasActualValue = value != null && !(Array.isArray(value) && !value.length) && !(isPlain(value) && !Object.keys(value).length)

    // [DOC: option-content]
    const valueOption = hasActualValue && selectedText ? null : selected

    // [DOC: state-semantics]
    const title = useMemo(() => {
        if (hasActualValue && selectedText) return selectedText
        if (selected) return selected.name
        if (error) return texts.error
        if (loading) return texts.loading
        if (disabled) return texts.disabled
        return hasOptions ? placeholder : texts.empty
    }, [error, loading, disabled, hasActualValue, selectedText, selected, hasOptions, placeholder, texts])

    const toggleGroup = (name) => setState(prev => {
        const next = new Set(prev.toggledGroups)
        next.has(name) ? next.delete(name) : next.add(name)
        return {toggledGroups: next}
    })

    // single exit for values
    const commit = (nextValue, ids, nextPicked) => {
        setState(isControlled ? {picked: nextPicked} : {internalValue: nextValue, picked: nextPicked})
        onChange?.(nextValue, ids)
    }
    const commitMultiple = (next) => commit(next.map(o => o.original), next.map(o => o.userId), next.map(o => o.id))

    const actions = useStableActions({
        toggleGroup,
        selectOption: (option, e) => {
            if (option.groupHeader) {
                stopEvent(e)
                if (!option.disabled) toggleGroup(option.name)
                return
            }
            if (option.disabled || option.loadMore) {
                stopEvent(e)
                if (option.loadMore && !option.loading) loadMoreOnce()
                return
            }
            if (multiple) {
                stopEvent(e)
                const isSelected = selectedIDs.some(item => item.id === option.id)
                commitMultiple(isSelected ? selectedIDs.filter(item => item.id !== option.id) : [...selectedIDs, option])
                return
            }
            // [DOC: option-model]
            if (selected?.id !== option.id) commit(option.original, option.userId, [option.id])
            setVisibility(false)
        },
        clear: (e) => {
            stopEvent(e)
            commit(multiple ? [] : null, multiple ? [] : null, NO_PICK)
        },
        removeOption: (id) => commitMultiple(selectedIDs.filter(item => item.id !== id)),
        // [DOC: form-field]
        reset: () => {
            setState({deleting: false, invalid: false})
            setVisibility(false)
            const empty = multiple ? [] : null
            const target = props.defaultValue ?? empty
            const {selected: one, selectedIDs: many} = resolveSelection(target, normalizedOptions, multiple, NO_PICK)
            const next = multiple ? many : one ? [one] : []
            const now = multiple ? selectedIDs : selected ? [selected] : []
            if (deepEqual(value ?? empty, target) && next.length === now.length && next.every((o, i) => o.id === now[i].id)) return
            commit(target, multiple ? next.map(o => o.userId) : one?.userId ?? null, next.map(o => o.id))
        }
    })

    return {normalizedOptions, expandedGroups, selected, selectedIDs, hasOptions, active, hasActualValue, title, valueOption, actions}
}
