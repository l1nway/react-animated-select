import {Scan, Check, Pencil, Tag, Braces, MousePointerClick, FileText, Hammer} from 'lucide-react'
import {Collapse, Presence} from '@l1nway/collapse'
import {Motion} from './motion'
import {Title, prevent} from './helpers'
import {Segmented} from './segmented'
import {Children, memo} from 'react'
import './section.css'
import './props.css'

const PROPS = [[Tag, 'Prop'], [Braces, 'Type'], [MousePointerClick, 'Value'], [FileText, 'Description']]

const tone = (item, value) => item.type === 'function' ? 'fn' : value ? 'on' : 'off'

const Columns = ({columns}) => columns.map(([Icon, label]) => <th scope='col' key={label}><span className='rac-th rac-iconed'><Icon aria-hidden/>{label}</span></th>)

// [DOC: rac-tick]
export const Tick = props => (
    <>
        <input className='rac-tick-input' type='checkbox' {...props}/>
        <span className='rac-tick-box' aria-hidden><Scan/><Check/></span>
    </>
)

const size = node => typeof node === 'string' ? node.length : Children.toArray(node).reduce((sum, item) => sum + size(item.props?.children ?? item), 0)

// [DOC: two-line-text]
export const Text = ({children}) => <td className='rac-table-text' style={{'--len': size(children)}}><p>{children}</p></td>

const Edit = ({item, name, value, onChange}) => (
    <td className='rac-props-edit' data-type={item.type} data-value={value} data-fill>
        <input className='rac-props-input' onChange={e => onChange(name, e.target.value)} aria-label={item.prop} value={value} type='text'/>
        <Pencil className='rac-props-pencil' aria-hidden/>
    </td>
)

// [DOC: props-value-width]
const State = ({item, name, value, onChange}) => {
    const shown = item.show ? item.show(value) : value === undefined || value === '' ? item.default : String(value)
    const Cell = item.kind === 'tick' ? 'label' : 'div'
    return (
        <td className='rac-props-state' data-fill>
            <Cell className='rac-table-tick'>
                <Presence>
                    <Collapse key={shown} as='span' axis='x' fade data-tone={tone(item, value)}>{shown}</Collapse>
                </Presence>
                {Cell === 'label' && <Tick onChange={e => onChange(name, e.target.checked)} aria-label={item.prop} checked={value}/>}
            </Cell>
        </td>
    )
}

const Planned = ({item}) => (
    <td className='rac-props-state rac-props-soon rac-iconed' data-fill>
        <div className='rac-table-tick' role='img' aria-label={`${item.prop}: in development`}>
            <span>Soon</span>
            <Hammer aria-hidden/>
        </div>
    </td>
)

const Choices = ({item, name, value, onChange}) => (
    <td className='rac-props-pick' style={{'--n': item.choices.length, '--len': Math.max(...item.choices.map(c => String(c.text ?? c).length))}} data-fill>
        <Segmented className='rac-props-choices' id={`props-${item.prop}`} label={item.prop} items={item.choices} value={value}
            onPick={next => onChange(name, next)} onMouseDown={item.keepFocus ? prevent : undefined}/>
    </td>
)

const base = {edit: Edit, tick: State, state: State, choices: Choices, soon: Planned}

// [DOC: props-table]
const Row = memo(({item, value, onChange, cells}) => {
    const Cell = cells?.[item.kind] ?? base[item.kind] ?? State
    return (
        <tr>
            <th className='rac-props-name' scope='row'>{item.prop}</th>
            {item.type && <td data-type={item.type}>{item.type}</td>}
            <Cell item={item} name={item.field ?? item.prop} value={value} onChange={onChange}/>
            <Text>{item.text}</Text>
        </tr>
    )
})

// [DOC: semantic-table]
export function Table({id, icon, title, desc, columns = PROPS, head = true, region = true, rows, state, onChange, cells, className, children, ...rest}) {
    const label = `${id}-title`
    const table = (
        <table className={className ? `rac-table ${className}` : 'rac-table'} data-head={head ? undefined : 'hidden'} {...rest}>
            <caption>{icon ? <Title className='rac-table-sticky' icon={icon} id={label}>{title}</Title> : <span className='rac-sr-only' id={label}>{title}</span>}</caption>
            <thead>
                {desc &&
                    <tr>
                        <td colSpan={columns.length}><p className='rac-table-sticky rac-table-desc rac-desc'>{desc}</p></td>
                    </tr>
                }
                <tr className={head ? undefined : 'rac-sr-only'}><Columns columns={columns}/></tr>
            </thead>
            <tbody>
                {rows?.map(item => <Row key={item.prop} item={item} value={state[item.field ?? item.prop]} onChange={onChange} cells={cells}/>)}
                {children}
            </tbody>
        </table>
    )
    return <Motion>{region ? <div className='rac-table-scroll' role='region' aria-labelledby={label} tabIndex={0}>{table}</div> : table}</Motion>
}
