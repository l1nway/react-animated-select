import {FileStack, Scan, Check, LineSquiggle, FingerprintPattern, Folders} from 'lucide-react'
import {useCallback, useReducer} from 'react'
import {merge, arrowIcons, Heading, numbered} from '../components/helpers'
import {Select} from 'react-animated-select'
import {Table} from '../components/section'
import './multiple.css'

// demo data
const options = numbered(20)

const icons = {...arrowIcons, check: <Check color='#c084fc'/>, checkbox: Scan}
const rowStyle = {'--rac-row': '2.5rem'}

const features = [{
    name: 'Multi-Selection with Chips',
    Icon: Folders,
    desc: 'Supports selecting multiple values, rendered as interactive Chips (Badges) for clear visual feedback.'
}, {
    name: 'Gesture & Touch Controls',
    Icon: LineSquiggle,
    sub: [
        'Long-pressing a chip activates "Deletion Mode", allowing for quick tap-to-remove actions.',
        'Supports mobile-native swipe-left gestures on individual chips to reveal a hidden delete icon.'
    ]
}, {
    name: 'Made for Fingers',
    Icon: FingerprintPattern,
    sub: [
        'A chip takes only horizontal moves (touch-action: pan-y), so a vertical swipe that starts on a chip still scrolls the page.',
        'A finger that trembles by a few pixels still gets its long press; only a real move (over 10px) cancels it.',
        'Entering delete mode vibrates only where navigator.vibrate exists, which means Android browsers: iOS Safari has no web vibration.'
    ]
}]

const props = [
    {prop: 'deleteAlways', type: 'boolean', default: 'false', text: 'Keep the delete button always visible instead of showing it on hover.', kind: 'tick'},
    {prop: 'deleteInline', type: 'boolean', default: 'false', text: 'Place the delete button inside the chip, which widens, instead of over its text; no chip changes rows.', kind: 'tick'},
    {prop: 'sortable', type: 'boolean', default: 'false', text: 'Drag chips to reorder the value: mouse drag, long press then drag on touch, modifier + arrows on keyboard.', kind: 'soon'}
]

function Multiple() {
    const [state, dispatch] = useReducer(merge, {value: undefined, deleteAlways: false, deleteInline: false})

    const update = useCallback((prop, val) => dispatch({[prop]: val}), [])
    const pick = useCallback(value => dispatch({value}), [])

    return (
        <section className='rac-multiple' id='multiple' aria-labelledby='multiple-heading'>
            <Heading icon={<FileStack/>} id='multiple-heading' title='Multiple Options'/>
            <div className='rac-multiple-desc'>
                {features.map(({name, Icon, desc, sub}) =>
                    <ul className='rac-multiple-feature' key={name}>
                        <li className='rac-multiple-subtitle'>
                            <Icon aria-hidden/>
                            <h4 className='rac-multiple-h4'>{name}:</h4>
                            {desc && <span>{desc}</span>}
                        </li>
                        {sub?.map(text => <li className='rac-multiple-subfeature' key={text}>{text}</li>)}
                    </ul>
                )}
            </div>
            <Table id='multiple-props' title='Multiple props' rows={props} state={state} onChange={update}/>
            <Select
                deleteInline={state.deleteInline}
                deleteAlways={state.deleteAlways}
                value={state.value}
                options={options}
                style={rowStyle}
                onChange={pick}
                icons={icons}
                multiple
            />
        </section>
    )
}

export default Multiple
