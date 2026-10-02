import {useCallback, useEffect, useId, useRef, useState} from 'react'
import {ClipboardList, Send, X} from 'lucide-react'
import {CopyButton, CodeBlock} from '../components/code'
import {Select} from 'react-animated-select'
import {Segmented} from '../components/segmented'
import {snippet} from '../components/tokens'
import {arrowIcons, Title} from '../components/helpers'
import '../components/button.css'
import './forms.css'

// demo data
const plans = ['Free', 'Pro', 'Team']
const topics = [{id: 'news', name: 'Product news'}, {id: 'tips', name: 'Tips'}, {id: 'events', name: 'Events'}, {id: 'jobs', name: 'Jobs'}]
const TABS = [{id: 'demo', text: 'Demo'}, {id: 'code', text: 'Code'}]
const desc = <>Give the Select a <code>name</code> and it submits with its <code>{'<form>'}</code> like a native select: real inputs hidden inside it carry the value, one field per value in multiple mode (read them with <code>FormData.getAll</code>), and objects are sent as JSON. <code>required</code> blocks the submit of an empty Select with the browser's own bubble, pointing at the Select. Submit the form below without a plan to see it.</>

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
    multiple
  />
  <button>Submit</button>
</form>`

function Forms() {
    const id = useId()
    const [out, setOut] = useState(null)
    const [tab, setTab] = useState(0)
    const [leaving, setLeaving] = useState(false)
    const [busy, setBusy] = useState(false)
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
            <div className='rac-forms-demo' id={`${id}-panel`} role='tabpanel' aria-labelledby={`${id}-tab-${TABS[tab].id}`} data-tab={TABS[tab].id}>
                <form className='rac-forms-form' onSubmit={submit}>
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
                            multiple
                        />
                    </div>
                    <div className='rac-forms-foot'>
                        <button className='rac-button' type='submit' disabled={busy}>
                            <Send aria-hidden='true'/> Submit
                        </button>
                    </div>
                    <div className='rac-forms-result'>
                        <output className='rac-forms-output' data-leaving={leaving || undefined} onAnimationEnd={erased}>
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
                <label className='rac-code-container rac-forms-code' tabIndex={0}>
                    <CodeBlock code={CODE}/>
                    <CopyButton code={CODE.text}/>
                </label>
            </div>
            <p className='rac-group-desc'>Limits: <code>form.reset()</code> does not reset the Select (a <code>defaultValue</code> is not restored), so a reset button has to clear a controlled <code>value</code> itself. Like native controls, an empty single Select sends one empty field, an empty multiple Select sends nothing, and a <code>disabled</code> Select is neither sent nor validated.</p>
        </section>
    )
}

export default Forms
