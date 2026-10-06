import {setStore, subscribe, useStore} from '../components/store'
import {useRef, useEffect, useState, lazy, Suspense} from 'react'
// [DOC: lottie-player]
const lottieWith = loadData => {
    let ready
    const load = () => Promise.all([import('lottie-react'), loadData()]).then(([lottie, data]) => {
        const Lottie = lottie.default
        return ready ??= {default: props => <Lottie animationData={data.default} {...props}/>}
    })
    const Lazy = lazy(load)
    const Player = props => {
        const [Comp] = useState(() => ready?.default ?? Lazy)
        return <Comp {...props}/>
    }
    return Object.assign(Player, {preload: load})
}

const EyesLottie = lottieWith(() => import('./cat-eyes.json'))
export const LoadingLottie = lottieWith(() => import('./cat-loading.json'))

// timeline frames
const FPS = 25
const LEFT = 35
const RIGHT = 62
const CENTER = 67
const RISEN = 24
const SUNK = 11
const STIFFNESS = 64
const DAMPING = 16
// [DOC: cat-eyes]
const COMP = {w: 1440, h: 2560, x: 709, y: 2428}
const LIFT = 24
const REACH = 0.3
const EVENTS =['pointermove', 'pointerdown', 'mouseover', 'wheel', 'touchmove']

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// gaze toward the pointer, each axis in -1..1
function gaze(svg, point) {
    if (!svg || point.x === null) return [0, 0]
    const box = svg.getBoundingClientRect()
    const scale = Math.min(box.width / COMP.w, box.height / COMP.h)
    const dx = point.x - box.left - box.width / 2 - (COMP.x - COMP.w / 2) * scale
    const dy = point.y - box.top - box.height / 2 - (COMP.y - COMP.h / 2) * scale
    const distance = Math.hypot(dx, dy) || 1
    const strength = Math.min(1, distance / (REACH * window.innerWidth))
    return [dx / distance * strength, dy / distance * strength]
}

function Eyes({status, pointer}) {
    const lottieRef = useRef(null)
    const boxRef = useRef(null)
    const motion = useRef({frame: 0, velocity: 0, drawn: -1, lift: 0, liftVelocity: 0, drawnLift: 0})

    useEffect(() => {
        const m = motion.current
        const path = m.frame < (LEFT + RIGHT) / 2 ? [SUNK] : [CENTER, RISEN, SUNK]
        const timer = status === 'pointer' && setTimeout(() => setStore({cat: 'exit'}), 7000)
        let speed = Math.max(0, m.velocity * Math.sign(path[0] - m.frame))
        let last = performance.now()
        const canLift = typeof CSS !== 'undefined' && CSS.supports('translate', '0 1px')
        let raf

        const tick = now => {
            const dt = Math.min(now - last, 50) / 1000
            last = now
            m.svg ||= boxRef.current?.querySelector('svg')
            if (m.svg && !m.pupils?.length) m.pupils = [...m.svg.querySelectorAll('.rac-cat-pupil')]
            const [gazeX, gazeY] = status === 'pointer' ? gaze(m.svg, pointer.current) : [0, 0]

            if (status === 'show') m.frame = Math.min(m.frame + FPS * dt, RIGHT)

            if (status === 'pointer') {
                m.velocity += (STIFFNESS * (LEFT + (RIGHT - LEFT) * (0.5 + gazeX / 2) - m.frame) - DAMPING * m.velocity) * dt
                m.frame += m.velocity * dt
                if (m.frame < LEFT || m.frame > RIGHT) {m.frame = clamp(m.frame, LEFT, RIGHT); m.velocity = 0}
            }

            if (status === 'exit') {
                speed = Math.min(FPS, speed + FPS * 4 * dt)
                const distance = path[0] - m.frame
                m.frame += Math.sign(distance) * Math.min(speed * dt, Math.abs(distance))
                // same pose jump
                if (m.frame === CENTER) {path.shift(); m.frame = path.shift()}
            }

            m.liftVelocity += (STIFFNESS * (gazeY * LIFT - m.lift) - DAMPING * m.liftVelocity) * dt
            m.lift += m.liftVelocity * dt

            // vertical gaze
            if (canLift && m.pupils?.length && Math.abs(m.lift - m.drawnLift) > 0.01) {
                m.pupils.forEach(pupil => {pupil.style.translate = `0 ${m.lift}px`})
                m.drawnLift = m.lift
            }

            // skip same frame
            if (lottieRef.current && Math.abs(m.frame - m.drawn) > 0.01) {
                lottieRef.current.goToAndStop(m.frame, true)
                m.drawn = m.frame
            }

            if (status === 'show' && m.frame === RIGHT) return setStore({cat: 'pointer'})
            if (status === 'exit' && m.frame === SUNK) return setStore({cat: 'idle'})
            raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)
        return () => {
            cancelAnimationFrame(raf)
            clearTimeout(timer)
        }
    }, [status, pointer])

    return (
        <div className='rac-cat-eyes-container' ref={boxRef}>
            <Suspense fallback={null}>
                <EyesLottie
                    className='rac-cat-eyes'
                    lottieRef={lottieRef}
                    autoplay={false}
                    loop={false}
                />
            </Suspense>
        </div>
    )
}

function CatEyes() {
    const status = useStore(state => state.cat)
    const pointer = useRef({x: null, y: 0})

    useEffect(() => {
        const track = e => {
            const point = e.touches?.[0] ?? e
            pointer.current.x = point.clientX
            pointer.current.y = point.clientY
        }
        EVENTS.forEach(name => window.addEventListener(name, track, {passive: true}))
        return () => EVENTS.forEach(name => window.removeEventListener(name, track))
    }, [])

    // [DOC: cat-preload]
    useEffect(() => {
        let near
        const watch = () => {
            const el = !near && document.getElementById('playground')
            if (!el) return
            near = new IntersectionObserver(([entry]) => {
                if (!entry.isIntersecting) return
                near.disconnect()
                EyesLottie.preload()
            }, {rootMargin: '150% 0px'})
            near.observe(el)
        }
        watch()
        const unsubscribe = subscribe(watch)
        return () => {
            unsubscribe()
            near?.disconnect()
        }
    }, [])

    return status === 'idle' ? null : <Eyes status={status} pointer={pointer}/>
}

export default CatEyes
