import {useEffectEvent, useLayoutEffect, useRef, useState} from 'react'

// [DOC: slidedown]
const AXIS = ['height', 'marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth']
const STILL = {overflow: 'hidden', minHeight: '0px', maxHeight: 'none'}
const CLOSED = {...Object.fromEntries(AXIS.map(p => [p, '0px'])), ...STILL}

// [DOC: slidedown]
const measure = el => {
    el.style.overflow = 'hidden'
    const computed = getComputedStyle(el)
    const frame = {...Object.fromEntries(AXIS.map(p => [p, computed[p]])), ...STILL}
    el.style.overflow = ''
    return frame
}

function SlideDown({visibility, children, duration = 300, easing = 'ease', ...props}) {
    const ref = useRef(null)
    const anim = useRef(null)
    const last = useRef(visibility)
    const [gone, setGone] = useState(!visibility)
    const [kept, keep] = useState(children)
    if (visibility && gone) setGone(false)
    // frozen while leaving
    if (visibility && kept !== children) keep(children)

    const finish = useEffectEvent(animation => {
        if (anim.current !== animation) return
        anim.current = null
        if (visibility) animation.cancel()
        else setGone(true)
    })

    useLayoutEffect(() => {
        const el = ref.current
        if (!el || last.current === visibility) return
        last.current = visibility
        const running = anim.current
        // interrupted: reverse in place
        if (running?.playState === 'running') return running.reverse()
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
        const frames = visibility ? [CLOSED, measure(el)] : [measure(el), CLOSED]
        const animation = anim.current = el.animate(frames, {duration: reduced ? 0 : duration, easing, fill: 'both'})
        animation.onfinish = () => finish(animation)
    }, [visibility, duration, easing])

    if (gone) return null
    return <div ref={ref} tabIndex={-1} {...props}>{visibility ? children : kept}</div>
}

export default SlideDown
