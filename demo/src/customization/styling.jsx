import {LineStyle, SquareArrowDown} from 'lucide-react'
import SlideDown from '../components/slideDown'
import {Select} from 'react-animated-select'
import {useReducer, Fragment} from 'react'

const core = [{
    name: '--rac-base-red',
    value: '#e7000b', 
    desc: 'Base red color used for errors and destructive actions'
}, {
    name: '--rac-base-green',
    value: '#4caf50',
    desc: 'Base green color used for success states'
},
    {name: '--rac-base-yellow', value: '#ffc107', desc: 'Base yellow color used for warnings'},
    {name: '--rac-select-background', value: 'color-mix(in srgb, Canvas 98%, CanvasText 2%)', desc: 'Default background color of the main select trigger' },
    {name: '--rac-select-hover', value: 'color-mix(in srgb, Canvas 95%, CanvasText 5%)', desc: 'Background color of the main select when hovered' },
    {name: '--rac-select-color', value: 'CanvasText', desc: 'Primary text color for the select container' },
    {name: '--rac-select-border', value: '2px solid color-mix(in srgb, Canvas 98%, CanvasText 2%)', desc: 'Border styling for the default select state' },
    {name: '--rac-select-border-error', value: '2px solid color-mix(in srgb, var(--rac-base-red), CanvasText 15%)', desc: 'Border styling when the select is in an error state' },
    {name: '--rac-select-padding', value: '0em 0.5em', desc: 'Internal padding of the main select container' },
    {name: '--rac-select-min-height', value: '2em', desc: 'Minimum height of the select container' },
    {name: '--rac-disabled-opacity', value: '0.75', desc: 'Opacity applied to the component when disabled' },
    {name: '--rac-title-anim-shift', value: '4px', desc: 'Distance the title shifts during entry animations' },
    {name: '--rac-title-anim-entry-ease', value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', desc: 'Easing function for the title entry animation' },
    {name: '--rac-title-font-size', value: '1em', desc: 'Font size of the selected value or placeholder' },
    {name: '--rac-dots-color', value: 'currentColor', desc: 'Color of the loading dots animation' },
    {name: '--rac-dots-gap', value: '3px', desc: 'Spacing between the loading dots' },
    {name: '--rac-dots-padding-left', value: '0.25em', desc: 'Left padding for the loading indicator' },
    {name: '--rac-dots-align', value: 'end', desc: 'Alignment of the loading dots within their container' },
    {name: '--rac-dots-animation-duration', value: '1.4s', desc: 'Total duration of one cycle of the loading dots animation' },
    {name: '--rac-dots-animation-delay-1', value: '0s', desc: 'Animation delay for the first loading dot' },
    {name: '--rac-dots-animation-delay-2', value: '0.2s', desc: 'Animation delay for the second loading dot' },
    {name: '--rac-dots-animation-delay-3', value: '0.4s', desc: 'Animation delay for the third loading dot' },
    {name: '--rac-arrow-height', value: '1em', desc: 'Height of the main dropdown arrow icon' },
    {name: '--rac-arrow-width', value: '1em', desc: 'Width of the main dropdown arrow icon' },
    {name: '--rac-arrow-padding', value: '1px 0 2px', desc: 'Padding adjustment for the main dropdown arrow' },
    {name: '--rac-cancel-height', value: '0.9em', desc: 'Height of the clear/cancel icon' },
    {name: '--rac-cancel-width', value: '0.9em', desc: 'Width of the clear/cancel icon' }
]

const list = [
    { name: '--rac-scroll-color', value: 'color-mix(in srgb, CanvasText 10%, Canvas)', desc: 'Color of the scrollbar thumb' },
    { name: '--rac-scroll-track', value: 'color-mix(in srgb, CanvasText 5%, Canvas)', desc: 'Color of the scrollbar track' },
    { name: '--rac-scroll-padding-top', value: '0.5em', desc: 'Top padding of the scrollable list container' },
    { name: '--rac-scroll-padding-bottom', value: '0.5em', desc: 'Bottom padding of the scrollable list container' },
    { name: '--rac-list-background', value: 'color-mix(in srgb, Canvas 98%, CanvasText 2%)', desc: 'Background color of the dropdown list' },
    { name: '--rac-list-color', value: 'CanvasText', desc: 'Default text color for items in the list' },
    { name: '--rac-list-max-height', value: '250px', desc: 'Maximum height of the dropdown list before scrolling starts' },
    { name: '--rac-option-padding', value: '0.5em', desc: 'Internal padding of a single option' },
    { name: '--rac-option-min-height', value: '1em', desc: 'Minimum height of a single option' },
    { name: '--rac-option-gap', value: '0.5em', desc: 'Gap between elements inside an option (e.g., text and icons)' },
    { name: '--rac-option-hover', value: 'color-mix(in srgb, CanvasText 6%, Canvas)', desc: 'Background color of an option when hovered' },
    { name: '--rac-option-highlight', value: 'color-mix(in srgb, CanvasText 10%, Canvas)', desc: 'Background color of an option when highlighted via keyboard navigation' },
    { name: '--rac-option-selected', value: 'color-mix(in srgb, CanvasText 14%, Canvas)', desc: 'Background color of a selected option' },
    { name: '--rac-disabled-option-color', value: 'color-mix(in srgb, GrayText, CanvasText 20%)', desc: 'Text color of a disabled option' },
    { name: '--rac-invalid-option-color', value: 'color-mix(in srgb, var(--rac-base-red), CanvasText 10%)', desc: 'Text color of an option marked as invalid' },
    { name: '--rac-true-option-color', value: 'color-mix(in srgb, var(--rac-base-green), CanvasText 10%)', desc: 'Text color of an option representing a true/positive state' },
    { name: '--rac-false-option-color', value: 'color-mix(in srgb, var(--rac-base-red), CanvasText 10%)', desc: 'Text color of an option representing a false/negative state' },
    { name: '--rac-warning-option-color', value: 'color-mix(in srgb, var(--rac-base-yellow), CanvasText 10%)', desc: 'Text color of an option representing a warning state' }
]

const advanced = [
    { name: '--rac-group-header-font-size', value: '1.25em', desc: 'Font size of the group header title' },
    { name: '--rac-group-header-font-weight', value: 'bold', desc: 'Font weight of the group header title' },
    { name: '--rac-group-header-min-height', value: '1em', desc: 'Minimum height of the group header' },
    { name: '--rac-group-header-padding', value: '0.5em', desc: 'Padding of the group header' },
    { name: '--rac-group-arrow-height', value: '1em', desc: 'Height of the collapse/expand arrow in groups' },
    { name: '--rac-group-arrow-width', value: '1em', desc: 'Width of the collapse/expand arrow in groups' },
    { name: '--rac-group-arrow-padding', value: '1px 0 2px', desc: 'Padding adjustment for the group arrow' },
    { name: '--rac-group-container-padding-left', value: '1em', desc: 'Left padding for items nested inside a group' },
    { name: '--rac-disabled-group-color', value: 'color-mix(in srgb, GrayText, CanvasText 20%)', desc: 'Text color of a disabled group header' },
    { name: '--rac-multiple-selected-border', value: '0.1em solid gray', desc: 'Border of a selected tag in multiple mode' },
    { name: '--rac-multiple-selected-radius', value: '5px', desc: 'Border radius of a selected tag in multiple mode' },
    { name: '--rac-checkbox-border', value: '1px solid gray', desc: 'Border of the checkbox element' },
    { name: '--rac-multiple-selected-padding', value: '0em 0.25em', desc: 'Internal padding of a selected tag' },
    { name: '--rac-multiple-selected-margin', value: '0.25em 0.5em 0.25em 0', desc: 'Outer margin around a selected tag' },
    { name: '--rac-multiple-selected-gap', value: '0.5em 0', desc: 'Gap between tags in multiple selection mode' },
    { name: '--rac-multiple-deleting-bg', value: 'color-mix(in srgb, var(--rac-base-red) 15%, Canvas)', desc: 'Background of a tag when marked for deletion' },
    { name: '--rac-checkbox-margin-right', value: '0.20em', desc: 'Right margin of the checkbox, spacing it from text' },
    { name: '--rac-multiple-selected-min-height', value: '1.5em', desc: 'Minimum height of a selected tag' },
    { name: '--rac-checkbox-size', value: 'var(--rac-option-min-height)', desc: 'Size (width and height) of the checkbox' },
    { name: '--rac-multiple-del-bg', value: 'color-mix(in srgb, var(--rac-base-red) 30%, Canvas)', desc: 'Background of the tag delete button' },
    { name: '--rac-multiple-del-hover-color', value: 'var(--rac-base-red)', desc: 'Color of the delete button when hovered' }
]

const tables = [{
    name: 'Core variables',
    opened: false,
    element: core
}, {
    name: 'List variables',
    opened: false,
    element: list,
}, {
    name: 'Advanced variables',
    element: advanced,
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
            <p className='rac-states-desc'>Unlock limitless styling with a comprehensive set of CSS variables covering every micro-interaction. From core colors to precise animation timings, flexible architecture allows you to seamlessly integrate the component into any design system with minimal effort.</p>
            <div className='rac-styling'>
                {tables.map((table, index) =>
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