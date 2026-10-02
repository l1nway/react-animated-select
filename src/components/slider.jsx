import {useEffect, useRef, useState} from 'react'
import './slider.css'

const OVERDRAG = 16
const STIFFNESS = 320
const DAMPING = 18
const SETTLE_POS = 0.05
const SETTLE_VEL = 0.4

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
    const visualRef = useRef({percent: 0, scale: 1, stretch: 0})
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

    const applyThumb = (percent, scale, stretchRatio) => {
        const squashX = 1 + stretchRatio * 0.25
        const squashY = 1 - stretchRatio * 0.175
        thumbRef.current.style.left = `${percent}%`
        thumbRef.current.style.transform = `translate(-50%, -50%) scale(${scale}) scaleX(${squashX}) scaleY(${squashY})`
    }

    const resetThumb = () => {
        thumbRef.current.style.left = ''
        thumbRef.current.style.transform = ''
    }

    const pointAt = clientX => {
        const rect = rectRef.current
        const rawPercent = (clientX - rect.left) / rect.width * 100
        const clampedPercent = clamp(rawPercent, 0, 100)
        const overflow = rawPercent - clampedPercent
        const stretch = Math.sign(overflow) * rubber(Math.abs(overflow), OVERDRAG)
        return {
            clampedPercent,
            visualPercent: clampedPercent + stretch,
            stretchRatio: Math.abs(stretch) / OVERDRAG,
        }
    }

    const render = () => {
        const {percent, scale, stretch} = visualRef.current
        applyThumb(percent, scale, stretch)
    }

    const grow = () => {
        let last = performance.now()
        const tick = now => {
            const dt = Math.min((now - last) / 1000, 0.032)
            last = now
            const v = visualRef.current
            v.scale += (1.3 - v.scale) * Math.min(1, dt * 20)
            render()
            if (Math.abs(v.scale - 1.3) < 0.01) {
                v.scale = 1.3
                render()
                rafRef.current = null
                return
            }
            rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
    }

    const settle = (startPercent, startVelocity, startScale, startStretch, targetPercent) => {
        let pos = startPercent
        let vel = startVelocity
        let scale = startScale
        let stretch = startStretch
        let last = performance.now()
        setSettling(true)

        const tick = now => {
            const dt = Math.min((now - last) / 1000, 0.032)
            last = now
            const accel = -STIFFNESS * (pos - targetPercent) - DAMPING * vel
            vel += accel * dt
            pos += vel * dt
            scale += (1 - scale) * Math.min(1, dt * 10)
            stretch += (0 - stretch) * Math.min(1, dt * 10)
            visualRef.current = {percent: pos, scale, stretch}

            const done = Math.abs(pos - targetPercent) < SETTLE_POS && Math.abs(vel) < SETTLE_VEL
                && Math.abs(scale - 1) < 0.01 && stretch < 0.01
            if (done) {
                visualRef.current = {percent: targetPercent, scale: 1, stretch: 0}
                resetThumb()
                setSettling(false)
                rafRef.current = null
                return
            }
            applyThumb(pos, scale, stretch)
            rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
    }

    const down = e => {
        e.preventDefault()
        stop()
        thumbRef.current.focus()
        rectRef.current = trackRef.current.getBoundingClientRect()
        setInteracting(true)
        setSettling(false)

        const move = clientX => {
            const {clampedPercent, visualPercent, stretchRatio} = pointAt(clientX)
            const next = clamp(snap(min + clampedPercent / 100 * (max - min), step, min), min, max)
            onChange(next)
            visualRef.current.percent = visualPercent
            visualRef.current.stretch = stretchRatio
            render()
            const now = performance.now()
            lastRef.current = {prev: lastRef.current?.curr, curr: {percent: visualPercent, t: now, stretchRatio}}
        }
        move(e.clientX)
        grow()

        const controller = new AbortController()
        abortRef.current = controller
        const {signal} = controller
        document.addEventListener('pointermove', e => move(e.clientX), {signal})
        document.addEventListener('pointerup', e => {
            controller.abort()
            setInteracting(false)
            stop()
            const {clampedPercent} = pointAt(e.clientX)
            const target = percentOf(clamp(snap(min + clampedPercent / 100 * (max - min), step, min), min, max), min, max)
            const {prev, curr} = lastRef.current ?? {}
            const velocity = prev && curr && curr.t > prev.t
                ? (curr.percent - prev.percent) / (curr.t - prev.t) * 1000
                : 0
            settle(curr?.percent ?? target, velocity, visualRef.current.scale, curr?.stretchRatio ?? 0, target)
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
