import {memo, useEffect, useReducer, useRef} from 'react'
import {Gauge, RotateCcw} from 'lucide-react'
import {merge, arrowIcons, Heading} from '../components/helpers'
import {Select} from 'react-animated-select'
import {Soon} from '../components/code'
import './performance.css'

// demo data
const ADJ = ['Amber', 'Arctic', 'Bold', 'Cedar', 'Coral', 'Crimson', 'Dusk', 'Ember', 'Frost', 'Golden', 'Granite', 'Harbor', 'Indigo', 'Ivory', 'Jade', 'Lunar', 'Maple', 'Misty', 'Nordic', 'Onyx']
const NOUN = ['Backpack', 'Blanket', 'Bottle', 'Candle', 'Chair', 'Desk lamp', 'Headphones', 'Jacket', 'Kettle', 'Keyboard', 'Mug', 'Notebook', 'Pillow', 'Planter', 'Rug', 'Scarf', 'Sneakers', 'Speaker', 'Sunglasses', 'Thermos', 'Toaster', 'Tote bag', 'Umbrella', 'Wallet', 'Watch']
const products = NOUN.flatMap(noun => ADJ.map(adj => `${adj} ${noun}`))
const desc = <>Hundreds of options or many Selects on one page stay fast. This list has {products.length} products; its rows are mounted only while it is open. Open it, hover the rows, pick one, use the arrows and type letters: the meter shows the slowest interaction of each kind, from the input to the next painted frame, as the browser itself measures it on this page (Event Timing API). The browser reports only interactions longer than 16 ms (one frame at 60 Hz), rounded to 8 ms, so a faster one shows as <code>{'< 16 ms'}</code>. For reference, Interaction to Next Paint counts up to 200 ms as good.</>

const KINDS = [
    {id: 'open', name: 'Open or close', note: `mounts or unmounts all ${products.length} rows`},
    {id: 'hover', name: 'Hover a row', note: 'two rows re-render'},
    {id: 'pick', name: 'Pick a row', note: 'value, title, close'},
    {id: 'key', name: 'Keyboard', note: 'arrows, typeahead, Enter'}
]

const REASONS = [
    {name: 'Split contexts.', desc: 'Config, stable actions and interaction state are three contexts, so a part re-renders only when what it reads changes.'},
    {name: 'Small external stores.', desc: 'The hover highlight, chip hover and swipe and the panel direction live in tiny stores read through selectors (useSyncExternalStore): hovering re-renders the two rows whose highlight changed, not the list.'},
    {name: 'Memo rows and chips.', desc: 'Options and chips are memo components whose props keep their identity between renders.'},
    {name: 'Literals stabilized by value.', desc: 'Inline options={[...]}, style={{...}} and JSX children are compared by value, so a parent re-render with equal props does not reach the list.'}
]

const VIRTUAL = `// planned API, not in 0.7.5
<Select
  options={products} // 10 000 rows
  virtual            // or virtual={200}: only from 200 rows
/>`

const EMPTY = {open: null, hover: null, pick: null, key: null}
const HOVER = new Set(['pointerover', 'pointerenter', 'mouseover', 'mouseenter'])
const PRESS = new Set(['click'])
const LISTEN = ['pointerover', 'click', 'keydown']

const classify = (type, node) => {
    const el = node?.nodeType === 1 ? node : node?.parentElement
    if (!el) return null
    const list = el.closest('.rac-perf-options')
    if (type.startsWith('key')) return (list || el.closest('.rac-perf-select')) && 'key'
    if (list) return HOVER.has(type) ? 'hover' : PRESS.has(type) ? 'pick' : null
    return PRESS.has(type) && el.closest('.rac-perf-select') ? 'open' : null
}

const show = ms => ms == null ? '—' : ms ? `${ms} ms` : '< 16 ms'
const level = ms => ms == null ? undefined : !ms ? 'fast' : ms <= 200 ? 'good' : 'slow'

const Meter = memo(function Meter() {
    const [state, dispatch] = useReducer(merge, {supported: null, ...EMPTY})
    const stats = useRef({...EMPTY})

    useEffect(() => {
        const off = () => dispatch({supported: false})
        if (!window.PerformanceObserver?.supportedEntryTypes?.includes('event')) return off()
        const record = (kind, ms) => {
            const prev = stats.current[kind]
            if (kind && (prev == null || ms > prev)) dispatch({[kind]: stats.current[kind] = ms})
        }
        const seen = e => record(classify(e.type, e.target), 0)
        const po = new PerformanceObserver(list => list.getEntries().forEach(entry => record(classify(entry.name, entry.target), Math.round(entry.duration))))
        try {
            po.observe({type: 'event', durationThreshold: 16})
        } catch {
            return off()
        }
        LISTEN.forEach(type => document.addEventListener(type, seen, {capture: true, passive: true}))
        dispatch({supported: true})
        return () => {
            po.disconnect()
            LISTEN.forEach(type => document.removeEventListener(type, seen, {capture: true}))
        }
    }, [])

    const reset = () => {
        stats.current = {...EMPTY}
        dispatch(EMPTY)
    }

    return (
        <div className='rac-perf-meter'>
            <div className='rac-perf-head'>
                <h4 className='rac-perf-title'>Slowest interaction, until the next paint</h4>
                <button className='rac-perf-reset' onClick={reset} disabled={!state.supported} aria-label='Reset the meter' type='button'>
                    <RotateCcw aria-hidden='true'/>
                </button>
            </div>
            {state.supported === false
                ? <p className='rac-perf-off'>This browser does not expose the Event Timing API, so the meter is off. The list works the same.</p>
                : <dl className='rac-perf-rows'>
                    {KINDS.map(kind =>
                        <div className='rac-perf-row' key={kind.id}>
                            <dt>{kind.name}<small>{kind.note}</small></dt>
                            <dd data-level={level(state[kind.id])}>{show(state[kind.id])}</dd>
                        </div>
                    )}
                </dl>
            }
        </div>
    )
})

function Performance() {
    return (
        <section className='rac-states' id='performance'>
            <Heading icon={<Gauge/>} title='Performance' desc={desc}/>
            <div className='rac-perf-demo'>
                <Select
                    optionsClassName='rac-perf-options'
                    className='rac-perf-select'
                    aria-label={`Product, ${products.length} options`}
                    placeholder='Choose a product'
                    options={products}
                    icons={arrowIcons}
                />
                <Meter/>
            </div>
            <ul className='rac-perf-reasons'>
                {REASONS.map(item =>
                    <li key={item.name}><b>{item.name}</b> {item.desc}</li>
                )}
            </ul>
            <p className='rac-group-desc'>Next: virtualization. Today every row is mounted while the list is open, which is why opening is the slowest step above. A <code>virtual</code> prop (<code>false</code>, <code>true</code> or a row count) will mount only the rows in view plus an overscan, between two spacers, so your CSS keeps working. Variable heights (JSX options, wrapped text, group headers) are measured and cached, the highlighted row stays mounted for <code>aria-activedescendant</code>, and rows get <code>aria-setsize</code> / <code>aria-posinset</code>. The target is 10 000 rows.</p>
            <Soon title='virtualized option list' code={VIRTUAL}/>
        </section>
    )
}

export default Performance
