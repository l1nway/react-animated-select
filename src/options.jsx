import {CSSTransition} from 'react-transition-group'
import {useRef, useState, useEffect, useCallback, memo} from 'react'
import {createPortal} from 'react-dom'

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

  const [coords, setCoords] = useState({top: 0, left: 0, width: 0})

  const updateCoords = useCallback(() => {
    if (selectRef?.current) {
      const rect = selectRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      const dropdownHeight = nodeRef.current?.scrollHeight || 250
      
      const spaceBelow = windowHeight - rect.bottom
      const showUpward = spaceBelow < dropdownHeight && rect.top > spaceBelow

      setCoords({
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        isUpward: showUpward
      })
    }
  }, [selectRef])

  useEffect(() => {
    if (visibility) {
      updateCoords()
      
      window.addEventListener('scroll', updateCoords, true)
      window.addEventListener('resize', updateCoords)
      
      return () => {
        window.removeEventListener('scroll', updateCoords, true)
        window.removeEventListener('resize', updateCoords)
      }
    }
  }, [visibility, updateCoords])

  const transitionString = `height ${duration}ms ${easing}${animateOpacity ? `, opacity ${duration}ms ${easing}` : ''}`

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

  const baseStyles = {
    position: 'fixed',
    left: `${coords.left}px`,
    width: `${coords.width}px`,
    overflow: 'hidden',
    zIndex: '1000',
    height: visibility ? 'auto' : '0px',
    opacity: animateOpacity ? (visibility ? 1 : 0) : 1,
    pointerEvents: visibility ? 'all' : 'none',
    visibility: selectHeight ? 'visible' : 'hidden',
    boxSizing: 'border-box',
    '--rac-duration': `${duration}ms`,
    transformOrigin: coords.isUpward ? 'bottom' : 'top',
    
    ...(coords.isUpward ? {
      bottom: `${window.innerHeight - coords.top + offset}px`,
      top: 'auto'
    } : {
      top: `${coords.bottom + offset}px`,
      bottom: 'auto'
    })
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
    
    el.offsetHeight
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

  return createPortal(
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
        onMouseDown={(e) => {
          e.preventDefault()
        }}
      >
        {children}
      </div>
    </CSSTransition>, document.body
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