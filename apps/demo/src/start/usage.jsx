import {Zap, Star, Shield, ChevronUp, X, MousePointer2} from 'lucide-react'
import {CopyButton, CodeMorph} from '../components/code'
import {snippet} from '../components/tokens'
import {Segmented} from '../components/segmented'
import {Select, Option} from 'react-animated-select'
import {Title} from '../components/helpers'
import {Fragment, useState} from 'react'

// demo data
const plans = [{value: 'basic', label: 'Basic'}, {value: 'pro', label: 'Pro'}, {value: 'enterprise', label: 'Enterprise', disabled: true}]

const TABS = [{
    id: 'array',
    text: 'Array',
    code: snippet`import {Select} from 'react-animated-select'\nimport {useState} from 'react'\n\nconst plans = [\n  {value: 'basic', label: 'Basic'},\n  {value: 'pro', label: 'Pro'},\n  {value: 'enterprise', label: 'Enterprise', disabled: true}\n]\n\nfunction App() {\n  const [value, setValue] = useState()\n\n  return (\n    <Select\n      placeholder='Choose plan'\n      value={value}\n      onChange={setValue}\n      options={plans}\n    />\n  )\n}`
}, {
    id: 'jsx',
    text: 'JSX',
    code: snippet`import {Select, Option} from 'react-animated-select'\nimport {useState} from 'react'\nimport {Zap, Star, Shield} from 'lucide-react'\n\nfunction App() {\n  const [value, setValue] = useState()\n\n  return (\n    <Select\n      placeholder='Choose plan'\n      value={value}\n      onChange={setValue}\n    >\n      <Option value='basic'><Zap/>Basic</Option>\n      <Option value='pro'><Star/>Pro</Option>\n      <Option value='enterprise' disabled><Shield/>Enterprise</Option>\n    </Select>\n  )\n}`
}]

const ICONS = {arrow: ChevronUp, clear: X}

const CSS = `
.rac-start-usage {
  flex-direction: column;
  padding-top: 1em;
  display: flex;
  gap: 1em;
}

.rac-usage-stage {
  padding: 2em;
}
`

export default function Usage() {
    const [tab, setTab] = useState(0)
    const [value, setValue] = useState()
    const [busy, setBusy] = useState(false)
    const active = TABS[tab]

    const pick = i => {
        if (i === tab) return
        setTab(i)
        setValue()
    }

    return (
        <section className='rac-start-usage' id='usage'>
            <style href='rac-usage' precedence='low'>{CSS}</style>
            <div className='rac-code-title-container2'>
                <Title icon={<MousePointer2/>}>Usage</Title>
                <Segmented tabs id='usage' label='Options source' items={TABS} value={tab} onPick={pick} disabled={busy}/>
            </div>
            <p className='rac-code-desc'>Pass the options as an array or write them as <code>{'<Option/>'}</code> children: the rest of the code stays the same. JSX children can hold any content, such as icons. Note the value shape: an object from the array is reported as the whole object, an <code>{'<Option/>'}</code> as its <code>value</code>.</p>
            <div className='rac-panel rac-code-container' tabIndex={0}>
                <div className='rac-usage-stage'>
                    <Select
                        options={tab === 0 ? plans : undefined}
                        placeholder='Choose plan'
                        onChange={setValue}
                        icons={ICONS}
                        value={value}
                    >
                        {tab === 1 &&
                            <Fragment>
                                <Option value='basic'><Zap/>Basic</Option>
                                <Option value='pro'><Star/>Pro</Option>
                                <Option value='enterprise' disabled><Shield/>Enterprise</Option>
                            </Fragment>
                        }
                    </Select>
                </div>
                <div className='rac-code-wrapper' id='usage-panel' role='tabpanel' aria-labelledby={`usage-tab-${active.id}`}>
                    <CodeMorph code={active.code} onBusy={setBusy}/>
                    <CopyButton code={active.code.text}/>
                </div>
            </div>
        </section>
    )
}
