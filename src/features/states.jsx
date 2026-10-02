import {useCallback, useReducer, useMemo} from 'react'
import {merge, arrowIcons, options} from '../components/helpers'
import {Select} from 'react-animated-select'
import {Table} from '../components/section'
import {Info} from 'lucide-react'
import './states.css'

// demo data
const desc = 'Toggle the states of the Select. disabled works like a native disabled select: the value stays visible and nothing opens. loading and error only report: while there are options, the Select keeps working. Each state has its own attribute on the root to style (aria-disabled, aria-busy, data-error, data-empty) and its own text in the texts prop below. selectedText, when filled, replaces the title (and the chips in multiple mode) while there is a value; leave it empty to turn it off.'

const props = [
    {prop: 'options', type: 'array', default: '[]', text: 'Demo toggle: the full list or none. Without options the Select cannot open and shows texts.empty.', kind: 'tick', show: on => on ? '[…]' : '[]'},
    {prop: 'disabled', type: 'boolean', default: 'false', text: 'Blocks the Select like a native disabled select: closed, no clear button, chips locked, value kept.', kind: 'tick'},
    {prop: 'loading', type: 'boolean', default: 'false', text: 'Reports loading: aria-busy on the root, a loading footer in the list. Never blocks.', kind: 'tick'},
    {prop: 'error', type: 'boolean', default: 'false', text: 'Reports a failed load: data-error on the root, an error row at the end of the list. Never blocks.', kind: 'tick'},
    {prop: 'texts.empty', type: 'string', default: 'No options', text: 'Title when there are no options.', kind: 'edit'},
    {prop: 'texts.disabled', type: 'string', default: 'Disabled', text: 'Title of a disabled Select without a value, in place of the placeholder.', kind: 'edit'},
    {prop: 'texts.loading', type: 'string', default: 'Loading', text: 'Title while loading without a value, and the text of the loading footer.', kind: 'edit'},
    {prop: 'texts.error', type: 'string', default: 'Failed to load', text: 'Title on error without a value, and the text of the error row.', kind: 'edit'},
    {prop: 'placeholder', type: 'string', default: 'Choose option', text: 'Title while there are options and no value.', kind: 'edit'},
    {prop: 'selectedText', type: 'string', default: 'undefined', text: 'Replaces the title (and the chips in multiple mode) while there is a value.', kind: 'edit'}
]

const initial = {
    value: undefined,
    options: true,
    disabled: false,
    loading: false,
    error: false,
    'texts.empty': 'No options',
    'texts.disabled': 'Disabled',
    'texts.loading': 'Loading',
    'texts.error': 'Failed to load',
    placeholder: 'Choose option',
    selectedText: ''
}

// [DOC: semantic-table]
function States() {
    const [state, dispatch] = useReducer(merge, initial)

    const update = useCallback((prop, val) => dispatch({[prop]: val}), [])
    const pick = useCallback(value => dispatch({value}), [])

    const {'texts.empty': empty, 'texts.disabled': disabled, 'texts.loading': loading, 'texts.error': error} = state
    const texts = useMemo(() => ({empty, disabled, loading, error}), [empty, disabled, loading, error])

    return (
        <section className='rac-states rac-states-props' id='states'>
            <Table id='states' icon={<Info/>} title='Component States' desc={desc} rows={props} state={state} onChange={update}/>
            <Select
                options={state.options ? options : undefined}
                selectedText={state.selectedText || undefined}
                placeholder={state.placeholder}
                disabled={state.disabled}
                loading={state.loading}
                error={state.error}
                value={state.value}
                icons={arrowIcons}
                onChange={pick}
                texts={texts}
            />
        </section>
    )
}

export default States
