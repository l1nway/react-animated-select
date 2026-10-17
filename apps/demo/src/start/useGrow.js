import {useLayoutEffect, useRef} from 'react'

const REDUCE = '(prefers-reduced-motion: reduce)'
const EASE = 'cubic-bezier(0, 0.55, 0.45, 1)'
const BASE = 260
const CAP = 420
const MIN = 80
const PER_PX = 0.5

// [DOC: textarea-grow]
function fit(ta, box, s, instant) {
  const from = box.getBoundingClientRect().height
  const chasing = s.anim?.playState === 'running'
  ta.style.height = 'auto'
  ta.style.overflowY = 'hidden'
  const full = ta.scrollHeight + ta.offsetHeight - ta.clientHeight
  ta.style.height = `${full}px`
  const to = ta.offsetHeight
  ta.style.overflowY = ''
  ta.toggleAttribute('data-scroll', full > to + 1)
  if (to === s.to) return
  s.to = to
  s.anim?.cancel()
  s.anim = null
  const dist = Math.abs(to - from)
  if (instant || dist < 1 || matchMedia(REDUCE).matches) return
  const now = performance.now()
  const calm = Math.min(CAP, BASE + dist * PER_PX)
  const duration = chasing ? Math.min(calm, Math.max(MIN, now - s.at)) : calm
  s.at = now
  s.anim = box.animate({height: [`${from}px`, `${to}px`]}, {duration, easing: chasing ? 'linear' : EASE})
}

export default function useGrow(textareaRef, value) {
  const boxRef = useRef(null)
  const state = useRef({anim: null, to: 0, at: 0, width: 0, ready: false})

  useLayoutEffect(() => {
    const s = state.current
    fit(textareaRef.current, boxRef.current, s, !s.ready)
    s.ready = true
  }, [textareaRef, value])

  useLayoutEffect(() => {
    const s = state.current
    const observer = new ResizeObserver(([entry]) => {
      const {width} = entry.contentRect
      if (s.width && Math.abs(width - s.width) > 0.5) fit(textareaRef.current, boxRef.current, s, true)
      s.width = width
    })
    observer.observe(boxRef.current)
    return () => {
      observer.disconnect()
      s.anim?.cancel()
    }
  }, [textareaRef])

  return boxRef
}
