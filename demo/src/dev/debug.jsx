import {Bug, Scan, Check, ChevronDown} from 'lucide-react'
import {options} from '../components/options'
import {Select} from 'react-animated-select'
import {useReducer} from 'react'

const initialState = {
    ownBehavior: false,
    visibility: false,
    alwaysOpen: false,
    unmount: true
}

function reducer(state, action) {
    switch (action.type) {
        case 'TOGGLE_PROP':
            return { 
                ...state, 
                [action.propName]: !state[action.propName] 
            }
        default:
            return state
    }
}

const props = [{
    name: 'visibility',
    selected: false,
    editable: true,
    desc: 'Responsible for managing the opening and closing of the drop-down options menu.',
}, {
    name: 'unmount',
    selected: true,
    editable: true,
    desc: 'Responsible for unmounting the drop-down menu of options and icons when they are not active.'
}, {
    name: 'ownBehavior',
    selected: false,
    editable: true,
    desc: 'Disables the default select behavior (opening on click and focus), controlled only by the visibility prop.'
}, {
    name: 'onOpen',
    desc: 'Triggers the execution of a function when the drop-down menu is opened.'
}, {
    name: 'onClose',
    desc: 'Triggers the execution of a function when the drop-down menu is closed.'
}]

// (селект также открывается и закрывается по наведению на фокус, можно использовать внешнее управление посредством управления через ref)

function Debug() {
    const [state, dispatch] = useReducer(reducer, initialState)

    return (
        <section
            style={{paddingTop: 0}}
            className='rac-debug'
            id='debug'
        >
            <div className='rac-code-title-container'>
                <div className='rac-code-icon'>
                    <Bug style={{color: 'rgb(78, 201, 176)'}}/>
                </div>
                <h3 className='rac-code-title'>
                    Debug
                </h3>
            </div>
            <p className='rac-debug-desc'>Explore the interactive states of the Select component. Toggle between Disabled, Loading, and Error modes to see dynamic style injections (rac-*-style) in action. Use the text props below to fully customize the messaging for every component state, from custom placeholders to specific error alerts.</p>
            <div className='rac-debug-props'>
                {props.map((item, index) =>
                    <div
                        className='rac-debug-container'
                        key={item.name}
                    >
                        <label className='rac-debug-title-container'>
                            <h4 className='rac-debug-title'>{item.name}</h4>
                            {item.editable &&
                                <div className='rac-checkbox-container'>
                                    <Scan className='rac-check-box'/>
                                    <Check className={`rac-check-mark ${state[item.name] ? '--checked' : ''}`}/>
                                    <input
                                        onChange={() => dispatch({type: 'TOGGLE_PROP', propName: item.name})}
                                        className='rac-demo-checkbox'
                                        checked={!!state[item.name]}
                                        type='checkbox'
                                    />
                                </div>}
                        </label>
                        <span>{item.desc}</span>
                    </div>
                )}
            </div>
            <Select
                setVisibility={() => dispatch({type: 'TOGGLE_PROP', propName: 'visibility'})}
                optionsClassName='rac-basic-options'
                ownBehavior={state.ownBehavior}
                visibility={state.visibility}
                className='rac-basic-select'
                OpenIcon={<ChevronDown/>}
                unmount={state.unmount}
                options={options}
            />
        </section>
    )
}
export default Debug