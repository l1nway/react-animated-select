import {Bug, Scan, Check, ChevronUp} from 'lucide-react'
import {options} from '../components/options'
import {Select} from 'react-animated-select'
import {useReducer} from 'react'

const initialState = {
    open: false,
    keepMounted: false,
    onOpenChange: true
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
    name: 'open',
    selected: false,
    editable: true,
    keepFocus: true,
    desc: 'Controlled open state of the drop-down options menu. Note for an outside toggle: pressing it moves the focus away, so the Select asks to close on blur before the toggle\'s click lands, and the click then reopens the menu. Give the toggle onMouseDown={e => e.preventDefault()} to keep the focus in the Select, as this checkbox does.',
}, {
    name: 'keepMounted',
    selected: false,
    editable: true,
    desc: 'Keeps the closed drop-down menu of options in the DOM, collapsed, instead of unmounting it.'
}, {
    name: 'onOpenChange',
    selected: true,
    editable: true,
    desc: 'Called with the next open state on every open and close (click, focus, keys, blur). Without it, open alone controls the menu: the default behavior (opening on click and focus) is disabled.'
}]

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
            <p className='rac-debug-desc'>Control the open state from outside, like a native input. Pass open together with onOpenChange to keep the default behavior and mirror it in your state, or open alone to open and close the menu only from your code. onOpenChange is never called on mount or for a no-op, and a disabled Select or one without options is never shown open, whatever open says.</p>
            <div className='rac-debug-props'>
                {props.map(item =>
                    <div
                        className='rac-debug-container'
                        key={item.name}
                    >
                        <label
                            onMouseDown={item.keepFocus ? e => e.preventDefault() : undefined}
                            className='rac-debug-title-container'
                        >
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
                onOpenChange={state.onOpenChange ? () => dispatch({type: 'TOGGLE_PROP', propName: 'open'}) : undefined}
                optionsClassName='rac-basic-options'
                keepMounted={state.keepMounted}
                className='rac-basic-select'
                icons={{arrow: ChevronUp}}
                open={state.open}
                options={options}
            />
        </section>
    )
}
export default Debug