import {CSSTransition} from 'react-transition-group'
import {useRef} from 'react'

function SlideLeft({visibility, children, duration = 300, unmount}) {
    const nodeRef = useRef(null)

    return (
        <CSSTransition
            in={visibility}
            timeout={duration}
            classNames='slide-left'
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
                    overflow: 'hidden',
                    // display: 'inline-block',
                    transition: `width ${duration}ms ease`,
                    display: 'grid',
                    height: '100%'
                    // verticalAlign: 'top'
                }}
            >
                {children}
            </div>
        </CSSTransition>
    )
}

export default SlideLeft