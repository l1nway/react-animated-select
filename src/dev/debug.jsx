import {Bug, Tag, MousePointerClick, FileText} from 'lucide-react'
import {options, merge, arrowIcons} from '../components/helpers'
import {Table} from '../components/section'
import {Select} from 'react-animated-select'
import {useCallback, useReducer} from 'react'
import './debug.css'

// demo data
const initial = {controlled: true, value: null, open: undefined, keepMounted: false, onOpenChange: true}
const columns = [[Tag, 'Prop'], [MousePointerClick, 'Value'], [FileText, 'Description']]

const desc = 'Control the Select from outside, like a native input, or leave it alone: value and open both work controlled and uncontrolled. onOpenChange never fires on mount or for a no-op. Picking the already selected option of a single Select just closes the menu, without onChange. Clearing (the clear button, Delete or Backspace) reports null, or [] in multiple mode. A disabled Select or one without options is never shown open, whatever open says.'
const noop = () => {}

const rows = [{
    prop: 'value',
    field: 'controlled',
    kind: 'choices',
    choices: [{text: 'value + onChange', value: true}, {text: 'defaultValue', value: false}],
    text: 'With value and onChange the value lives in your state, and With defaultValue the Select reads it once on mount, keeps the value itself and still reports every change through onChange. Pick one mode per Select, as with a React input: this demo remounts the Select when you switch.'
}, {
    prop: 'open',
    kind: 'choices',
    keepFocus: true,
    choices: [{text: 'undefined', value: undefined, tone: 'none'}, {text: 'false', value: false, tone: 'off'}, {text: 'true', value: true, tone: 'on'}],
    text: 'undefined leaves the open state to the Select. false or true control it: with onOpenChange the Select asks and this switch follows, without it only this switch opens and closes the menu (opening on click and focus is off). An outside toggle takes the focus, so the Select asks to close on blur before its click lands: give it onMouseDown={e => e.preventDefault()}, as this switch has.'
}, {
    prop: 'keepMounted',
    kind: 'tick',
    text: 'Keeps the closed drop-down menu of options in the DOM, collapsed, instead of unmounting it.'
}, {
    prop: 'onOpenChange',
    kind: 'tick',
    text: 'Called with the next open state on every real open and close (click, focus, keys, blur), controlled or not. Never on mount and never for a no-op, such as Escape on a closed menu.'
}]

// [DOC: debug-table]
function Debug() {
    const [state, dispatch] = useReducer(merge, initial)
    const {controlled, value, open, keepMounted} = state

    const onChange = useCallback(next => dispatch({value: next}), [])
    const mirrorOpen = useCallback(next => dispatch({open: next}), [])
    const change = useCallback((field, next) => dispatch({[field]: next, ...field === 'controlled' && {value: null}}), [])

    const openChange = !state.onOpenChange ? undefined : open === undefined ? noop : mirrorOpen

    return (
        <section className='rac-debug' id='debug' aria-labelledby='debug-title'>
            <Table id='debug' icon={<Bug className='rac-debug-bug'/>} title='Debug' desc={desc} columns={columns} rows={rows} state={state} onChange={change}/>
            <Select
                key={`${controlled}-${open === undefined}`}
                defaultValue={controlled ? undefined : options[0]}
                value={controlled ? value : undefined}
                keepMounted={keepMounted}
                onOpenChange={openChange}
                onChange={onChange}
                options={options}
                icons={arrowIcons}
                open={open}
            />
        </section>
    )
}

export default Debug
