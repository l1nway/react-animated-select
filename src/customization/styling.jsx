import {LineStyle, SquareArrowDown} from 'lucide-react'
import SlideDown from '../components/slideDown'
import {Select} from 'react-animated-select'
import {useReducer, Fragment} from 'react'

const inputs = [
    {name: '--rac-bg', value: 'color-mix(in srgb, Canvas 98%, CanvasText 2%)', desc: 'Trigger and list background, trigger border; the base of every tint'},
    {name: '--rac-fg', value: 'CanvasText', desc: 'Trigger and list text; the color of every tint'},
    {name: '--rac-danger', value: '#e7000b', desc: 'Error border and error row, false values, invalid options, chip delete colors, delete mode'},
    {name: '--rac-success', value: '#4caf50', desc: 'Color of true values'},
    {name: '--rac-row', value: '2em', desc: 'Height of one row of the value area; chips are sized from it'},
    {name: '--rac-list-max-height', value: '250px', desc: 'List height limit in any length unit; also read by JS to decide whether the panel opens upward'}
]

const derived = [
    {name: '--rac-tint-1', value: 'color-mix(in srgb, var(--rac-fg) 5%, var(--rac-bg))', desc: 'Trigger hover, scrollbar track'},
    {name: '--rac-tint-2', value: 'color-mix(in srgb, var(--rac-fg) 10%, var(--rac-bg))', desc: 'Chips, highlighted option, scrollbar thumb'},
    {name: '--rac-tint-3', value: 'color-mix(in srgb, var(--rac-fg) 20%, var(--rac-bg))', desc: 'Selected option, hovered chip'},
    {name: '--rac-muted', value: 'color-mix(in srgb, var(--rac-fg) 55%, var(--rac-bg))', desc: 'Disabled and loading options, disabled groups, the checkbox frame, the busy stripe'},
    {name: '--rac-duration-fast', value: 'calc(var(--rac-duration) * 0.5)', desc: 'Chip and option background transitions'}
]

const fromProps = [
    {name: '--rac-duration', value: '300ms', desc: 'Set by the duration prop. Every CSS transition; 1ms under prefers-reduced-motion'},
    {name: '--rac-ease', value: 'ease', desc: 'Set by the easing prop. Every CSS transition'}
]

const tables = [{
    name: 'Input variables',
    opened: false,
    element: inputs
}, {
    name: 'Derived variables',
    opened: false,
    element: derived,
}, {
    name: 'Prop variables',
    element: fromProps,
    opened: false
}]

function Styling() {
    const [openSections, dispatch] = useReducer((state, name) => ({ ...state, [name]: !state[name] }), {})

    return (
        <section
            className='rac-states'
            style={{margin: 0}}
            id='styling'
        >
            <div className='rac-code-title-container'>
                <div className='rac-code-icon'>
                    <LineStyle/>
                </div>
                <h3 className='rac-code-title'>
                    Styling & Variables
                </h3>
            </div>
            <p className='rac-states-desc'>All library styles live in @layer rac, so plain CSS on the rac-* classes wins without !important. Only shared values are variables: set --rac-fg and --rac-bg, and every hover, highlight, selection and chip tint follows. Everything else is a plain property on its class. The options panel is a portal, so the --* keys of the Select's style prop are copied onto it.</p>
            <div className='rac-styling'>
                {tables.map(table =>
                    <Fragment key={table.name}>
                        <label
                            style={{
                                paddingBottom: openSections[table.name] ? '0' : '1em',
                                borderColor: openSections[table.name] ? 'transparent' : ''
                            }}
                            onClick={() => dispatch(table.name)}
                            className='rac-styling-label'
                        >
                            <h4 className='rac-styling-maintitle'>{table.name}</h4>
                            <SquareArrowDown
                                className='rac-styling-icon'
                                style={{transform: openSections[table.name] ? 'rotate(-180deg)' : ''}}
                            />
                        </label>
                        <SlideDown
                            visibility={openSections[table.name]}
                            className='rac-styling-container'
                            easing='ease-in'
                            duration={500}
                        >
                            {table.element.map((item) =>
                                <div className='rac-styling-item' key={item.name}>
                                    <h4 className='rac-styling-title'>{item.name}</h4>
                                    <span className='rac-styling-value' style={{color: item.value}}>{item.value}</span>
                                    <span className='rac-styling-desc'>{item.desc}</span>
                                </div>
                            )}
                        </SlideDown>
                    </Fragment>
                )}
            </div>
            {/* <Select
                optionsClassName='rac-basic-options'
                className='rac-basic-select'
            /> */}
        </section>
    )
}

export default Styling