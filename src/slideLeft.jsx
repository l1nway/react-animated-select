import {useRef, useEffect, forwardRef, useImperativeHandle, useCallback} from 'react'
import {CSSTransition} from 'react-transition-group'

const SlideLeft = forwardRef(({className = '', visibility = undefined, setLeaving, setEntering, setSpacer, children, duration = 300, unmount, style, exit = true, ...props}, ref) => {
    const nodeRef = useRef(null)

    const active = visibility !== undefined ? visibility : props.in
    
    useImperativeHandle(ref, () => nodeRef.current)

    useEffect(() => {if (!active && nodeRef.current) {nodeRef.current.style.width = '0px'}}, [])

    const getMargins = useCallback(() => {
        if (!nodeRef.current) return {left: '0px', right: '0px'}
        const style = window.getComputedStyle(nodeRef.current)
        return {left: style.marginLeft, right: style.marginRight}
    }, [])

    return (
        <CSSTransition
            onEnter={() => {
                nodeRef.current.style.transition = 'none'
                nodeRef.current.style.marginRight = '0px'
                nodeRef.current.style.marginLeft = '0px'
                nodeRef.current.style.width = '0px'
                setEntering?.(true)
            }}
            onEntering={() => {
                const {left, right} = getMargins()
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (nodeRef.current) {
                            nodeRef.current.style.transition = `width ${duration}ms, color ${duration}ms, background-color ${duration}ms, margin ${duration}ms ease`
                            nodeRef.current.style.width = nodeRef.current.scrollWidth + 'px'
                            nodeRef.current.style.marginRight = right
                            nodeRef.current.style.marginLeft = left
                        }
                    })
                })
            }}
            onEntered={() => {nodeRef.current.style.width = 'auto'; setSpacer?.(false); setEntering?.(false)}}
            onExit={() => {
                const {left, right} = getMargins()
                nodeRef.current.style.width = nodeRef.current.scrollWidth + 'px'
                nodeRef.current.style.marginRight = right
                nodeRef.current.style.marginLeft = left
                void nodeRef.current.offsetHeight
                setLeaving?.(true)
            }}
            onExiting={() => {
                nodeRef.current.style.marginRight = '0px'
                nodeRef.current.style.marginLeft = '0px'
                nodeRef.current.style.width = '0px'
            }}
            onExited={() => {unmount?.(); setLeaving?.(false); setSpacer?.(false)}}
            classNames='rac-slide-left'
            unmountOnExit={exit}
            timeout={duration}
            nodeRef={nodeRef}
            in={active}
            {...props}
        >
            <div
                className={className}
                ref={nodeRef}
                style={{
                    transition: `width ${duration}ms, color ${duration}ms, background-color ${duration}ms, margin ${duration}ms ease`,
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