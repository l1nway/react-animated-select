import {vscDarkPlus} from 'react-syntax-highlighter/dist/esm/styles/prism'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import {Select, OptGroup, Option} from 'react-animated-select'
import {Fragment, useCallback, useMemo, useState} from 'react'
import {Group, Check, Scan, ChevronDown} from 'lucide-react'
import {CopyButton} from '../start/components'

const options = [
    {id: 1, name: 'Option 1'},
    {id: 2, name: 'Option 2', group: 'Group 1', disabled: true},
    {id: 3, name: 'Option 3', group: 'Group 3'},
    {group: 'Group 2', disabled: true},
    {group: 'Group 3', closed: false, options: [
        {id: 1, name: 'Option 1'},
        {id: 2, name: 'Option 2'}
    ]}
]

const examples = [{
    jsx: `<Select options=
    [{id: 1, name: 'Option 1'},
    {id: 2, name: 'Option 2', group: 'Group 1'},
    {group: 'Group 2', disabled: true},
    {id: 3, name: 'Option 3', group: 'Group 3',
    disabled: true}]
/>`
}, {
    jsx: `<Select options=[{
    group: 'Group 3',
    disabled: true,
    options: [
      {id: 1, name: 'Option 4'},
      {id: 2, name: 'Option 5', disabled: true}
    ]}/>`
}, {
    jsx: `<Select>
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
        desc: <>prop first is responsible for which options will come first: through the {`<`}<span style={{color:'rgb(78, 201, 176)'}}>Select</span>{`/>`} tag or through prop <span style={{color: 'rgb(156, 220, 254)'}}>options</span>.</>,
        onChange: setChild,
        value: child
    }, {
        name: 'groupsClosed',
        desc: 'prop is responsible for whether groups will be closed or open by default.',
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
            <p className='rac-group-desc'>Grouping system supports three synchronization modes: declarative {`<`}<span style={{color:'rgb(78, 201, 176)'}}>OptGroup</span>{`/>`} tags (with support for <span style={{color: 'rgb(156, 220, 254)'}}>id/value, name/label, disabled,</span> and <span style={{color: 'rgb(156, 220, 254)'}}>closed</span> props), structured group objects for full control over collapsed states, or simple flat arrays where options are assigned to a group by name. All inputs are automatically merged and synchronized into a unified menu.</p>
            <Select
                optionsClassName='rac-basic-options'
                className='rac-basic-select'
                OpenIcon={<ChevronDown/>}
                childrenFirst={child}
                groupsClosed={closed}
                setValue={setValue}
                options={options}
                value={value}
            >
                <OptGroup name='Group 3' id='third-group'>
                    <Option id='apple'>Option 9</Option>
                    <Option id='banana'>Option 10</Option>
                </OptGroup>
            </Select>
            <div className='rac-group-checkbox'>
                {props.map((item, index) =>
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
                {examples.map((item, index) =>
                    <Fragment key={item.jsx}>
                        <SyntaxHighlighter
                            className='rac-group-container'
                            style={vscDarkPlus}
                            language='jsx'
                            customStyle={{
                                backgroundColor: 'transparent',
                                fontSize: '0.95rem'
                            }}
                        >
                            {item.jsx}
                        </SyntaxHighlighter>
                        <CopyButton copy={copy} code={item.jsx} keyId={item.jsx} copied={copied}/>
                    </Fragment>
                )}
            </div>
        </section>
    )
}

export default Grouping