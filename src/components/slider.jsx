import {useEffect, useRef, useState} from 'react'
import './slider.css'

const PULL = 15
const STIFFNESS = 320
const DAMPING = 18
const SETTLE_POS = 0.1
const SETTLE_VEL = 1

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const snap = (v, step, min) => Math.round((v - min) / step) * step + min
const rubber = (d, max) => max * (1 - 1 / (d / max + 1))

const percentOf = (value, min, max) => (value - min) / (max - min) * 100

const Slider = ({value, min = 0, max = 100, step = 1, onChange, ...props}) => {
    const trackRef = useRef(null)
    const thumbRef = useRef(null)
    const abortRef = useRef(null)
    const rectRef = useRef(null)
    const rafRef = useRef(null)
    const lastRef = useRef(null)
    const visualRef = useRef({x: 0, y: 0, scale: 1})
    const [interacting, setInteracting] = useState(false)
    const [settling, setSettling] = useState(false)
    const progress = percentOf(value, min, max)

    const stop = () => {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
    }

    useEffect(() => () => {
        abortRef.current?.abort()
        stop()
    }, [])

    // [DOC: slider-2d-stretch]
    const render = () => {
        const {x, y, scale} = visualRef.current
        const ox = x - clamp(x, 0, rectRef.current.width)
        const len = Math.hypot(ox, y)
        const s = Math.min(1, len / PULL)
        const c = len ? ox / len : 1, n = len ? y / len : 0
        const a = scale * (1 + s * 0.25), b = scale * (1 - s * 0.175)
        const k = (a - b) * c * n
        thumbRef.current.style.transform = `translate(-50%, -50%) matrix(${a * c * c + b * n * n}, ${k}, ${k}, ${a * n * n + b * c * c}, ${x}, ${y})`
    }

    const resetThumb = () => {
        thumbRef.current.style.left = ''
        thumbRef.current.style.transform = ''
    }

    const pointAt = (clientX, clientY) => {
        const {left, width, startY} = rectRef.current
        const raw = clientX - left
        const clamped = clamp(raw, 0, width)
        const dx = raw - clamped, dy = clientY - startY
        const len = Math.hypot(dx, dy)
        const f = len ? rubber(len, PULL) / len : 0
        return {percent: clamped / width * 100, x: clamped + dx * f, y: dy * f}
    }

    const valueAt = percent => clamp(snap(min + percent / 100 * (max - min), step, min), min, max)

    const grow = () => {
        let last = performance.now()
        const tick = now => {
            const dt = Math.min((now - last) / 1000, 0.032)
            last = now
            const v = visualRef.current
            v.scale += (1.3 - v.scale) * Math.min(1, dt * 20)
            if (Math.abs(v.scale - 1.3) < 0.01) {
                v.scale = 1.3
                render()
                rafRef.current = null
                return
            }
            render()
            rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
    }

    const settle = (vx, vy, tx) => {
        const v = visualRef.current
        let last = performance.now()
        setSettling(true)

        const tick = now => {
            const dt = Math.min((now - last) / 1000, 0.032)
            last = now
            vx += (-STIFFNESS * (v.x - tx) - DAMPING * vx) * dt
            vy += (-STIFFNESS * v.y - DAMPING * vy) * dt
            v.x += vx * dt
            v.y += vy * dt
            v.scale += (1 - v.scale) * Math.min(1, dt * 10)

            const done = Math.abs(v.x - tx) < SETTLE_POS && Math.abs(v.y) < SETTLE_POS
                && Math.abs(vx) < SETTLE_VEL && Math.abs(vy) < SETTLE_VEL && Math.abs(v.scale - 1) < 0.01
            if (done) {
                visualRef.current = {x: tx, y: 0, scale: 1}
                resetThumb()
                setSettling(false)
                rafRef.current = null
                return
            }
            render()
            rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
    }

    const down = e => {
        e.preventDefault()
        stop()
        thumbRef.current.focus()
        const {left, width} = trackRef.current.getBoundingClientRect()
        rectRef.current = {left, width, startY: e.clientY}
        thumbRef.current.style.left = '0'
        lastRef.current = null
        setInteracting(true)
        setSettling(false)

        const move = (clientX, clientY) => {
            const {percent, x, y} = pointAt(clientX, clientY)
            onChange(valueAt(percent))
            Object.assign(visualRef.current, {x, y})
            render()
            lastRef.current = {prev: lastRef.current?.curr, curr: {x, y, t: performance.now()}}
        }
        move(e.clientX, e.clientY)
        grow()

        const controller = new AbortController()
        abortRef.current = controller
        const {signal} = controller
        document.addEventListener('pointermove', e => move(e.clientX, e.clientY), {signal})
        document.addEventListener('pointerup', e => {
            controller.abort()
            setInteracting(false)
            stop()
            const target = percentOf(valueAt(pointAt(e.clientX, e.clientY).percent), min, max) / 100 * width
            const {prev, curr} = lastRef.current ?? {}
            const dt = prev && curr && curr.t > prev.t ? (curr.t - prev.t) / 1000 : 0
            settle(dt && (curr.x - prev.x) / dt, dt && (curr.y - prev.y) / dt, target)
        }, {signal})
    }

    const key = e => {
        const big = e.shiftKey ? step * 10 : step
        const deltas = {ArrowRight: big, ArrowUp: big, ArrowLeft: -big, ArrowDown: -big}
        if (e.key in deltas) {
            e.preventDefault()
            onChange(clamp(value + deltas[e.key], min, max))
        } else if (e.key === 'Home') {
            e.preventDefault()
            onChange(min)
        } else if (e.key === 'End') {
            e.preventDefault()
            onChange(max)
        }
    }

    return (
        <div className='slider-container' data-dragging={interacting || undefined} data-settling={settling || undefined} style={{'--progress': `${progress}%`}}>
            <div className='slider-track' ref={trackRef} onPointerDown={down}>
                <div className='slider-fill'/>
                <div className='slider-thumb' ref={thumbRef} role='slider' tabIndex={0} onKeyDown={key} {...props} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value}/>
            </div>
        </div>
    )
}

export default Slider
