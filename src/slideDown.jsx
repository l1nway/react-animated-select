import {CSSTransition} from 'react-transition-group'
import {useCallback, useRef} from 'react'

function SlideDown({visibility, children, duration = 300, className}) {
    const nodeRef = useRef(null)

    const getMargins = useCallback(() => {
        if (!nodeRef.current) return {top: '0px', bottom: '0px'}
        const style = window.getComputedStyle(nodeRef.current)
        return {top: style.marginTop, bottom: style.marginBottom}
    }, [])

    return(
        <CSSTransition
            onEnter={() => {
            nodeRef.current.style.height = '0px'
            nodeRef.current.style.marginTop = '0px'
            nodeRef.current.style.marginBottom = '0px'
        }}
        onEntering={() => {
            const {top, bottom} = getMargins()
            nodeRef.current.style.height = nodeRef.current.scrollHeight + 'px'
            nodeRef.current.style.marginBottom = bottom
            nodeRef.current.style.marginTop = top
        }}
        onEntered={() => nodeRef.current.style.height = 'auto'}
        onExit={() => {
            const {top, bottom} = getMargins()
            nodeRef.current.style.height = nodeRef.current.scrollHeight + 'px'
            nodeRef.current.style.marginBottom = bottom
            nodeRef.current.style.marginTop = top
            void nodeRef.current.offsetHeight
        }}
        onExiting={() => {
            nodeRef.current.style.height = '0px'
            nodeRef.current.style.marginTop = '0px'
            nodeRef.current.style.marginBottom = '0px'
        }}
            classNames='rac-slide-down'
            timeout={duration}
            nodeRef={nodeRef}
            in={visibility}
            unmountOnExit
        >
            <div
                style={{
                    transition: `height ${duration}ms ease, margin ${duration}ms ease`,
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