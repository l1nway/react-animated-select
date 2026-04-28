import {getHorizontalMargin, getRowWidths, initialState, selectReducer} from './selectUtils'
import {useCallback, useEffect, useLayoutEffect, useRef, useReducer} from 'react'

const useItemsLogic = (props) => {
    const {selectedIDs, deleting, setDeleting, toggleVisibility, visibility, removeOption, setselectedIDs, selectRef, deleteInline} = props
    const [state, dispatch] = useReducer(selectReducer, initialState)

    const {spacerWidths, spacer, delWidth} = state
    const setState = useCallback((payload) => dispatch({type: 'SET', payload}), [])

    const prevCountRef = useRef(selectedIDs?.length || 0)
    const firstMount = useRef(true)
    const optionRef = useRef(null)
    const delIcon = useRef(null)

    // removing an option in multiple mode
    const remove = useCallback((id) => {
        if (removeOption) {removeOption(id)}
        else {setselectedIDs(prev => prev.filter(o => o.id !== id))}
    }, [removeOption, setselectedIDs])
    
    // handling clicks on select in multiple mode
    // if in delete mode, clicking outside option disables the mode
    const safeToggle = useCallback((e) => {
        if (deleting) {
            e.stopPropagation()
            e.preventDefault()
            setDeleting(false)
            return
        }
        toggleVisibility(e)
    }, [deleting, toggleVisibility])

    // 
    const registerItemWidth = useCallback((id, width) => {
        if (spacerWidths[id] !== width) {dispatch({type: 'SET_SPACER_WIDTH', id, width})}
    }, [spacerWidths])

    useLayoutEffect(() => {
        const element = optionRef.current
        if (!element) return

        const updateLayout = () => {
            setState({selectHeight: element.offsetHeight})

            const items = Array.from(element.children)
                .filter(i => i.classList.contains('rac-multiple-option'))

            if (!items.length) {
                setState({rowEndIds: []})
                return
            }

            const activeIds = new Set(selectedIDs.map(s => s.id))

            const rows = {}
            items.forEach(item => {if (activeIds.has(item.id)) rows[item.offsetTop] = item.id})
            setState({rowEndIds: Object.values(rows)})
        }

        updateLayout()

        const observer = new ResizeObserver(() => updateLayout())
        observer.observe(element)
        return () => observer.disconnect()
    }, [selectedIDs]) // selectedIDs обязателен здесь

    useEffect(() => {
        firstMount.current = false
        if (selectRef) {
            if (typeof selectRef === 'function') selectRef(selectRef.current)
            else selectRef.current = selectRef.current
        }
    }, [selectRef])

    useEffect(() => {
        (deleting && visibility && toggleVisibility()) && toggleVisibility?.()
        (deleting && selectedIDs?.length === 0) && setDeleting(false)
        setState({activeHoverId: null})
    }, [selectedIDs?.length, deleting])

    useLayoutEffect(() => {
        const container = optionRef.current
        const currentCount = selectedIDs?.length || 0
        const lastId = selectedIDs[currentCount - 1]?.id
        // terminate if options are missing or option container is invalid
        if (!container || !selectedIDs?.length || deleting) {
            if (!selectedIDs?.length) setState({spacer: {state: false, id: null, width: 0}, entering: null})
            return
        }

        // getting actual list of options in DOM 
        const items = Array.from(container.children)
            .filter(item => item.classList.contains('rac-multiple-option'))

        const isChanging = currentCount !== prevCountRef.current || 
                           items.length !== currentCount ||
                           (lastId && spacerWidths[lastId] && !prevCountRef.currentWidths?.[lastId])
        
        if (!container || !currentCount || deleting || !isChanging) {
            if (!currentCount && isChanging) setState({spacer: {state: false, id: null, width: 0}, entering: null})
            
            prevCountRef.current = currentCount
            prevCountRef.currentWidths = spacerWidths
            return
        }
        
        prevCountRef.current = currentCount
        prevCountRef.currentWidths = spacerWidths

        // option width
        const containerWidth = container.getBoundingClientRect().width

        // deletion case: checks if there are more options in the DOM than in the selectedIDs array (cuz TransitionGroup keeps elements in DOM for exit animations)
        if (items.length > selectedIDs.length) {
            const selectedIDsSet = new Set(selectedIDs.map(s => s.id))

            // find the index of the element that being removed from the state
            const removeIdx = items.findIndex(item => !selectedIDsSet.has(item.id))
            if (removeIdx === -1) return

            const elementToRemove = items[removeIdx]
            const prevElement = items[removeIdx - 1]

            // check if option is first in row; if not, it won't need a spacer
            const optFirst = prevElement && elementToRemove.getBoundingClientRect().top !== prevElement.getBoundingClientRect().top

            if (!optFirst) {
                setState({spacer: {state: false, id: null, width: 0}, entering: null})
                return
            }

            // group elements by their vertical position to calculate row-based metrics
            const rows = getRowWidths(items)
            const rowOffsets = Object.keys(rows).map(Number).sort((a, b) => a - b)
            const elementRowIndex = rowOffsets.indexOf(elementToRemove.getBoundingClientRect().top)

            // first row check
            if (elementRowIndex <= 0) {                
                setState({spacer: {state: false, id: null, width: 0}, entering: null})
                return
            }

            const prevRowTop = rowOffsets[elementRowIndex - 1]
            const prevRowWidth = rows[prevRowTop]

            // calculate remaining empty space in the previous row
            const remaining = containerWidth - prevRowWidth

            // set info for spacer appearance
            updateSpacer(prevElement?.id || null, true, remaining)
        }

        // adding case
        else if (items.length === selectedIDs.length) {
            const lastItem = items[items.length - 1]
            const lastId = selectedIDs[selectedIDs.length - 1]?.id
            const lastItemWidth = spacerWidths[lastId]

            if (!lastItemWidth) return
            
            // calculating margin sizes
            const targetForMargin = lastItem?.firstElementChild || lastItem
            // 
            const childMargin = getHorizontalMargin(targetForMargin)
            const parentMargin = getHorizontalMargin(lastItem)
            
            // analyze previous items to determine current row layout
            const otherItems = items.slice(0, -1)
            const rows = getRowWidths(otherItems)
            const rowOffsets = Object.keys(rows).map(Number).sort((a, b) => a - b)

            let remaining = containerWidth
            if (rowOffsets.length > 0) {
                // calculate available space in the very last row
                const lastRowTop = Math.max(...rowOffsets)
                remaining = containerWidth - (rows[lastRowTop] || 0)
            }

            // spacer is required if the new item's width exceeds the remaining space (causing a wrap)
            const spacerNeeded = (lastItemWidth + childMargin + parentMargin) > (remaining - delWidth + 0.1)
            const prevId = selectedIDs[selectedIDs.length - 2]?.id

            updateSpacer(prevId, spacerNeeded, remaining)
        }
        /**
        * updates spacer state only if the values have changed to prevent unnecessary re-renders
        * @param {string|number|null} id — ID of the reference element for the spacer (preceding element in deletion, current in addition)
        * @param {boolean} state — whether the spacer should be active
        * @param {number} width — calculated width for the spacer
        */
        function updateSpacer(id, state, width) {
            if (spacer.id === id && spacer.state === state && spacer.width === width) return
            setState({spacer: {state, id, width}, entering: state ? id : null})
        }
    }, [selectedIDs, spacerWidths, deleting])

    useLayoutEffect(() => {
        if (delIcon.current) {
            const rect = delIcon.current.getBoundingClientRect()
            const margin = getHorizontalMargin(delIcon.current.firstElementChild || delIcon.current)
            
            setState({delWidth: rect.width + margin})
        }
    }, [delIcon])

    return {state, setState, optionRef, firstMount, remove, safeToggle, registerItemWidth, delIcon, delWidth}
}

export default useItemsLogic