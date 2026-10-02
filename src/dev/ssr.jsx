import {memo, useCallback, useEffect, useRef, useState} from 'react'
import {Server, RotateCcw} from 'lucide-react'
import {AnimatePresence, m} from 'framer-motion'
import {Select} from 'react-animated-select'
import {Title, popSlow} from '../components/helpers'
import {Spinner} from '../components/icons'
import {Motion} from '../components/motion'
import '../components/button.css'
import './ssr.css'

// demo data
const plans = ['Basic', 'Pro', 'Enterprise']
const STEPS = [['HTML arrives', 800], ['JS loaded', 3000], ['Hydrated', 4500]]
const TOTAL = 6000
const DONE = STEPS.length + 1
const LANES = [
    ['Client rendering', 2, 2, ['Nothing yet', 'Empty page: JS is downloading', 'Rendered and interactive', 'Rendered and interactive']],
    ['Server rendering', 1, 3, ['Nothing yet', 'Static HTML: visible, not interactive', 'Static HTML: JS loaded, hydrating', 'Hydrated: interactive']]
]

const fade = {initial: {opacity: 0}, animate: {opacity: 1}, exit: {opacity: 0}, transition: {duration: 0.4, ease: 'linear'}}
const longest = labels => labels.reduce((a, b) => b.length > a.length ? b : a)
const tone = (i, shown, live) => i < shown ? 'none' : i < live ? 'static' : 'live'

// [DOC: ssr-timeline]
const Lane = memo(function Lane({title, shown, live, labels, phase, run}) {
    const i = Math.min(phase, labels.length - 1)
    return (
        <div className='rac-ssr-lane' data-shown={phase >= shown} data-live={phase >= live}>
            <b>{title}</b>
            <div className='rac-ssr-slot'>
                <div key={run} inert={phase < live}><Select aria-label={title} options={plans} defaultValue='Pro'/></div>
            </div>
            <span className='rac-ssr-badge'>
                <span className='rac-ssr-ghost' aria-hidden='true'>{longest(labels)}</span>
                <AnimatePresence initial={false}>
                    <m.span key={labels[i]} data-tone={tone(i, shown, live)} {...fade}>{labels[i]}</m.span>
                </AnimatePresence>
            </span>
        </div>
    )
})

function Ssr() {
    const [phase, setPhase] = useState(0)
    const [run, setRun] = useState(0)
    const [seen, setSeen] = useState(false)
    const root = useRef(null)
    const busy = phase < DONE
    const Icon = busy ? Spinner : RotateCcw
    const replay = useCallback(() => {
        setPhase(0)
        setRun(n => n + 1)
    }, [])

    useEffect(() => {
        const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setSeen(true))
        io.observe(root.current)
        return () => io.disconnect()
    }, [])

    useEffect(() => {
        if (!seen) return
        const still = matchMedia('(prefers-reduced-motion: reduce)').matches
        const steps = still ? [[DONE, 0]] : [...STEPS.map(([, at], i) => [i + 1, at]), [DONE, TOTAL]]
        const timers = steps.map(([next, at]) => setTimeout(() => setPhase(next), at))
        return () => timers.forEach(clearTimeout)
    }, [seen, run])

    return (
        <Motion>
            <section className='rac-states' id='ssr' ref={root}>
                <div className='rac-code-title-container2 rac-ssr-head'>
                    <Title icon={<Server/>}>Server Rendering</Title>
                    <button className='rac-button' type='button' onClick={busy ? undefined : replay} aria-disabled={busy}>
                        <AnimatePresence mode='wait' initial={false}>
                            <m.span className='rac-button-icon' key={busy ? 'busy' : 'idle'} aria-hidden='true' {...popSlow}><Icon/></m.span>
                        </AnimatePresence>
                        Replay
                    </button>
                </div>
                <p className='rac-ssr-desc'>The Select renders to HTML in Next.js, Remix or renderToString and hydrates without a mismatch. The server HTML already shows the right title, chips and enabled state, for an options array and for {'<Option/>'} children alike, so nothing switches after hydration. DOM ids and ARIA references are deterministic, the same on the server and the client. Both bundles start with 'use client', so a Next.js App Router server component can import and render the Select directly.</p>
                <div className='rac-ssr-demo'>
                    <div className='rac-ssr-lanes'>
                        {LANES.map(([title, shown, live, labels]) => <Lane key={title} title={title} shown={shown} live={live} labels={labels} phase={phase} run={run}/>)}
                    </div>
                    <div className='rac-ssr-timeline' aria-hidden='true'>
                        <i key={run} style={{'--total': `${TOTAL}ms`}} data-play={seen}/>
                        {STEPS.map(([label, at], i) => <span key={label} data-passed={phase > i} style={{left: `${at / TOTAL * 100}%`}}>{label}</span>)}
                    </div>
                    <p className='rac-ssr-note'>Illustrative timing, not a measurement. Try the selects while it plays: the server one ignores you until it is hydrated.</p>
                </div>
            </section>
        </Motion>
    )
}

export default Ssr
