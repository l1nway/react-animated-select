import {useRef, useCallback, memo, useLayoutEffect} from 'react'
import {CSSTransition} from 'react-transition-group'
import {createPortal} from 'react-dom'

function Options({visibility, bottomDirection, children, selectRef, onAnimationDone, unmount = true, duration, easing, offset, animateOpacity, style, className, setBottomDirection = () => {}}) {
  
    const nodeRef = useRef(null)

    const syncPosition = useCallback(() => {
        if (!selectRef?.current || !nodeRef.current) return

        const rect = selectRef.current.getBoundingClientRect()
        const el = nodeRef.current

        const dropdownHeight = el.scrollHeight || 250
        const spaceBelow = window.innerHeight - rect.bottom
        const shouldShowUpward = spaceBelow < dropdownHeight && rect.top > spaceBelow

        if (shouldShowUpward !== bottomDirection) setBottomDirection(shouldShowUpward)

        el.style.width = `${rect.width}px`
        el.style.left = `${rect.left}px`

        if (shouldShowUpward) {
            el.style.top = 'auto'
            el.style.bottom = `${window.innerHeight - rect.top + offset}px`
            el.style.transformOrigin = 'bottom'
        } else {
            el.style.bottom = 'auto'
            el.style.top = `${rect.bottom + offset}px`
            el.style.transformOrigin = 'top'
        }
    }, [selectRef, bottomDirection, offset, setBottomDirection])

    useLayoutEffect(() => {
        if (visibility) {
        syncPosition()
        
        window.addEventListener('scroll', syncPosition, {capture: true, passive: true})
        window.addEventListener('resize', syncPosition)

        const ro = new ResizeObserver(syncPosition)
        if (selectRef.current) ro.observe(selectRef.current)
        
        return () => {
            window.removeEventListener('scroll', syncPosition, {capture: true, passive: true})
            window.removeEventListener('resize', syncPosition)
            ro.disconnect()
        }
        }
    }, [visibility, syncPosition, selectRef])

    const transitionString = `height var(--rac-duration) ${easing}${animateOpacity ? `, opacity var(--rac-duration) ${easing}` : ''}`;

    const baseStyles = {
        opacity: animateOpacity ? (visibility ? 1 : 0) : 1,
        transformOrigin: bottomDirection ? 'bottom' : 'top',
        pointerEvents: visibility ? 'all' : 'none',
        height: visibility ? 'auto' : '0px',
        '--rac-duration': `${duration}ms`,
        boxSizing: 'border-box',
        '--rac-easing': easing,
        zIndex: '2147483647',
        overflow: 'hidden',
        position: 'fixed',
        
        ...Object.fromEntries(
        Object.entries(style || {}).map(([key, value]) => [
            key.startsWith('--') ? key : `--rac-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`,
            value
        ]))
    }

    const onEnter = useCallback(() => {
        const el = nodeRef.current
        if (!el) return
        
        el.style.height = '0px'
        if (animateOpacity) el.style.opacity = '0'
        el.style.transition = ''
    }, [animateOpacity])

    const onEntering = useCallback(() => {
        const el = nodeRef.current
        if (!el) return
        
        el.style.transition = transitionString
        el.style.height = `${el.scrollHeight}px`
        if (animateOpacity) el.style.opacity = '1'
    }, [transitionString, animateOpacity])

    const onEntered = useCallback(() => {
        const el = nodeRef.current
        if (!el) return
        
        el.style.height = 'auto'
        el.style.transition = ''
        onAnimationDone && onAnimationDone()
    }, [onAnimationDone])

    const onExit = useCallback(() => {
        const el = nodeRef.current
        if (!el) return
        
        el.style.height = `${el.scrollHeight}px`
        if (animateOpacity) el.style.opacity = '1'
        
        el.offsetHeight
        el.style.transition = transitionString
    }, [transitionString, animateOpacity])

    const onExiting = useCallback(() => {
        const el = nodeRef.current
        if (!el) return
        
        el.style.height = '0px'
        if (animateOpacity) el.style.opacity = '0'
    }, [animateOpacity])

    const onExited = useCallback(() => {
        const el = nodeRef.current
        if (!el) return
        el.style.transition = ''
    }, [])

    return createPortal(
        <CSSTransition
            classNames='rac-options'
            unmountOnExit={unmount}
            onEntering={onEntering}
            onExiting={onExiting}
            onEntered={onEntered}
            onExited={onExited}
            timeout={duration}
            nodeRef={nodeRef}
            onEnter={onEnter}
            in={visibility}
            onExit={onExit}
        >
        <div
            style={{
                ...baseStyles,
                '--rac-duration-fast': 'calc(var(--rac-duration) * 0.5)',
                '--rac-duration-slow': 'calc(var(--rac-duration) * 1.3)',
                '--rac-duration-base': 'var(--rac-duration)',
                '--rac-duration': `${duration}ms`,

            }}
            className={`rac-options ${className || ''}`}
            onMouseDown={(e) => e.preventDefault()}
            ref={nodeRef}
        >
            {children}
        </div>
        </CSSTransition>, document.body
)}

export default memo(Options, (prev, next) => {
    return prev.visibility === next.visibility &&
            prev.duration === next.duration &&
            prev.easing === next.easing &&
            prev.offset === next.offset &&
            prev.animateOpacity === next.animateOpacity &&
            prev.selectRef === next.selectRef &&
            prev.children === next.children &&
            JSON.stringify(prev.style) === JSON.stringify(next.style)
})