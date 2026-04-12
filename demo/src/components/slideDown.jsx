import {CSSTransition} from 'react-transition-group'
import {useRef} from 'react'

function SlideDown({visibility, children, duration = 300, className, easing = 'ease'}) {
    const nodeRef = useRef(null)

    return(
        <CSSTransition
            onEntering={() => nodeRef.current.style.height = nodeRef.current.scrollHeight + 'px'}
            onExit={() => nodeRef.current.style.height = nodeRef.current.scrollHeight + 'px'}
            onEntered={() => nodeRef.current.style.height = 'auto'}
            onExiting={() => nodeRef.current.style.height = '0px'}
            onEnter={() => nodeRef.current.style.height = '0px'}
            classNames='rac-slide-down'
            timeout={duration}
            nodeRef={nodeRef}
            in={visibility}
            unmountOnExit
        >
            <div
                style={{
                    transition: `height ${duration}ms ${easing}`,
                    overflow: 'hidden'
                }}
                className={`${className} rac-slide-down-enter-done`}
                ref={nodeRef}
                tabIndex={-1}
            >
                {children}
            </div>
        </CSSTransition>
    )
}

export default SlideDown