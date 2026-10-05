import {useCallback, useEffect, useId, useRef, useState} from 'react'
import {ClipboardList, RotateCcw, Send, X} from 'lucide-react'
import {CopyButton, CodeBlock} from '../components/code'
import {Select} from 'react-animated-select'
import {Segmented} from '../components/segmented'
import {snippet} from '../components/tokens'
import {arrowIcons, CHIPS, Title} from '../components/helpers'
import '../components/button.css'
import './forms.css'

// demo data
const plans = ['Free', 'Pro', 'Team']
const topics = [{id: 'news', name: 'Product news'}, {id: 'tips', name: 'Tips'}, {id: 'events', name: 'Events'}, {id: 'jobs', name: 'Jobs'}]
const TABS = [{id: 'demo', text: 'Demo'}, {id: 'code', text: 'Code'}]
const desc = <>Give the Select a <code>name</code> and it submits with its <code>{'<form>'}</code> like a native select: real inputs hidden inside it carry the value, one field per value in multiple mode (read them with <code>FormData.getAll</code>), and objects are sent as JSON. <code>required</code> blocks the submit of an empty Select with the browser's own bubble, pointing at the Select, and marks it with <code>data-invalid</code> and <code>aria-invalid</code> until a pick. A reset button, <code>form.reset()</code>, a React 19 <code>{'<form action>'}</code> and <code>requestFormReset()</code> bring it back to its <code>defaultValue</code> or empty, through <code>onChange</code> when it is controlled. Submit the form below without a plan to see it, then reset it.</>

const CODE = snippet`<form onSubmit={e => {
  e.preventDefault()
  const data = new FormData(e.currentTarget)
  data.get('plan')      // 'Pro'
  data.getAll('topics') // ['{"id":"news","name":"Product news"}']
}}>
  <span id='plan-label'>Plan</span>
  <Select
    aria-labelledby='plan-label'
    name='plan'
    options={plans}
    required
  />
  <span id='topics-label'>Newsletters</span>
  <Select
    aria-labelledby='topics-label'
    name='topics'
    options={topics}
    plugins={[chips]}
    multiple
  />
  <button>Submit</button>
  <button type='reset'>Reset</button>
</form>`

function Forms() {
    const id = useId()
    const [out, setOut] = useState(null)
    const [tab, setTab] = useState(0)
    const [leaving, setLeaving] = useState(false)
    const [busy, setBusy] = useState(false)
    const [turns, setTurns] = useState(0)
    const seen = useRef(new Set())
    const timer = useRef(0)
    useEffect(() => () => clearTimeout(timer.current), [])
    const wipe = useCallback(() => {
        seen.current = new Set()
        setLeaving(false)
        setOut(null)
    }, [])
    const clear = useCallback(() => matchMedia('(prefers-reduced-motion: reduce)').matches ? wipe() : setLeaving(true), [wipe])
    const erased = useCallback(e => e.animationName === 'rac-forms-erase' && wipe(), [wipe])
    const reset = useCallback(() => {
        setTurns(t => t + 1)
        out && clear()
    }, [out, clear])
    const submit = useCallback(e => {
        e.preventDefault()
        setLeaving(false)
        let fresh = 0, end = 0
        const list = [...new FormData(e.currentTarget)].map(([key, value]) => {
            const id = `${key}=${value}`
            const isNew = !seen.current.has(id)
            const i = isNew ? fresh++ : 0
            if (isNew) end = Math.max(end, i * 300 + (value.length + 9) * 25)
            return {id, key, value, i}
        })
        seen.current = new Set(list.map(entry => entry.id))
        setOut(list)
        if (!end || matchMedia('(prefers-reduced-motion: reduce)').matches) return
        setBusy(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setBusy(false), end)
    }, [])

    return (
        <section className='rac-states' id='forms'>
            <div className='rac-code-title-container2'>
                <Title icon={<ClipboardList/>}>Native Forms</Title>
                <Segmented className='rac-forms-tabs' tabs id={id} label='Form demo view' items={TABS} value={tab} onPick={setTab}/>
            </div>
            <p className='rac-heading-desc'>{desc}</p>
            <div className='rac-split rac-forms-demo' id={`${id}-panel`} role='tabpanel' aria-labelledby={`${id}-tab-${TABS[tab].id}`} data-tab={TABS[tab].id}>
                <form className='rac-panel rac-forms-form' onSubmit={submit} onReset={reset}>
                    <div className='rac-forms-field'>
                        <span className='rac-forms-label' id={`${id}-plan`}>Plan</span>
                        <Select
                            aria-labelledby={`${id}-plan`}
                            placeholder='Choose a plan'
                            options={plans}
                            icons={arrowIcons}
                            name='plan'
                            required
                        />
                    </div>
                    <div className='rac-forms-field'>
                        <span className='rac-forms-label' id={`${id}-topics`}>Newsletters</span>
                        <Select
                            aria-labelledby={`${id}-topics`}
                            placeholder='Any number'
                            options={topics}
                            icons={arrowIcons}
                            name='topics'
                            plugins={CHIPS}
                            multiple
                        />
                    </div>
                    <div className='rac-forms-foot'>
                        <button className='rac-button rac-iconed' type='submit' disabled={busy}><Send aria-hidden='true'/> Submit</button>
                        <button className='rac-button rac-iconed' type='reset'><RotateCcw aria-hidden='true' className='rac-forms-spin' style={{'--turns': turns}}/> Reset</button>
                    </div>
                    <div className='rac-forms-result'>
                        {/* [DOC: forms-output] */}
                        <output className='rac-forms-output' form='' data-leaving={leaving || undefined} onAnimationEnd={erased}>
                            {out
                            ? out.map(({id, key, value, i}) =>
                                <span className='rac-forms-entry' key={id} style={{'--n': value.length, '--i': i}}>
                                    <b>{key}</b>
                                    <span>{value}</span>
                                </span>
                            )
                            : <span className='rac-forms-hint'>Submit to see the FormData entries.</span>}
                        </output>
                        {out && !leaving && <button className='rac-code-button' type='button' aria-label='Clear output' onClick={clear}><X aria-hidden='true' className='rac-safety-x'/></button>}
                    </div>
                </form>
                <label className='rac-panel rac-code-container rac-forms-code' tabIndex={0}>
                    <CodeBlock code={CODE}/>
                    <CopyButton code={CODE.text}/>
                </label>
            </div>
            <p className='rac-group-desc'>Also native: a cancelled reset changes nothing; inside <code>{'<fieldset disabled>'}</code> the Select is disabled like with <code>disabled</code> (the first <code>{'<legend>'}</code> excepted); <code>form='id'</code> joins a form from outside it, like <code>{'<select form>'}</code>; <code>texts.required</code> replaces the bubble text; the hidden inputs are <code>autoComplete='off'</code>. Limits: the Select resets one task after the native fields. Like native controls, an empty single Select sends one empty field, an empty multiple Select sends nothing, and a <code>disabled</code> Select is neither sent nor validated.</p>
        </section>
    )
}

export default Forms
