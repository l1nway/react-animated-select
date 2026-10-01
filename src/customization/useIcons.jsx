import {useEffect, useReducer, useState, useRef, useLayoutEffect, useMemo} from 'react'
import {XMarkIcon, ArrowUpIcon, CheckmarkIcon} from '../components/icons'
import {ChevronUp} from 'lucide-react'

const initialState = {
    items: [{
        icon: <ArrowUpIcon/>,
        name: 'arrow',
        desc: 'The chevron of the trigger and of the group headers. Draw it pointing up: the Select rotates it with CSS, so it points down while the menu is closed and flips up when the menu opens. false hides the arrows.',
        file: null
    }, {
        name: 'clear',
        icon: <XMarkIcon/>,
        desc: `The clear button that resets the whole selection. false removes the button and the Delete key shortcut.`,
        file: null
    }, {
        name: 'remove',
        icon: <XMarkIcon/>,
        desc: `The delete button of each chip in multiple mode. false removes the button, the Backspace shortcut and the long-press delete mode.`,
        file: null
    }, {
        name: 'check',
        icon: <CheckmarkIcon/>,
        desc: 'The tick inside the checkbox of a selected option in multiple mode. false leaves the checkbox empty.',
        file: null
    }, {
        name: 'checkbox',
        icon: false,
        desc: `The checkbox frame of each option in multiple mode. Without it, the built-in 1em frame is drawn around the check icon.`,
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
        case 'SET_ICON': {
            const url = action.payload instanceof File ? URL.createObjectURL(action.payload) : action.payload
            return {
                ...state,
                items: state.items.map(item =>
                    item.name === action.name ? {...item, file: url, hover: false} : item
                )
            }
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

    const icons = useMemo(() => ({arrow: ChevronUp, ...Object.fromEntries(state.items.filter(i => i.file).map(i => [i.name, i.file]))}), [state.items])

    return ({value, setValue, state, icons, containerRefs, animation, dispatch})
}

export default useIcons