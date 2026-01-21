import {CSSTransition} from 'react-transition-group'
import {useRef} from 'react'

function SlideDown({visibility, children, duration = 300}) {
    const nodeRef = useRef(null)

    return(
        <CSSTransition
            in={visibility}
            timeout={300}
            classNames='slideDown'
            unmountOnExit
            nodeRef={nodeRef}
            onEnter={() => (nodeRef.current.style.height = '0px')}
            onEntering={() => (nodeRef.current.style.height = nodeRef.current.scrollHeight + 'px')}
            onEntered={() => (nodeRef.current.style.height = 'auto')}
            onExit={() => (nodeRef.current.style.height = nodeRef.current.scrollHeight + 'px')}
            onExiting={() => (nodeRef.current.style.height = '0px')}
        >
            <div
                ref={nodeRef}
                style={{
                    overflow: 'hidden',
                    transition: `height ${duration}ms ease`
                }}
                className='slideDown-enter-done'
                tabIndex={-1}
            >
                {children}
            </div>
        </CSSTransition>
    )
}

export default SlideDown