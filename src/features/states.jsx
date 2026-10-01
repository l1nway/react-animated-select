import {useState, useCallback, useReducer, memo} from 'react'
import {Info, Scan, Check, ChevronUp} from 'lucide-react'
import {options} from '../components/options'
import {Select} from 'react-animated-select'

const initialState = {
    loading: false,
    disabled: false,
    error: false,
    hasOptions: true,

    placeholder: 'Choose option',
    'texts.empty': 'No options',
    'texts.loading': 'Loading',
    'texts.error': 'Failed to load',
    'texts.disabled': 'Disabled',

    inputValue: '',
    disabledOption: false,
    groupValue: '',
}

const textSettings = ['texts.empty', 'texts.disabled', 'texts.loading', 'texts.error', 'placeholder']

const RenderTextSettings = memo(({label, value, onChange}) => (
    <label className='rac-prop-label'>
        <span className='rac-prop-span'>{label}</span>
        <input
            onChange={(e) => onChange(label, e.target.value)}
            className='rac-prop-value'
            placeholder={label}
            value={value}
            type='text'
        />
    </label>
))

const settings = ['hasOptions', 'disabled', 'loading', 'error']

const RenderSettings = memo(({label, value, onChange}) => (
    <label className='rac-checkbox-wrapper'>
        {label === 'hasOptions' ? 'options != []' : label}
        <input
            onChange={(e) => onChange(label, e.target.checked)}
            className='rac-demo-checkbox'
            data-rac-checked={value}
            checked={value}
            type='checkbox'
        />
        <div className='rac-checkbox-container'>
            <Scan
                style={{top: 0, left: '-1.65em'}}
                className='rac-check-box'
            />
            <Check
                className={`rac-check-mark ${value ? '--checked' : ''}`}
                style={{top: '0.25em', left: '-1.5em'}}
            />
        </div>
    </label>
))

function reducer(state, action) {
  switch (action.type) {
    case 'UPDATE':
      return {...state, ...action.payload}
    default: return state
  }
}

function States() {
    const [state, dispatch] = useReducer(reducer, initialState)

    const [value, setValue] = useState()

    const update = useCallback((label, val) => dispatch({type: 'UPDATE', payload: {[label]: val}}), [dispatch])

    return (
        <section
            style={{paddingTop: 0}}
            className='rac-states'
            id='states'
        >
            <div className='rac-code-title-container'>
                <div className='rac-code-icon'>
                    <Info/>
                </div>
                <h3 className='rac-code-title'>
                    Component States
                </h3>
            </div>
            <p className='rac-states-desc'>Toggle the states of the Select. disabled works like a native disabled select: the value stays visible and nothing opens. loading and error only report: while there are options, the Select keeps working. Each state has its own attribute on the root to style (aria-disabled, aria-busy, data-error, data-empty) and its own text in the texts prop below.</p>
            <Select
                options={state.hasOptions ? options : undefined}
                optionsClassName='rac-basic-options'
                texts={{empty: state['texts.empty'], disabled: state['texts.disabled'], loading: state['texts.loading'], error: state['texts.error']}}
                placeholder={state.placeholder}
                className='rac-basic-select'
                icons={{arrow: ChevronUp}}
                disabled={state.disabled}
                loading={state.loading}
                onChange={setValue}
                error={state.error}
                value={value}
            />
            <div className='rac-states-container'>
                <div className='rac-settings-checkboxes'>
                    {settings.map(key => (
                        <RenderSettings
                            value={state[key]}
                            onChange={update}
                            label={key}
                            key={key}
                        />
                    ))}
                </div>
                <div className='rac-settings-inputs'>
                    {textSettings.map(key => (
                        <RenderTextSettings
                            value={state[key]}
                            onChange={update}
                            label={key}
                            key={key}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default States