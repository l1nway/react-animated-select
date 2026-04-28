import {Fragment, memo, useCallback, useLayoutEffect, useRef, useEffect} from 'react'
import {renderIcon} from '../selectUtils'
import SlideLeft from '../slideLeft'

const SelectedItem = memo(({element, setState, spacer, delWidth, selectRef, setVisibility, activeHoverId, hoverRowTop, swipedId, deleteInline, remove, DelIcon, normalizedOptions, swiped, deleting, entering, setDeleting, onRender, duration, rowEnd, showDelete}) => {

    const refs = useRef({
        longPressTimer: null,
        hoverTimer: null,
        longPress: false,
        swiping: false,
        touchStart: 0
    })

    const optionRef = useRef(null)

    const onTouchStart = useCallback((e) => {
        refs.current.touchStart = e.touches[0].clientX
        refs.current.longPress = false
        
        refs.current.longPressTimer && clearTimeout(refs.current.longPressTimer)
        
        refs.current.longPressTimer = setTimeout(() => {
            setDeleting(true)
            refs.current.longPress = true
            selectRef.current?.focus()
            setVisibility(false)
            if (window.navigator.vibrate) window.navigator.vibrate(50)
        }, 600)

        e.preventDefault()
    }, [])

    const onTouchMove = useCallback((e) => {
        if (refs.current.longPressTimer) clearTimeout(refs.current.longPressTimer)
        const currentX = e.touches[0].clientX
        const diff = refs.current.touchStart - currentX
        
        if (Math.abs(diff) > 10) {
            refs.current.swiping = true
            
            if (diff > 30 && !swiped) setState({activeHoverId: null, swipedId: element.id})
            else if (diff < -30 && swiped) setState({swipedId: null})
        }
    }, [element.id, swiped])

    const onTouchEnd = useCallback((e) => {
        refs.current.longPressTimer && clearTimeout(refs.current.longPressTimer)
        refs.current.longPress && e.preventDefault()
    }, [])

    const onHover = useCallback(() => {
        if (spacer?.state) return
        if (refs.current.hoverTimer) clearTimeout(refs.current.hoverTimer)

        refs.current.hoverTimer = setTimeout(() => {
            setState({
                hoverRowTop: optionRef.current?.getBoundingClientRect().top,
                activeHoverId: element.id,
                swipedId: null
            })
        }, 100)
    }, [element.id, spacer?.state])

    const onLeave = useCallback(() => {
        if (refs.current.hoverTimer) clearTimeout(refs.current.hoverTimer)
        refs.current.hoverTimer = setTimeout(() => setState({activeHoverId: null, hoverRowTop: null}), 100)
    }, [])

    useEffect(() => {if (!spacer?.state && optionRef.current) optionRef.current.matches(':hover') && onHover()}, [spacer?.state, onHover])

    useEffect(() => () => {
        refs.current.hoverTimer && clearTimeout(refs.current.hoverTimer)
        refs.current.longPressTimer && clearTimeout(refs.current.longPressTimer)
    }, [])

    let label = null

    if (element?.jsx) {label = element.jsx}
    else if (element?.name) {label = element.name} 
    else if (element?.raw !== undefined) {
        const recovered = normalizedOptions.find(o =>
            o.raw === element.raw ||
            o.original === element.raw ||
            o.userId === element.raw
        )
        if (recovered) {
            label = recovered.jsx ?? recovered.name
        }
    }

    if (label == null) {
        label = typeof element === 'object' 
            ? (element.label ?? element.name ?? element.value ?? 'Selected item') 
            : String(element)
    }

    const preventFocus = useCallback((e) => {
        e.stopPropagation()
        e.preventDefault()
    }, [])

    const removeAction = useCallback((e) => {
        setState({swipedId: null})
        remove(element.id)
        preventFocus(e)
    }, [element.id, remove])

    // handling clicks in delete mode
    const click = useCallback((e) => {
        preventFocus(e)
        if (refs.current.longPress) refs.current.longPress = false
        else if (deleting) removeAction(e)
    }, [deleting, removeAction])

    useLayoutEffect(() => {
        if (optionRef.current && onRender) {
            const {width} = optionRef.current.getBoundingClientRect()
            onRender(width) 
        }
    }, [onRender, label])

    const delVisibility = showDelete ? true : activeHoverId === element.id || swipedId === element.id || deleting

    const matchRowHover = hoverRowTop === optionRef.current?.getBoundingClientRect().top

    const hideSpacer = (activeHoverId || swipedId) && matchRowHover

    return (
        <Fragment>
            <div
                className={`rac-multiple-selected-option ${deleting ? '--deleting-shake' : ''}`}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseEnter={onHover}
                onMouseLeave={onLeave}
                onClick={click}
                ref={optionRef}
            >
                {label}
                <SlideLeft
                    style={{
                        backgroundColor: (deleting || deleteInline) ? 'transparent' : '--rac-multiple-del-bg',
                        position: (deleting || deleteInline) ? 'relative' : 'absolute',
                    }}
                    setEntering={(bool) => setState({entering: bool})}
                    setLeaving={(bool) => setState({leaving: bool})}
                    setSpacer={(val) => setState({spacer: val})}
                    className='rac-multiple-del'
                    visibility={delVisibility}
                    duration={duration}
                >
                    {renderIcon(DelIcon, {onClick: removeAction, onMouseDown: preventFocus})}
                </SlideLeft>
            </div>
            {(!showDelete && !deleting && deleteInline && rowEnd && entering !== element.id) &&
                <div style={{
                    minWidth: hideSpacer ? '0px' : `${delWidth}px`,
                    transition: `min-width ${duration}ms ease`,
                    '--del-width': `${delWidth}px`,
                    // backgroundColor: 'black',
                    flexBasis: '0px',
                    height: '1px',
                    flexShrink: 1
                }}
                    className='rac-del-spacer'
                />
            }
        </Fragment>
    )
})

export default SelectedItem