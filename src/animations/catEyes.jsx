import {setStore, useStore} from '../components/store'
import {useRef, useEffect, lazy, Suspense} from 'react'
// player with lazy data
const lottieWith = loadData => {
    const load = () => Promise.all([import('lottie-react'), loadData()])
    const Player = lazy(() => load().then(([lottie, data]) => {
        const Lottie = lottie.default
        return {default: props => <Lottie animationData={data.default} {...props}/>}
    }))
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
const EVENTS = ['pointermove', 'pointerdown', 'mouseover', 'wheel', 'touchmove']

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function Eyes({status, pointer}) {
    const lottieRef = useRef(null)
    const motion = useRef({frame: 0, velocity: 0, drawn: -1})

    useEffect(() => {
        const m = motion.current
        const path = m.frame < (LEFT + RIGHT) / 2 ? [SUNK] : [CENTER, RISEN, SUNK]
        const timer = status === 'pointer' && setTimeout(() => setStore({cat: 'exit'}), 7000)
        let speed = Math.max(0, m.velocity * Math.sign(path[0] - m.frame))
        let last = performance.now()
        let raf

        const tick = now => {
            const dt = Math.min(now - last, 50) / 1000
            last = now

            if (status === 'show') m.frame = Math.min(m.frame + FPS * dt, RIGHT)

            if (status === 'pointer') {
                m.velocity += (STIFFNESS * (LEFT + (RIGHT - LEFT) * pointer.current - m.frame) - DAMPING * m.velocity) * dt
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
        <div className='rac-cat-eyes-container'>
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
    const pointer = useRef(0.5)

    useEffect(() => {
        const track = e => {pointer.current = clamp((e.touches?.[0] ?? e).clientX / window.innerWidth, 0, 1)}
        EVENTS.forEach(name => window.addEventListener(name, track, {passive: true}))
        return () => EVENTS.forEach(name => window.removeEventListener(name, track))
    }, [])

    // idle preload
    useEffect(() => {
        const timer = setTimeout(EyesLottie.preload, 4000)
        return () => clearTimeout(timer)
    }, [])

    return status === 'idle' ? null : <Eyes status={status} pointer={pointer}/>
}

export default CatEyes
