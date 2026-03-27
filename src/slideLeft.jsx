import {useRef, useEffect, forwardRef, useImperativeHandle} from 'react'
import {CSSTransition} from 'react-transition-group'

const SlideLeft = forwardRef(({className = '', visibility, setLeaving, setSpacer, children, duration = 300, unmount, style, exit = true}, ref) => {
    const nodeRef = useRef(null)
    
    useImperativeHandle(ref, () => nodeRef.current)

    useEffect(() => {if (!visibility && nodeRef.current) {nodeRef.current.style.width = '0px'}}, [])

    return (
        <CSSTransition
            onEnter={() => {
                nodeRef.current.style.transition = 'none'
                nodeRef.current.style.width = '0px'
            }}
            onEntering={() => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (nodeRef.current) {
                            nodeRef.current.style.transition = `width ${duration}ms, color ${duration}ms, background-color ${duration}ms`
                            nodeRef.current.style.width = nodeRef.current.scrollWidth + 'px'
                        }
                    })
                })
            }}
            onEntered={() => {nodeRef.current.style.width = 'auto'; setSpacer?.(false)}}
            onExit={() => {
                nodeRef.current.style.width = nodeRef.current.scrollWidth + 'px'
                void nodeRef.current.offsetHeight
                setLeaving?.(true)
            }}
            onExiting={() => nodeRef.current.style.width = '0px'}
            onExited={() => {unmount?.(); setLeaving?.(false); setSpacer?.(false)}}
            classNames='rac-slide-left'
            unmountOnExit={exit}
            timeout={duration}
            nodeRef={nodeRef}
            in={visibility}
        >
            <div
                className={className}
                ref={nodeRef}
                style={{
                    transition: `width ${duration}ms, color ${duration}ms, background-color ${duration}ms`,
                    willChange: 'width',
                    overflow: 'hidden',
                    ...style,
                }}
            >
                {children}
            </div>
        </CSSTransition>
    )
})

export default SlideLeft