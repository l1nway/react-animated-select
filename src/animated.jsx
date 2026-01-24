import {useRef} from 'react'
import {CSSTransition} from 'react-transition-group'

const Animated = ({children, duration, ...props}) => {
    const nodeRef = useRef(null)

    return (
        <CSSTransition
            nodeRef={nodeRef}
            timeout={duration}
            classNames='rac-slide-left'
            {...props}
            
            onEnter={() => {
                nodeRef.current.style.width = '0px'
                nodeRef.current.style.opacity = '0'
            }}
            onEntering={() => {
                nodeRef.current.style.width = nodeRef.current.scrollWidth + 'px'
                nodeRef.current.style.opacity = '1'
            }}
            onEntered={() => {
                nodeRef.current.style.width = 'auto'
                nodeRef.current.style.opacity = '1'
            }}
            onExit={() => {
                nodeRef.current.style.width = nodeRef.current.scrollWidth + 'px'
                nodeRef.current.style.opacity = '1'
            }}
            onExiting={() => {
                nodeRef.current.style.width = '0px'
                nodeRef.current.style.opacity = '0'
                nodeRef.current.style.margin = '0'
            }}
        >
            <div 
                ref={nodeRef} 
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    transition: `all ${duration}ms ease`
                }}
            >
                {children}
            </div>
        </CSSTransition>
    )
}

export default Animated