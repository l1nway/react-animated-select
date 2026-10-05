import {ListVideo} from 'lucide-react'
import {options, merge, arrowIcons} from '../components/helpers'
import {Table} from '../components/section'
import {Select} from 'react-animated-select'
import Slider from '../components/slider'
import {useCallback, useReducer} from 'react'
import './animations.css'

// demo data
const desc = 'Open and close, group collapse, chips and title cross-fades run on the Web Animations API, with no animation library. Animations reverse mid-way without a jump and respect prefers-reduced-motion. Edit the props below and open the Select to try them.'
const initial = {duration: 300, easing: 'ease-out', offset: 1, animateOpacity: true}
const easings = ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'cubic-bezier(0.34, 1.56, 0.64, 1)']
const easingIcons = {...arrowIcons, clear: false}

const props = [
    {prop: 'duration', type: 'number', kind: 'range', min: 0, max: 2000, step: 50, unit: 'ms', text: 'Length of every animation and transition of the Select, in milliseconds. Hover fades run at half of it. Default 300.'},
    {prop: 'easing', type: 'string', kind: 'select', text: 'CSS timing function of those animations and transitions. Default ease.'},
    {prop: 'offset', type: 'number', kind: 'range', min: 0, max: 16, step: 1, unit: 'px', text: 'Gap between the trigger and the panel, in pixels. Keep it small: a wide gap detaches the panel. Default 1.'},
    {prop: 'animateOpacity', type: 'boolean', kind: 'tick', text: 'Fades the panel in and out while it opens and closes. Default true.'},
    {prop: 'motion', type: 'object', kind: 'soon', text: 'Tunes each animated role (panel, chip, title, arrow, move and more) with a preset, a spec object, a function or false to turn it off.'}
]

const Range = ({item, name, value, onChange}) => (
    <td className='rac-animations-value'>
        <div className='rac-animations-range'>
            <span className='rac-animations-num' aria-hidden>{value}{item.unit}</span>
            <Slider onChange={next => onChange(name, next)} aria-valuetext={`${value}${item.unit}`} aria-label={item.prop} value={value} step={item.step} max={item.max} min={item.min}/>
        </div>
    </td>
)

const Easing = ({item, name, value, onChange}) => (
    <td data-fill>
        <Select className='rac-animations-select' onChange={next => onChange(name, next)} aria-label={item.prop} icons={easingIcons} options={easings} value={value}/>
    </td>
)

const cells = {range: Range, select: Easing}

// [DOC: animations-table]
function Animations() {
    const [state, dispatch] = useReducer(merge, initial)
    const change = useCallback((prop, value) => dispatch({[prop]: value}), [])

    return (
        <section className='rac-states rac-animations-section' id='animations' aria-labelledby='animations-title'>
            <Table id='animations' icon={<ListVideo/>} title='Animations' desc={desc} rows={props} state={state} onChange={change} cells={cells} className='rac-animations-table'/>
            <Select icons={arrowIcons} options={options} {...state}/>        </section>
    )
}

export default Animations
