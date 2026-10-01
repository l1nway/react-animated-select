import {Zap, Star, Shield, ChevronUp, X, MousePointer2} from 'lucide-react'
import {CopyButton, CodeMorph} from '../components/code'
import {snippet} from '../components/tokens'
import {Select, Option} from 'react-animated-select'
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

const CODES = TABS.map(item => item.code)
const ICONS = {arrow: ChevronUp, clear: X}

// tab arrow keys
const arrows = e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    const other = e.currentTarget.nextElementSibling ?? e.currentTarget.previousElementSibling
    other.focus()
    other.click()
}

export default function Usage({copy, copied}) {
    const [tab, setTab] = useState(0)
    const [value, setValue] = useState()
    const active = TABS[tab]

    const pick = i => {
        if (i === tab) return
        setTab(i)
        setValue()
    }

    return (
        <section className='rac-start-usage' id='usage'>
            <div className='rac-code-title-container2'>
                <div className='rac-code-title-container'>
                    <div className='rac-code-icon'>
                        <MousePointer2/>
                    </div>
                    <h3 className='rac-code-title'>Usage</h3>
                </div>
                <div className='rac-usage-tabs' role='tablist' aria-label='Options source'>
                    <span className='rac-pill' style={{'--index': tab, '--count': TABS.length}} aria-hidden='true'/>
                    {TABS.map((item, i) => (
                        <button
                            className='rac-usage-tab'
                            tabIndex={i === tab ? 0 : -1}
                            aria-controls='usage-panel'
                            id={`usage-tab-${item.id}`}
                            aria-selected={i === tab}
                            onClick={() => pick(i)}
                            onKeyDown={arrows}
                            key={item.id}
                            role='tab'
                        >
                            {item.text}
                        </button>
                    ))}
                </div>
            </div>
            <p className='rac-code-desc'>Pass the options as an array or write them as <code>{'<Option/>'}</code> children: the rest of the code stays the same. JSX children can hold any content, such as icons. Note the value shape: an object from the array is reported as the whole object, an <code>{'<Option/>'}</code> as its <code>value</code>.</p>
            <div className='rac-code-container' tabIndex={0}>
                <div className='rac-basic-select-container'>
                    <Select
                        options={tab === 0 ? plans : undefined}
                        optionsClassName='rac-basic-options'
                        className='rac-basic-select'
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
                    <CodeMorph codes={CODES} active={tab}/>
                    <CopyButton copy={copy} code={active.code.text} keyId={active.id} copied={copied}/>
                </div>
            </div>
        </section>
    )
}
