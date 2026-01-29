import {useRef} from 'react'
import {CSSTransition} from 'react-transition-group'

const Animated = ({children, duration, widthMode = false, ...props}) => {
    const nodeRef = useRef(null)
    return (
        <CSSTransition
            nodeRef={nodeRef}
            timeout={duration}
            classNames='rac-slide-left'
            {...props}
            onEnter={() => {
        const el = nodeRef.current
        if (widthMode) {
          el.style.width = '0px'
        } else {
          el.style.height = '0px'
          el.style.transform = 'translateY(-10px)'
        }
        el.style.opacity = '0'
            }}
            onEntering={() => {
                const el = nodeRef.current
                el.offsetHeight 
                if (widthMode) {
                    el.style.width = el.scrollWidth + 'px'
                } else {
                el.style.height = el.scrollHeight + 'px'
                el.style.transform = 'translateY(0)'
                }
                el.style.opacity = '1'
            }}
            onEntered={() => {
                const el = nodeRef.current
                el.style.width = widthMode ? 'auto' : ''
                el.style.height = widthMode ? '' : 'auto'
                el.style.opacity = '1'
                el.style.transform = ''
            }}
            onExit={() => {
                const el = nodeRef.current
                if (widthMode) {
                    el.style.width = el.offsetWidth + 'px'
                } else {
                    el.style.height = el.offsetHeight + 'px'
                    el.style.position = 'absolute'
                }
                el.style.opacity = '1'
            }}
            onExiting={() => {
                const el = nodeRef.current
                if (widthMode) {
                    el.style.width = '0px'
                } else {
                    el.style.height = '0px'
                    el.style.transform = 'translateY(10px)'
                }
                    el.style.opacity = '0'
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
                    transition: `all ${duration}ms ease`,
                    top: 0,
                    left: 0
                }}
            >
                {children}
            </div>
        </CSSTransition>
    )
}

export default Animated