import {useCallback, useReducer, memo} from 'react'
import {LineStyle, SquareArrowDown} from 'lucide-react'
import {Collapse} from '@l1nway/collapse'
import {Select} from 'react-animated-select'
import {merge, Title} from '../components/helpers'
import {CHIPS} from '../components/chips'
import {Table, Text} from '../components/section'
import {PRESETS, TABLES} from './reference'
import {Showcase, Toggle} from './showcase'
import './styling.css'

// demo data
const cities = ['Amsterdam', 'Berlin', 'Copenhagen', 'Lisbon', 'Oslo', 'Prague', 'Vienna']

const desc = <>All library styles live in <code>@layer rac</code>: <code>rac.base</code> holds what the Select needs to work, <code>rac.theme</code> a small neutral look. Any plain CSS on the <code>rac-*</code> classes wins over both without <code>!important</code>; if your app uses cascade layers too, declare the library first: <code>@layer rac, app;</code>. Only shared values are variables: set <code>--rac-fg</code> and <code>--rac-bg</code>, and every hover, highlight, selection and chip tint follows. States are attributes, not modifier classes: <code>[aria-expanded]</code>, <code>[data-placement]</code>, <code>[aria-busy]</code>, <code>[data-error]</code>, <code>[aria-disabled]</code>, <code>[data-empty]</code>. <code>className</code> and <code>style</code> reach the trigger, <code>optionsClassName</code> the panel; the panel is a portal, so the <code>--*</code> keys of <code>style</code> are copied onto it.</>

const title = <Title icon={<LineStyle/>}>Styling & Variables</Title>

const FLAGS = [
    {name: 'multiple', note: '.rac-chip'},
    {name: 'loading', note: '[aria-busy]'},
    {name: 'error', note: '[data-error]'},
    {name: 'disabled', note: '[aria-disabled]'}
]

const COLOR = /^(#|color-mix\(|rgba?\(|hsla?\(|oklch\()/

const flip = open => !open

// [DOC: styling-tables]
const Reference = memo(({table}) => {
    const [open, toggle] = useReducer(flip, false)
    const {id, name, columns, element} = table
    const panel = `styling-ref-${id}`
    return (
        <>
            <button className='rac-styling-label' onClick={toggle} aria-expanded={open} aria-controls={panel} type='button'>
                <span className='rac-styling-maintitle'>{name}</span>
                <SquareArrowDown className='rac-styling-icon' aria-hidden='true'/>
            </button>
            <Collapse in={open} className='rac-styling-container' id={panel} duration={500}>
                <Table id={`styling-${id}`} title={name} columns={columns} className='rac-styling-table'>
                    {element.map(item =>
                        <tr key={item.name + item.value}>
                            <th className='rac-styling-title' scope='row' data-depth={item.depth}>{item.name}</th>
                            <td className='rac-styling-value' style={COLOR.test(item.value) ? {color: item.value} : undefined}>{item.value}</td>
                            <Text>{item.desc}</Text>
                        </tr>
                    )}
                </Table>
            </Collapse>
        </>
    )
})

function Styling() {
    const [state, dispatch] = useReducer(merge, {preset: 0, value: null, multiple: false, loading: false, error: false, disabled: false})
    const preset = PRESETS[state.preset]

    const pick = useCallback(i => dispatch({preset: i}), [])
    const setValue = useCallback(value => dispatch({value}), [])
    const toggle = useCallback((name, on) => dispatch(name === 'multiple' ? {multiple: on, value: null} : {[name]: on}), [])

    return (
        <section className='rac-states rac-styling-section' id='styling'>
            <Showcase id='styling' label='Theme preset' tabs={PRESETS} active={state.preset} onPick={pick} codes={preset.codes} title={title} desc={desc}>
                <div className='rac-showcase-stage'>
                    <style>{preset.codes[1].text}</style>
                    <Select
                        placeholder='Choose a city'
                        disabled={state.disabled}
                        plugins={CHIPS}
                        multiple={state.multiple}
                        loading={state.loading}
                        error={state.error}
                        value={state.value}
                        onChange={setValue}
                        options={cities}
                        {...preset.props}
                    />
                    <div className='rac-showcase-toggles'>
                        {FLAGS.map(item => <Toggle key={item.name} name={item.name} note={item.note} checked={state[item.name]} onChange={toggle}/>)}
                    </div>
                </div>
            </Showcase>
            <div className='rac-styling'>
                {TABLES.map(table => <Reference key={table.id} table={table}/>)}
            </div>
        </section>
    )
}

export default Styling
