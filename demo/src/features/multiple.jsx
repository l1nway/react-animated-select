import {FileStack, Scan, Check, LineSquiggle, FingerprintPattern, Folders, ChevronDown} from 'lucide-react'
import {Select} from 'react-animated-select'
import {useMemo, useState} from 'react'

const options = ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5', 'Option 6', 'Option 7', 'Option 8', 'Option 9', 'Option 10', 'Option 11', 'Option 12', 'Option 13', 'Option 14', 'Option 15', 'Option 16', 'Option 17', 'Option 18', 'Option 19', 'Option 20']

const features = [{
    name: 'Multi-Selection with Chips',
    icon: <Folders style={{minWidth: '1.5em'}}/>,
    desc: 'Supports selecting multiple values, rendered as interactive Chips (Badges) for clear visual feedback.'
}, {
    name: 'Gesture & Touch Controls',
    icon: <LineSquiggle style={{minWidth: '1.5em'}}/>,
    sub: [{
        name: 'Long Press (Haptic Entry)',
        desc: 'Long-pressing a chip activates "Deletion Mode", allowing for quick tap-to-remove actions.'
    }, {
        name: 'Swipe-to-Delete',
        desc: 'Supports mobile-native swipe-left gestures on individual chips to reveal a hidden delete icon.'
    }]
}, {
    name: 'Optimized for Touch',
    icon: <FingerprintPattern style={{minWidth: '1.5em'}}/>,
    desc: 'Designed with high-precision hit targets for seamless interaction on mobile and tablet devices.'
}]

function Multiple() {
    const [value, setValue] = useState()
    const [inline, setInline] = useState(false)
    const [show, setShow] = useState(false)
    
    const props = useMemo(() => [{
        name: 'showDelete',
        desc: 'Keep the delete icon permanently visible instead of showing it only on interaction.',
        onChange: setShow,
        value: show
    }, {
        name: 'deleteInline',
        desc: 'Render the delete button as a physical element in the layout to prevent overlapping the option text.',
        onChange: setInline,
        value: inline
    }], [inline, show])

    return (
        <section
            className='rac-multiple'
            id='multiple'
        >
            <div className='rac-code-title-container'>
                <div className='rac-code-icon'>
                    <FileStack/>
                </div>
                <h3 className='rac-code-title'>
                    Multiple Options
                </h3>
            </div>
            <div className='rac-multiple-desc'>
                {features.map((feature, index) =>
                    <ul
                        className='rac-multiple-feature'
                        key={feature.name}
                    >
                        <li
                            style={{paddingBottom: feature?.sub ? '0.5em' : ''}}
                            className='rac-multiple-subtitle'
                        >
                            {feature.icon}
                            <h4 className='rac-multiple-h4'>{feature.name}:</h4>
                            <span style={{gridColumn: '1 / -1'}}>{feature.desc}</span>
                        </li>
                        {feature?.sub?.map((item, index) =>
                            <li className='rac-multiple-subfeature' key={item.name}>
                                {item.desc}
                            </li>
                        )}
                    </ul>
                )}
            </div>
            <div
                className='rac-group-checkbox'
                style={{marginBottom: '1em'}}
            >
                {props.map((item, index) =>
                    <label
                        className='rac-children-first'
                        key={item.name}
                    >
                        <div className='rac-checkbox-container'>
                            <input
                                onChange={(e) => item.onChange(e.target.checked)}
                                className='rac-demo-checkbox'
                                checked={item.value}
                                type='checkbox'
                            />
                            <Scan
                                style={{left: 0, top: '-0.8em'}}
                                className='rac-check-box'/>
                            <Check
                                className={`rac-check-mark ${item.value ? '--checked' : ''}`}
                                style={{top: '-0.55em', left: '0.15em'}}
                            />
                        </div>
                        <h4 className='rac-child-title'>{item.name}</h4>
                        <span style={{textWrap: 'nowrap'}}>{item.desc}</span>
                    </label>
                )}
            </div>
            <Select
                Checkmark={<Check style={{left: '-1.4em', color: '#c084fc'}}/>}
                style={{'--rac-select-min-height': '2.5rem'}}
                optionsClassName='rac-basic-options'
                className='rac-basic-select'
                OpenIcon={<ChevronDown/>}
                deleteInline={inline}
                onChange={setValue}
                Checkbox={<Scan/>}
                showDelete={show}
                options={options}
                value={value}
                multiple
            />
        </section>
    )
}

export default Multiple