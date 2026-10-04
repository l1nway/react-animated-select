import {useEffect, useRef} from 'react'
import './track.css'

const PULL = 40
const STIFF = 0.0005
const DAMP = 0.033

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const rubber = d => PULL * (1 - 1 / (d / PULL + 1))

// [DOC: track]
export function Track({label, className, children}) {
    const ref = useRef(null)
    const stop = useRef(() => {})

    useEffect(() => {
        const el = ref.current
        const fit = () => {
            const over = el.scrollWidth > el.clientWidth
            el.toggleAttribute('data-drag', over)
            over ? el.setAttribute('tabindex', '0') : el.removeAttribute('tabindex')
        }
        const edge = entries => entries.forEach(({target, intersectionRatio}) =>
            el.toggleAttribute(target === el.firstElementChild ? 'data-start' : 'data-end', intersectionRatio < 0.99))
        const ro = new ResizeObserver(fit)
        const io = new IntersectionObserver(edge, {root: el, threshold: 0.99})
        ro.observe(el)
        io.observe(el.firstElementChild)
        io.observe(el.lastElementChild)
        return () => {ro.disconnect(); io.disconnect(); stop.current()}
    }, [])

    const grab = e => {
        const el = ref.current
        if (e.pointerType !== 'mouse' || e.button || !el.hasAttribute('data-drag')) return
        stop.current()
        const card = e.target.closest('.rac-track > *')
        const ac = new AbortController()
        const max = el.scrollWidth - el.clientWidth
        const from = el.scrollLeft
        let x = e.clientX, t = e.timeStamp, v = 0, pos = from, raf = 0, prev = 0
        const set = p => {pos = Math.min(max, Math.max(0, p)); el.scrollLeft = pos}
        const pull = d => {
            const r = rubber(Math.abs(d))
            el.style.setProperty('--rac-track-pull', `${-Math.sign(d) * r}px`)
            el.style.setProperty('--rac-track-s', r / PULL)
        }
        let origin = e.clientX
        const move = m => {
            if (!el.hasAttribute('data-dragging')) {
                if (Math.abs(m.clientX - e.clientX) < 4) return
                origin = m.clientX
                x = m.clientX
                t = m.timeStamp
                el.setAttribute('data-dragging', '')
                getSelection().removeAllRanges()
            }
            const p = from + origin - m.clientX
            set(p)
            pull(p - pos)
            const dt = m.timeStamp - t
            if (dt < 8) return
            v = 0.8 * (x - m.clientX) / dt + 0.2 * v
            x = m.clientX
            t = m.timeStamp
        }
        let hit = null, o = 0
        // [DOC: track-impact]
        const bounce = now => {
            const dt = Math.min(now - prev, 32)
            prev = now
            v += (-STIFF * o - DAMP * v) * dt
            o += v * dt
            if (Math.abs(o) < 0.3 && Math.abs(v) < 0.01) return release()
            pull(o)
            raf = requestAnimationFrame(bounce)
        }
        const glide = now => {
            const dt = prev ? now - prev : 16
            prev = now
            v *= 0.95 ** (dt / 16)
            const inside = pos > 0 && pos < max
            set(pos + v * dt)
            if (pos > 0 && pos < max) return raf = Math.abs(v) > 0.02 ? requestAnimationFrame(glide) : 0
            if (!inside || Math.abs(v) < 0.05) return raf = 0
            hit = v > 0 ? el.lastElementChild : el.firstElementChild
            hit.setAttribute('data-hit', v > 0 ? 'end' : 'start')
            el.setAttribute('data-bounce', '')
            raf = requestAnimationFrame(bounce)
        }
        const release = () => {
            ac.abort()
            card?.removeAttribute('data-grabbed')
            hit?.removeAttribute('data-hit')
            el.removeAttribute('data-dragging')
            el.removeAttribute('data-bounce')
            el.style.removeProperty('--rac-track-pull')
            el.style.removeProperty('--rac-track-s')
        }
        const up = u => {
            const flick = el.hasAttribute('data-dragging') && u.timeStamp - t < 80
            release()
            if (flick && !reduced()) raf = requestAnimationFrame(glide)
        }
        stop.current = () => {release(); cancelAnimationFrame(raf)}
        card?.setAttribute('data-grabbed', '')
        Object.entries({pointermove: move, pointerup: up, pointercancel: up}).forEach(([type, fn]) => window.addEventListener(type, fn, {signal: ac.signal}))
    }

    return (
        <div className={className ? `rac-track ${className}` : 'rac-track'} ref={ref} role='region' aria-label={label} onPointerDown={grab} onWheel={() => stop.current()}>
            {children}
        </div>
    )
}

export const Card = ({icon, title, desc, className, children}) => (
    <div className={className ? `rac-track-card ${className}` : 'rac-track-card'}>
        <div className='rac-track-head'>
            <div className='rac-track-icon'>{icon}</div>
            <h3 className='rac-code-title'>{title}</h3>
        </div>
        {desc && <p className='rac-track-desc rac-desc'>{desc}</p>}
        {children}
    </div>
)
