import {CSSTransition} from 'react-transition-group'
import {useRef, useState, useEffect, useCallback, memo} from 'react'

function Options({
  visibility,
  children,
  selectRef,
  onAnimationDone,
  unmount = true,
  duration,
  easing,
  offset,
  animateOpacity
}) {
  
  const nodeRef = useRef(null)
  const [selectHeight, setSelectHeight] = useState(0)

  useEffect(() => {
    if (!selectRef?.current) return
    const updateHeight = () => setSelectHeight(selectRef.current.offsetHeight)
    updateHeight()
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) setSelectHeight(entry.target.offsetHeight)
    })
    resizeObserver.observe(selectRef.current)
    return () => resizeObserver.disconnect()
  }, [selectRef])

  const transitionString = `height ${duration}ms ${easing}${animateOpacity ? `, opacity ${duration}ms ${easing}` : ''}`

  const baseStyles = {
      position: 'absolute',
      top: `calc(100% + ${offset}px)`, 
      left: '0',
      width: '100%',
      overflow: 'hidden',
      marginTop: '2px',
      zIndex: '1',
      height: visibility ? 'auto' : '0px',
      opacity: visibility ? 1 : 0,
      pointerEvents: visibility ? 'all' : 'none',
      visibility: selectHeight ? 'visible' : 'hidden'
  }

  const handleEnter = useCallback(() => {
    const el = nodeRef.current
    if (!el) return
    
    el.style.height = '0px'
    if (animateOpacity) el.style.opacity = '0'
    el.style.transition = ''
  }, [animateOpacity])

  const handleEntering = useCallback(() => {
    const el = nodeRef.current
    if (!el) return
    
    el.style.transition = transitionString
    el.style.height = `${el.scrollHeight}px`
    if (animateOpacity) el.style.opacity = '1'
  }, [transitionString, animateOpacity])

  const handleEntered = useCallback(() => {
    const el = nodeRef.current
    if (!el) return
    
    el.style.height = 'auto'
    el.style.transition = ''
    if (onAnimationDone) onAnimationDone()
  }, [onAnimationDone])

  const handleExit = useCallback(() => {
    const el = nodeRef.current
    if (!el) return
    
    el.style.height = `${el.scrollHeight}px`
    if (animateOpacity) el.style.opacity = '1'
    
    el.offsetHeight // force reflow
    el.style.transition = transitionString
  }, [transitionString, animateOpacity])

  const handleExiting = useCallback(() => {
    const el = nodeRef.current
    if (!el) return
    
    el.style.height = '0px'
    if (animateOpacity) el.style.opacity = '0'
  }, [animateOpacity])

  const handleExited = useCallback(() => {
    const el = nodeRef.current
    if (!el) return
    el.style.transition = ''
  }, [])

  return (
    <CSSTransition
      in={visibility}
      timeout={duration}
      classNames='rac-options'
      unmountOnExit={unmount}
      nodeRef={nodeRef}
      onEnter={handleEnter}
      onEntering={handleEntering}
      onEntered={handleEntered}
      onExit={handleExit}
      onExiting={handleExiting}
      onExited={handleExited}
    >
      <div
        ref={nodeRef}
        className='rac-options'
        style={baseStyles}
      >
        {children}
      </div>
    </CSSTransition>
  )
}

export default memo(Options, (prev, next) => {
  return prev.visibility === next.visibility &&
         prev.duration === next.duration &&
         prev.easing === next.easing &&
         prev.offset === next.offset &&
         prev.animateOpacity === next.animateOpacity &&
         prev.selectRef === next.selectRef &&
         prev.children === next.children
})