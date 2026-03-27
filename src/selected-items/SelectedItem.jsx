import {Fragment, memo, useCallback, useLayoutEffect, useRef} from 'react'
import SlideLeft from '../slideLeft'

const SelectedItem = memo(({element, index, leaving, setLeaving, setSpacer, selectRef, spacer, delSpacer, setVisibility, setActiveHoverId, activeHoverId, swipedId, setSwipedId, deleteInline, remove, renderIcon, DelIcon, normalizedOptions, swiped, onSwipe, deleting, setDeleting, onRender, duration}) => {

    const longPressTimer = useRef(null)
    const longPress = useRef(false)
    const swiping = useRef(false)
    const touchStart = useRef(0)
    const optionRef = useRef(null)

    const onTouchStart = useCallback((e) => {
        touchStart.current = e.touches[0].clientX
        longPress.current = false
        
        longPressTimer.current && clearTimeout(longPressTimer.current)
        
        longPressTimer.current = setTimeout(() => {
            setDeleting(true)
            longPress.current = true
            selectRef.current?.focus()
            setVisibility(false)
            if (window.navigator.vibrate) window.navigator.vibrate(50)
        }, 600)

        e.preventDefault()
    }, [])

    const onTouchMove = useCallback((e) => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current)
        const currentX = e.touches[0].clientX
        const diff = touchStart.current - currentX
        
        if (Math.abs(diff) > 10) {
            swiping.current = true
            
            if (diff > 30 && !swiped) {
                onSwipe(element.id)
            } 
            else if (diff < -30 && swiped) {
                onSwipe(null)
            }
        }
    }, [element.id, swiped, onSwipe])

    const onTouchEnd = useCallback((e) => {
        longPressTimer.current && clearTimeout(longPressTimer.current)
        longPress.current && e.preventDefault()
    }, [])

    let label = null

    if (element?.jsx) {
        label = element.jsx
    } else if (element?.name) {
        label = element.name
    } 
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

    const handleDelete = useCallback((e) => {
        preventFocus(e)
        remove(element.id)
        onSwipe(null)
        return
    }, [element.id, remove, onSwipe])

    const handleClick = useCallback((e) => {
        preventFocus(e)
        if (longPress.current) {
            longPress.current = false
            return
        }

        if (deleting) {
            handleDelete(e)
            return
        }
    }, [deleting, handleDelete])

    useLayoutEffect(() => {
        if (optionRef.current && onRender) {
            const width = optionRef.current.offsetWidth
            onRender(width)
        }
    }, [onRender, label])

    return (
        <Fragment>
            <div
                className={`rac-multiple-selected-option ${deleting ? '--deleting-shake' : ''}`}
                onMouseEnter={() => setActiveHoverId(element.id)}
                onMouseLeave={() => setActiveHoverId(null)}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onClick={handleClick}
                ref={optionRef}
            >
                {label}
                <SlideLeft
                    style={{
                        backgroundColor: (deleting || deleteInline) ? 'transparent' : '--rac-multiple-del-bg',
                        position: (deleting || deleteInline) ? 'relative' : 'absolute',
                    }}
                    visibility={activeHoverId === element.id || swipedId === element.id || deleting}
                    className='rac-multiple-del'
                    setLeaving={setLeaving}
                    setSpacer={setSpacer}
                    duration={duration}
                >
                    {renderIcon(DelIcon, {onClick: handleDelete, onMouseDown: preventFocus})}
                </SlideLeft>
            </div>
            <SlideLeft
                visibility={!leaving && !spacer?.state && !activeHoverId && !swipedId && !deleting && deleteInline && delSpacer}
                className='rac-multiple-option'
                style={{visibility: 'hidden'}}
            >
                <div
                    style={{padding: 0, marginRight: 0, marginLeft: 0}}
                    className='rac-multiple-selected-option'
                >
                    {renderIcon(DelIcon)}
                </div>
            </SlideLeft>
        </Fragment>
    )
})

export default SelectedItem