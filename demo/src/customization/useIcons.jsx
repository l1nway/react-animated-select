import {useEffect, useReducer, useState, useRef, useLayoutEffect} from 'react'
import {XMarkIcon, ArrowUpIcon, CheckmarkIcon} from '../components/icons'

const initialState = {
    items: [{
        icon: <ArrowUpIcon/>,
        name: 'OpenIcon',
        desc: 'A directional chevron icon that indicates a collapsible menu. It points downwards when the menu is closed and flips upwards when the menu is expanded.',
        file: null
    }, {
        name: 'ClearIcon',
        icon: <XMarkIcon/>,
        desc: `An X shaped icon used to clear or reset the current selection. It provides a quick way for users to remove their input or close a temporary overlay, ensuring a clean state.`,
        file: null
    }, {
        name: 'DelIcon',
        icon: <XMarkIcon/>,
        desc: `An X shaped icon used to remove individual options in multi-select mode. It serves as a precise action trigger, allowing users to prune their selection list by dismissing specific tags or items with a single click.`,
        file: null
    }, {
        name: 'Checkmark',
        icon: <CheckmarkIcon/>,
        desc: 'A classic tick icon that signifies a successful selection. In multi-select mode, it appears inside the Checkbox to provide a clear visual confirmation that a specific option has been successfully toggled.',
        file: null
    }, {
        name: 'Checkbox', 
        icon: false,
        desc: `By default, this is a simple border surrounding the Checkmark to indicate a toggleable state. However, it can be fully customized by uploading a unique icon to match your design system's specific multi-select aesthetic.`,
        file: null
    }],
    drag: false}

const animation = {
    initial: {scale: 0.5, opacity: 0},
    animate: {scale: 1, opacity: 1},
    exit: {scale: 0.5, opacity: 0},
    transition: {
        transform: {duration: 0.5, ease: [0.34, 1.8, 0.64, 1]},
        opacity: {duration: 0.2, ease: 'linear'}
    }
}

function reducer(state, action) {
    switch (action.type) {
        case 'SET_ICON':
            const url = action.payload instanceof File ? URL.createObjectURL(action.payload) : action.payload
            return {
                ...state,
                items: state.items.map(item => 
                    item.name === action.name ? {...item, file: url, hover: false} : item
                )
            }
        case 'SET_DRAG':
            return {...state, drag: action.payload}
        case 'SET_OVER':
            return {
                ...state,
                items: state.items.map(item => 
                    item.name === action.name ? {...item, hover: action.payload} : item
                )
            }
        default:
            return state
    }
}

function useIcons() {
    const [state, dispatch] = useReducer(reducer, initialState)
    const [value, setValue] = useState(null)

    const containerRefs = useRef([])

    useEffect(() => {
        const handleDragOver = (e) => {
            e.preventDefault()
            if (!state.drag) dispatch({type: 'SET_DRAG', payload: true})
        }

        const handleDragLeave = (e) => {
            if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
                dispatch({type: 'SET_DRAG', payload: false})
            }
        }

        const handleDrop = (e) => {
            e.preventDefault()
            dispatch({type: 'SET_DRAG', payload: false})
        }

        window.addEventListener('dragover', handleDragOver)
        window.addEventListener('dragleave', handleDragLeave)
        window.addEventListener('drop', handleDrop)

        return () => {
            window.removeEventListener('dragover', handleDragOver)
            window.removeEventListener('dragleave', handleDragLeave)
            window.removeEventListener('drop', handleDrop)
        }
    }, [state.drag])

    useLayoutEffect(() => {
        const refs = containerRefs.current.filter(Boolean)
        if (refs.length === 0) return

        refs.forEach(el => {
            el.style.whiteSpace = 'nowrap'
            el.style.maxWidth = 'none'
        })

        const widths = refs.map(el => {
            return el.scrollWidth
        })

        const maxWidth = Math.max(...widths)
        
        if (maxWidth <= 0) return

        const targetWidth = maxWidth / 1.75

        refs.forEach(el => {
            el.style.whiteSpace = 'normal'
            el.style.minWidth = `${targetWidth}px`
        })
    }, [state.items])

    return ({value, setValue, state, containerRefs, animation, dispatch})
}

export default useIcons