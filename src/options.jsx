import {CSSTransition} from 'react-transition-group'
import {useRef, useState, useEffect, useCallback, memo} from 'react'

function Options({visibility, children, duration = 300, selectRef, onAnimationDone}) {
  
  const nodeRef = useRef(null)

  const [selectHeight, setSelectHeight] = useState(0)

  useEffect(() => {
    if (selectRef?.current) {
      setSelectHeight(selectRef.current.offsetHeight)
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setSelectHeight(entry.target.offsetHeight)
      }
    })

    resizeObserver.observe(selectRef.current)
    setSelectHeight(selectRef.current.offsetHeight)

    return () => resizeObserver.disconnect()
  }, [selectRef])
  
  useEffect(() => {
    if (nodeRef.current) {
      nodeRef.current.style.top = `${selectHeight}px`
    }
  }, [selectHeight])

  const setInitialStyles = useCallback((element) => {
    element.style.position = 'absolute'
    element.style.top = `${selectHeight}px`
    element.style.left = '0'
    element.style.width = '100%'
    element.style.overflow = 'hidden'
    element.style.zIndex = '1'
  }, [selectHeight])

  const handleEnter = useCallback(() => {
    const el = nodeRef.current
    if (!el) return
    setInitialStyles(el)
    el.style.height = '0px'
    el.style.transition = ''
  }, [setInitialStyles])

  const handleEntering = useCallback(() => {
    const el = nodeRef.current
    if (!el) return
    el.style.transition = `height ${duration}ms ease`
    el.style.height = `${el.scrollHeight}px`
  }, [duration])

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
    el.style.transition = `height ${duration}ms ease`
  }, [duration])

  const handleExiting = useCallback(() => {
    const el = nodeRef.current
    if (!el) return
    el.style.height = '0px'
  }, [])

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
      unmountOnExit
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
      >
        {children}
      </div>
    </CSSTransition>
  )
}

export default memo(Options, (prev, next) => {
  return prev.visibility === next.visibility &&
         prev.duration === next.duration &&
         prev.selectRef === next.selectRef &&
         prev.children === next.children
})