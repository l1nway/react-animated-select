import {useState} from 'react'
import {CodeMorph, CopyButton} from '../components/code'
import {Segmented} from '../components/segmented'
import {Tick} from '../components/section'
import './showcase.css'

export function Toggle({name, note, checked, onChange}) {
    return (
        <label className='rac-showcase-toggle'>
            <Tick checked={checked} onChange={e => onChange(name, e.target.checked)}/>
            <code className='rac-showcase-name'>{name}</code>
            {note && <span className='rac-showcase-note'>{note}</span>}
        </label>
    )
}

// [DOC: showcase]
export function Showcase({id, label, tabs, active, onPick, codes, title, desc, children}) {
    const [busy, setBusy] = useState(false)
    const switcher = <Segmented className='rac-showcase-tabs' tabs id={id} label={label} items={tabs} value={active} onPick={onPick} disabled={busy}/>
    return (
        <div className='rac-showcase' data-head={!!title || undefined}>
            {title ? <div className='rac-code-title-container2 rac-showcase-head'>{title}{switcher}</div> : switcher}
            {desc && <p className='rac-heading-desc'>{desc}</p>}
            <div className='rac-panel rac-code-container' id={`${id}-panel`} role='tabpanel' aria-labelledby={`${id}-tab-${tabs[active].id}`}>
                {children}
                {codes.map((code, i) =>
                    <div className='rac-code-wrapper rac-showcase-code' key={i}>
                        <CodeMorph code={code} onBusy={setBusy}/>
                        <CopyButton code={code.text}/>
                    </div>
                )}
            </div>
        </div>
    )
}
