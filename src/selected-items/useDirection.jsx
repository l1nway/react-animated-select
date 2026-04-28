import {useLayoutEffect, useRef} from 'react'

export default function useDirection({visibility, selectRef, setBottomDirection}) {
  const lastHeightRef = useRef(250)

  useLayoutEffect(() => {
    if (!selectRef.current) return

    const tempEl = document.createElement('div')
    tempEl.className = 'rac-select-list'
    tempEl.style.visibility = 'hidden'
    tempEl.style.position = 'absolute'
    document.body.appendChild(tempEl)
    
    const computedMaxHeight = parseInt(window.getComputedStyle(tempEl).maxHeight)
    if (computedMaxHeight) lastHeightRef.current = computedMaxHeight
    
    document.body.removeChild(tempEl)

    const resizeOb = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const height = entry.borderBoxSize?.[0]?.blockSize || entry.contentRect.height
        if (height > 0) lastHeightRef.current = height
      }
    })

    const intersectOb = new IntersectionObserver((entries) => {
      if (visibility) return

      entries.forEach(entry => {
        const rect = entry.boundingClientRect
        const spaceBelow = window.innerHeight - rect.bottom
        setBottomDirection(spaceBelow < lastHeightRef.current)
      })
    }, {threshold: [0, 1]})

    intersectOb.observe(selectRef.current)
    
    return () => {
      intersectOb.disconnect()
      resizeOb.disconnect()
    }
  }, [selectRef, visibility, setBottomDirection])
}