import {useState, useCallback, useReducer, memo} from 'react'
import {Info, Scan, Check, ChevronDown} from 'lucide-react'
import {options} from '../components/options'
import {Select} from 'react-animated-select'

const initialState = {
    loading: false,
    disabled: false,
    error: false,
    hasOptions: true,

    placeholder: 'Choose option',
    emptyText: 'No options',
    loadingText: 'Loading',
    errorText: 'Failed to load',
    disabledText: 'Disabled',

    inputValue: '',
    disabledOption: false,
    groupValue: '',
}

const textSettings = ['emptyText', 'disabledText', 'loadingText', 'errorText', 'placeholder']

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
            <p className='rac-states-desc'>Explore the interactive states of the Select component. Toggle between Disabled, Loading, and Error modes to see dynamic style injections (rac-*-style) in action. Use the text props below to fully customize the messaging for every component state, from custom placeholders to specific error alerts.</p>
            <Select
                options={state.hasOptions ? options : undefined}
                optionsClassName='rac-basic-options'
                disabledText={state.disabledText}
                loadingText={state.loadingText}
                placeholder={state.placeholder}
                className='rac-basic-select'
                errorText={state.errorText}
                emptyText={state.emptyText}
                OpenIcon={<ChevronDown/>}
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