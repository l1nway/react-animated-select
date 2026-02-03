import {CSSTransition} from 'react-transition-group'
import {useRef, useState, useEffect, useCallback, memo, useLayoutEffect} from 'react'
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
  animateOpacity,
  style,
  className
}) {
  
  const nodeRef = useRef(null)
  const [selectHeight, setSelectHeight] = useState(0)

  const [coords, setCoords] = useState({top: 0, left: 0, width: 0})

  const coordsRef = useRef(coords)
  
  useEffect(() => {
    coordsRef.current = coords
  }, [coords])

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

  const transitionString = `height var(--rac-duration) ${easing}${animateOpacity ? `, opacity var(--rac-duration) ${easing}` : ''}`;

  useLayoutEffect(() => {
    if (!selectRef?.current) return
    
    const updateHeight = () => setSelectHeight(selectRef.current.offsetHeight)
    updateHeight()

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setSelectHeight(entry.target.offsetHeight)

        if (visibility && nodeRef.current && selectRef.current) {
            const rect = selectRef.current.getBoundingClientRect()
            const { isUpward } = coordsRef.current

            nodeRef.current.style.width = `${rect.width}px`
            nodeRef.current.style.left = `${rect.left}px`

            if (isUpward) {
                nodeRef.current.style.bottom = `${window.innerHeight - rect.top + offset}px`
            } else {
                nodeRef.current.style.top = `${rect.bottom + offset}px`
            }
        }
      }
    })

    resizeObserver.observe(selectRef.current)
    return () => resizeObserver.disconnect()
  }, [selectRef, visibility, offset])

  const baseStyles = {
    position: 'fixed',
    '--rac-duration': `${duration}ms`,
    '--rac-easing': easing,
    left: `${coords.left}px`,
    width: `${coords.width}px`,
    overflow: 'hidden',
    zIndex: '2147483647',
    height: visibility ? 'auto' : '0px',
    opacity: animateOpacity ? (visibility ? 1 : 0) : 1,
    pointerEvents: visibility ? 'all' : 'none',
    visibility: selectHeight ? 'visible' : 'hidden',
    boxSizing: 'border-box',
    transformOrigin: coords.isUpward ? 'bottom' : 'top',
    
    ...(coords.isUpward ? {
      bottom: `${window.innerHeight - coords.top + offset}px`,
      top: 'auto'
    } : {
      top: `${coords.bottom + offset}px`,
      bottom: 'auto'
    }),
    ...Object.fromEntries(
      Object.entries(style || {}).map(([key, value]) => [
        key.startsWith('--') ? key : `--rac-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`,
        value
      ])
    )
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
        className={`rac-options ${className || ''}`}
        style={{
            ...baseStyles,
            '--rac-duration': `${duration}ms`,
            '--rac-duration-fast': 'calc(var(--rac-duration) * 0.5)',
            '--rac-duration-base': 'var(--rac-duration)',
            '--rac-duration-slow': 'calc(var(--rac-duration) * 1.3)',

        }}
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
         prev.children === next.children &&
         JSON.stringify(prev.style) === JSON.stringify(next.style)
})