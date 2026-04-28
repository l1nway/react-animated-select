import {useMemo, useReducer, useEffect, useCallback, useId, useRef, useImperativeHandle} from 'react'
import {selectReducer, initialState} from './selectUtils'
import useSelectBehavior from './useSelectBehavior'
import useSelectLogic from './useSelectLogic'
import {makeId} from './makeId'

function useSelect({setExternalVisibility, externalVisibility, loadButtonText, loadMoreText, ownBehavior, loadButton, loadOffset, loadAhead,loadMore, hasMore, onOpen, onClose, props, ref}) {

    const reactId = useId()
    const selectId = useMemo(() => reactId.replace(/:/g, ''), [reactId])
    
    // hook so that user can get selectRef from the outside
    const selectRef = useRef(null)
    useImperativeHandle(ref, () => selectRef.current)

    const [state, dispatch] = useReducer(selectReducer, {loadButton, loadButtonText, loadMoreText}, initialState)
    const {internalVisibility, animationFinished, jsxOptions, deleting, loadingTitle} = state

    const setState = useCallback((payload) => dispatch({type: 'SET', payload}), [])

    // select visibility control
    const isControlled = externalVisibility !== undefined

    const visibility = useMemo(() => {
        if (ownBehavior) return !!externalVisibility
        return isControlled ? !!externalVisibility : internalVisibility
    }, [ownBehavior, isControlled, externalVisibility, internalVisibility])
    
    const setVisibility = useCallback((newState) => {
        if (ownBehavior) return
        !isControlled && setState({internalVisibility: newState})
        setExternalVisibility?.(newState)
    }, [ownBehavior, isControlled, setExternalVisibility])

    const registerOption = useCallback((opt) => {
        setState(prev => {
            const index = prev.jsxOptions.findIndex(o => o.id === opt.id)
            if (index !== -1) {
                const existing = prev[index]
                if (
                    existing.label === opt.label &&
                    existing.value === opt.value &&
                    existing.disabled === opt.disabled &&
                    existing.group === opt.group
                ) {
                    return prev
                }
                const next = [...prev]
                next[index] = opt
                return {jsxOptions: next}
            }
            return {jsxOptions: [...prev.jsxOptions, opt]}
        })
    }, [setState])

    const unregisterOption = useCallback((id) => setState(prev => ({jsxOptions: prev.jsxOptions.filter(o => o.id !== id)})), [])

    const logic = useSelectLogic({
        ...props, visibility, setVisibility, jsxOptions, hasMore, 
        loadButton, loadingTitle, loadMore, loadMoreText, setState
    })

    const {multiple, normalizedOptions, selected, selectOption, hasOptions, selectedValue, disabled, loading, error, expandedGroups, selectedIDs} = logic
    
    const behavior = useSelectBehavior({setState, loadButton, loadButtonText, hasMore, loadMore, disabled, multiple, open: visibility, setOpen: setVisibility, options: normalizedOptions, selectOption, selected, loadOffset, loadAhead, expandedGroups, selectedIDs, onOpen, onClose, deleting})

    const {highlightedIndex} = behavior

    useEffect(() => {
        visibility && selectRef.current && (document.activeElement !== selectRef.current) && selectRef.current.focus()
        !visibility && setState({animationFinished: false})
    }, [visibility])

    useEffect(() => {(error || disabled || loading || !hasOptions) && setVisibility(false)}, [error, disabled, loading, hasOptions, setVisibility])

    useEffect(() => {isControlled && setState({internalVisibility: !!externalVisibility})}, [externalVisibility, isControlled])  

    useEffect(() => {
        if (visibility && animationFinished && highlightedIndex !== -1) {
            const option = normalizedOptions[highlightedIndex]
            if (option) {
                const domElement = document.getElementById(`${selectId}-${makeId(option.id)}`)
                domElement?.scrollIntoView({block: 'nearest'})
            }
        }
    }, [highlightedIndex, visibility, animationFinished, normalizedOptions, selectId])

    const hasActualValue = useMemo(() => (
        selectedValue !== undefined && 
        selectedValue !== null && 
        !(Array.isArray(selectedValue) && selectedValue.length === 0) &&
        !(typeof selectedValue === 'object' && Object.keys(selectedValue).length === 0)
    ), [selectedValue])

    return ({selectId, selectRef, visibility, setVisibility, animationFinished, setAnimationFinished: (bool) => setState({animationFinished: bool}), deleting, loadingTitle, jsxOptions, registerOption, unregisterOption, logic, behavior, hasActualValue})
}

export default useSelect