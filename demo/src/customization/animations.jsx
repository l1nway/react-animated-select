import {ListVideo, Scan, Check, ChevronDown} from 'lucide-react'
import {options} from '../components/options'
import {Select} from 'react-animated-select'
import Slider from '../components/slider'
import {useMemo, useReducer} from 'react'

const initial = {
    animateOpacity: true,
    easing: 'ease-out',
    duration: 300,
    offset: 1
}

function reducer(state, action) {
    switch (action.type) {
        case 'SET_DURATION':
            return {...state, duration: Number(action.payload)}
        case 'SET_EASING':
            return {...state, easing: action.payload}
        case 'SET_OFFSET':
            return {...state, offset: Number(action.payload)}
        case 'SET_ANIMATE_OPACITY':
            return {...state, animateOpacity: action.payload}
        case 'RESET':
            return initial
        default:
            return state
    }
}

function Animations() {
    const [state, dispatch] = useReducer(reducer, initial)

    const props = useMemo(() => [
        {
            id: 'duration',
            name: 'Duration',
            value: state.duration,
            type: 'range',
            min: 0,
            max: 2000,
            step: 50,
            unit: 'ms',
            action: 'SET_DURATION'
        }, {
            id: 'easing',
            name: 'Easing',
            value: state.easing,
            type: 'select',
            options: ['ease-in', 'ease-out', 'ease-in-out', 'linear', 'cubic-bezier(0.34, 1.56, 0.64, 1)'],
            action: 'SET_EASING'
        }, {
            id: 'offset',
            name: 'Offset',
            value: state.offset,
            type: 'number',
            min: -50,
            max: -50,
            unit: 'px',
            action: 'SET_OFFSET'
        }, {
            id: 'animateOpacity',
            name: 'Animate Opacity',
            value: state.animateOpacity,
            type: 'checkbox',
            action: 'SET_ANIMATE_OPACITY'
        }
    ], [state])
    
    return (
        <section
            style={{paddingTop: '1em'}}
            className='rac-states'
            id='animations'
        >
            <div className='rac-code-title-container'>
                <div className='rac-code-icon'>
                    <ListVideo/>
                </div>
                <h3 className='rac-code-title'>
                    Animations
                </h3>
            </div>
            <p className='rac-animations-desc'>Explore the interactive states of the Select component. Toggle between Disabled, Loading, and Error modes to see dynamic style injections (rac-*-style) in action. Use the text props below to fully customize the messaging for every component state, from custom placeholders to specific error alerts.</p>
            <div className='rac-animations'>
                {props.map((item, index) =>
                    <label key={item.name} className='rac-animations-container'>
                        <span className='rac-animations-title'>{item.name}</span>
                        {item.type === 'range' && <Slider
                            onChange={(e) => dispatch({type: item.action, payload: e})}
                            value={item.value}
                            max={item.max}
                            min={item.min}
                        />}
                        {item.type === 'number' && <input
                            onChange={(e) => dispatch({type: item.action, payload: e.target.value})}
                            className='rac-prop-value'
                            value={item.value}
                            type={item.type}
                        />}
                        {item.type === 'select' && <Select
                            onChange={(e) => dispatch({type: item.action, payload: e})}
                            className='rac-basic-select rac-animations-select'
                            optionsClassName='rac-basic-options'
                            OpenIcon={<ChevronDown/>}
                            options={item.options}
                            ClearIcon={false}
                            value={item.value}
                        />}
                        {item.type === 'checkbox' &&
                            <div className='rac-checkbox-container'>
                                <Scan className='rac-check-box'/>
                                <Check
                                    className={`rac-check-mark ${item.value ? '--checked' : ''}`}
                                    style={{left: '-1.3em'}}
                                />
                                <input
                                    onChange={(e) => dispatch({type: item.action, payload: e.target.checked})}
                                    className='rac-demo-checkbox'
                                    checked={item.value}
                                    type={item.type}
                                />
                            </div>}
                    </label>
                )}
            </div>
            <Select
                optionsClassName='rac-basic-options'
                className='rac-basic-select'
                OpenIcon={<ChevronDown/>}
                options={options}
                {...state}
            />
        </section>
    )
}

export default Animations