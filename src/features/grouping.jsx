import {Select, OptGroup, Option} from 'react-animated-select'
import {useCallback, useReducer} from 'react'
import {merge, arrowIcons, Heading} from '../components/helpers'
import {CopyButton, CodeBlock} from '../components/code'
import {snippet} from '../components/tokens'
import {Table} from '../components/section'
import {Card, Track} from '../components/track'
import {Group, List, Boxes, Component, Tags} from 'lucide-react'
import './grouping.css'

// demo data
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

const methods = [{
    title: 'Flat Array',
    icon: <List/>,
    desc: <>Set <code>group</code> on an option; same names share one group.</>,
    code: snippet`<Select options={[
  {id: 1, name: 'Option 1'},
  {id: 2, name: 'Option 2', group: 'Group 1'},
  {group: 'Group 2', disabled: true},
  {id: 3, name: 'Option 3', group: 'Group 3',
    disabled: true}
]}/>`
}, {
    title: 'Group Objects',
    icon: <Boxes/>,
    desc: <>A group object carries its own <code>options</code>.</>,
    code: snippet`<Select options={[{
  group: 'Group 3',
  disabled: true,
  options: [
    {id: 1, name: 'Option 4'},
    {id: 2, name: 'Option 5', disabled: true}
  ]
}]}/>`
}, {
    title: 'OptGroup Tag',
    icon: <Component/>,
    desc: <>Declarative groups with children.</>,
    code: snippet`<Select>
  <OptGroup
    name='Group 3' id='third-group'>
     <Option id='apple'>Option 9</Option>
     <Option id='banana'>Option 10</Option>
  </OptGroup>
</Select>`
}, {
    title: 'Option Group Prop',
    icon: <Tags/>,
    desc: <>Pass <code>group</code> to a single option tag.</>,
    code: snippet`<Select>
  <Option id='cherry' group='Group 3'>
    Option 11
  </Option>
  <Option id='plum' group='Group 4'>
    Option 12
  </Option>
</Select>`
}]

const Tag = ({children}) => <>{'<'}<span className='rac-grouping-tag'>{children}</span>{'/>'}</>
const Prop = ({children}) => <span className='rac-grouping-prop'>{children}</span>

const desc = <>Grouping system supports four synchronization modes: declarative <Tag>OptGroup</Tag> tags (with support for <Prop>id/value, name/label, disabled, className</Prop> and <Prop>style</Prop> props), structured group objects with their own options, simple flat arrays where options are assigned to a group by name, or the <Prop>group</Prop> prop on a single <Tag>Option</Tag>. All inputs are merged into one menu. Groups can be disabled and collapsed: all of them start open, or all closed with <Prop>groupsClosed</Prop>. The Select is smart enough to gather options into a group by matching its name, but to avoid unwanted matches, prefer unique ids.</>

const props = [
    {prop: 'childrenFirst', type: 'boolean', default: 'false', text: <>Puts the JSX children of <Tag>Select</Tag> before the <Prop>options</Prop> array.</>, kind: 'tick'},
    {prop: 'groupsClosed', type: 'boolean', default: 'false', text: 'Starts every group collapsed instead of open.', kind: 'tick'}
]

function Grouping() {
    const [state, dispatch] = useReducer(merge, {value: null, childrenFirst: false, groupsClosed: false})

    const update = useCallback((prop, val) => dispatch({[prop]: val}), [])
    const pick = useCallback(value => dispatch({value}), [])

    return (
        <section className='rac-states rac-grouping' id='grouping' aria-labelledby='grouping-heading'>
            <Heading icon={<Group/>} id='grouping-heading' title='Grouping Options' desc={desc}/>
            <Select
                childrenFirst={state.childrenFirst}
                groupsClosed={state.groupsClosed}
                value={state.value}
                icons={arrowIcons}
                options={options}
                onChange={pick}
            >
                <OptGroup name='Group 3' id='third-group'>
                    <Option id='apple'>Option 9</Option>
                    <Option id='banana'>Option 10</Option>
                </OptGroup>
                <Option id='cherry' group='Group 3'>Option 11</Option>
            </Select>
            <Table id='grouping-props' title='Grouping props' rows={props} state={state} onChange={update}/>
            <Track label='Grouping methods'>
                {methods.map(({code, ...item}) =>
                    <Card key={item.title} className='rac-group-card' {...item}>
                        <div className='rac-group-code'>
                            <CodeBlock code={code}/>
                            <CopyButton code={code.text}/>
                        </div>
                    </Card>
                )}
            </Track>
        </section>
    )
}

export default Grouping
