import {CSSTransition} from 'react-transition-group'
import {useRef} from 'react'

function SlideLeft({
    visibility,
    children,
    duration,
    unmount
}) {
    const nodeRef = useRef(null)

    return (
        <CSSTransition
            in={visibility}
            timeout={duration}
            classNames='rac-slide-left'
            unmountOnExit
            nodeRef={nodeRef}
            onEnter={() => (nodeRef.current.style.width = '0px')}
            onEntering={() => (nodeRef.current.style.width = nodeRef.current.scrollWidth + 'px')}
            onEntered={() => (nodeRef.current.style.width = 'auto')}
            onExit={() => (nodeRef.current.style.width = nodeRef.current.scrollWidth + 'px')}
            onExiting={() => (nodeRef.current.style.width = '0px')}
            onExited={() => unmount?.()}
        >
            <div
                ref={nodeRef}
                style={{
                    display: 'grid',
                    overflow: 'hidden',
                    transition: `width ${duration}ms ease`
                }}
            >
                {children}
            </div>
        </CSSTransition>
    )
}

export default SlideLeft