import {Select, OptGroup, Option} from 'react-animated-select'
import {Fragment, useCallback, useMemo, useState} from 'react'
import {Group, Check, Scan, ChevronUp} from 'lucide-react'
import {CopyButton, CodeBlock} from '../components/code'
import {snippet} from '../components/tokens'

const options = [
    {id: 1, name: 'Option 1'},
    {id: 2, name: 'Option 2', group: 'Group 1', disabled: true},
    {id: 3, name: 'Option 3', group: 'Group 3'},
    {group: 'Group 2', disabled: true},
    {group: 'Group 3', options: [
        {id: 1, name: 'Option 1'},
        {id: 2, name: 'Option 2'}
    ]}
]

const examples = [{
    jsx: snippet`<Select options={[
  {id: 1, name: 'Option 1'},
  {id: 2, name: 'Option 2', group: 'Group 1'},
  {group: 'Group 2', disabled: true},
  {id: 3, name: 'Option 3', group: 'Group 3',
    disabled: true}
]}/>`
}, {
    jsx: snippet`<Select options={[{
  group: 'Group 3',
  disabled: true,
  options: [
    {id: 1, name: 'Option 4'},
    {id: 2, name: 'Option 5', disabled: true}
  ]
}]}/>`
}, {
    jsx: snippet`<Select>
  <OptGroup
    name='Group 3' id='third-group'>
     <Option id='apple'>Option 9</Option>
     <Option id='banana'>Option 10</Option>
  </OptGroup>
</Select>`
}]

function Grouping() {
    const [value, setValue] = useState(null)
    const [copied, setCopied] = useState(false)
    const [child, setChild] = useState(false)
    const [closed, setClosed] = useState(false)

    const copy = useCallback((code, keyId) => {
        navigator.clipboard.writeText(code)
        setCopied(keyId)

        const timer = setTimeout(() => setCopied(false), 2000)

        return () => clearTimeout(timer)
    }, [])

    const props = useMemo(() => [{
        name: 'childrenFirst',
        desc: <>puts the JSX children of {`<`}<span style={{color:'rgb(78, 201, 176)'}}>Select</span>{`/>`} before the <span style={{color: 'rgb(156, 220, 254)'}}>options</span> array.</>,
        onChange: setChild,
        value: child
    }, {
        name: 'groupsClosed',
        desc: 'starts every group collapsed instead of open.',
        onChange: setClosed,
        value: closed
    }], [child, closed])

    return (
        <section
            style={{paddingTop: 0}}
            className='rac-states'
            id='grouping'
        >
            <div className='rac-code-title-container'>
                <div className='rac-code-icon'>
                    <Group/>
                </div>
                <h3 className='rac-code-title'>
                    Grouping Options
                </h3>
            </div>
            <p className='rac-group-desc'>Grouping system supports three synchronization modes: declarative {`<`}<span style={{color:'rgb(78, 201, 176)'}}>OptGroup</span>{`/>`} tags (with support for <span style={{color: 'rgb(156, 220, 254)'}}>id/value, name/label, disabled, className</span> and <span style={{color: 'rgb(156, 220, 254)'}}>style</span> props), structured group objects with their own options, or simple flat arrays where options are assigned to a group by name. All inputs are merged into one menu. Groups can be disabled and collapsed: all of them start open, or all closed with <span style={{color: 'rgb(156, 220, 254)'}}>groupsClosed</span>.</p>
            <Select
                optionsClassName='rac-basic-options'
                className='rac-basic-select'
                icons={{arrow: ChevronUp}}
                childrenFirst={child}
                groupsClosed={closed}
                onChange={setValue}
                options={options}
                value={value}
            >
                <OptGroup name='Group 3' id='third-group'>
                    <Option id='apple'>Option 9</Option>
                    <Option id='banana'>Option 10</Option>
                </OptGroup>
            </Select>
            <div className='rac-group-checkbox'>
                {props.map(item =>
                    <label
                        className='rac-children-first'
                        key={item.name}
                    >
                        <div className='rac-checkbox-container'>
                            <input
                                onChange={(e) => item.onChange(e.target.checked)}
                                className='rac-demo-checkbox'
                                checked={item.value}
                                type='checkbox'
                            />
                            <Scan
                                style={{left: 0, top: '-0.8em'}}
                                className='rac-check-box'/>
                            <Check
                                className={`rac-check-mark ${item.value ? '--checked' : ''}`}
                                style={{top: '-0.55em', left: '0.1em'}}
                            />
                        </div>
                        <h4 className='rac-child-title'>{item.name}</h4>
                        <span style={{textWrap: 'nowrap'}}>{item.desc}</span>
                    </label>
                )}
            </div>
            <div className='rac-groups-jsx'>
                {examples.map(item =>
                    <Fragment key={item.jsx.text}>
                        <CodeBlock code={item.jsx} className='rac-group-container'/>
                        <CopyButton copy={copy} code={item.jsx.text} keyId={item.jsx.text} copied={copied}/>
                    </Fragment>
                )}
            </div>
        </section>
    )
}

export default Grouping