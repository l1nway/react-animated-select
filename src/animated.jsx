import {CSSTransition} from 'react-transition-group'
import {useCallback, useRef} from 'react'

const Animated = ({children, setLeaving, duration, setSpacer, id = null, widthMode = false, ...props}) => {

    const nodeRef = useRef(null)

    const getMargins = useCallback(() => {
        if (!nodeRef.current) return {t: 0, b: 0, l: 0, r: 0}
        const s = window.getComputedStyle(nodeRef.current)
        return {
            t: s.marginTop, b: s.marginBottom,
            l: s.marginLeft, r: s.marginRight
        }
    }, [])
    
    return (
        <CSSTransition
            classNames='rac-slide-left'
            timeout={duration}
            nodeRef={nodeRef}
            unmountOnExit
            {...props}
            onEnter={() => {
                const el = nodeRef.current
                if (!el) return
                if (widthMode) {
                    el.style.width = '0px'
                    el.style.marginLeft = '0px'
                    el.style.marginRight = '0px'
                } else {
                    el.style.height = '0px'
                    el.style.marginTop = '0px'
                    el.style.marginBottom = '0px'
                    el.style.transform = 'translateY(-10px)'
                }
                    el.style.opacity = '0'
            }}
            onEntering={() => {
                const el = nodeRef.current
                const m = getMargins()
                el.offsetHeight 
                if (widthMode) {
                    el.style.width = el.scrollWidth + 'px'
                    el.style.marginRight = m.r
                    el.style.marginLeft = m.l
                } else {
                    el.style.height = el.scrollHeight + 'px'
                    el.style.transform = 'translateY(0)'
                    el.style.marginBottom = m.b
                    el.style.marginTop = m.t
                }
                el.style.opacity = '1'
            }}
            onEntered={() => {
                const el = nodeRef.current
                el.style.width = widthMode ? 'auto' : ''
                el.style.height = widthMode ? '' : '100%'
                el.style.opacity = '1'
                el.style.transform = ''
                setSpacer?.(false)
            }}
            onExit={() => {
                const el = nodeRef.current
                const m = getMargins()
                if (widthMode) {
                    el.style.width = el.offsetWidth + 'px'
                    el.style.marginRight = m.r
                    el.style.marginLeft = m.l
                } else {
                    el.style.height = el.offsetHeight + 'px'
                    el.style.position = 'absolute'
                    el.style.marginBottom = m.b
                    el.style.marginTop = m.t
                }
                el.style.opacity = '1'
                setLeaving?.(true)
            }}
            onExiting={() => {
                const el = nodeRef.current
                if (widthMode) {
                    el.style.marginRight = '0px'
                    el.style.marginLeft = '0px'
                    el.style.width = '0px'
                } else {
                    el.style.transform = 'translateY(10px)'
                    el.style.marginBottom = '0px'
                    el.style.marginTop = '0px'
                    el.style.height = '0px'
                }
                el.style.opacity = '0'
            }}
            onExited={() => {setSpacer?.(false); setLeaving?.(false)}}
        >
            <div 
                ref={nodeRef} 
                id={id}
                style={{
                    transition: `all ${duration}ms ease`,
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    display: 'flex',
                    left: 0,
                    top: 0,
                }}
            >
                {children}
            </div>
        </CSSTransition>
    )
}

export default Animated