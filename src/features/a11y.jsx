import {PersonStanding, Keyboard, Glasses, Smartphone, Zap} from 'lucide-react'
import {Select} from 'react-animated-select'
import {Table} from '../components/section'
import {arrowIcons, numbered} from '../components/helpers'
import {Track, Card} from '../components/track'
import './a11y.css'

// demo data
const options = numbered(20)

const hotkeys = [
    [<kbd>Tab</kbd>, 'Focus opens the list; Tab again closes it and moves on'],
    [<><kbd>↓</kbd> <kbd>↑</kbd></>, 'Move the highlight, skipping disabled options and collapsed groups'],
    [<><kbd>PgDn</kbd> <kbd>PgUp</kbd></>, 'Jump ten options down or up'],
    [<><kbd>Home</kbd> <kbd>End</kbd></>, 'Go to the first or the last option'],
    [<><kbd>Enter</kbd> <kbd>Space</kbd></>, 'Open the list, select the highlighted option, open or close a group'],
    [<kbd>A–Z</kbd>, 'Typeahead: jump to the next option that starts with the typed letters'],
    [<kbd>Esc</kbd>, 'Leave touch delete mode or close the list; a surrounding modal stays open'],
    [<kbd>Delete</kbd>, 'Clear the value'],
    [<kbd>Backspace</kbd>, 'Remove the last chip, or clear a single value']
]

const columns = [[Keyboard, 'Key'], [Zap, 'Action']]

// [DOC: hotkeys-table]
const keys = (
    <Table id='a11y-keys' title='Keyboard shortcuts' columns={columns} region={false} className='rac-a11y-keys'>
        {hotkeys.map(([key, desc]) =>
            <tr key={desc}>
                <th scope='row'>{key}</th>
                <td>{desc}</td>
            </tr>
        )}
    </Table>
)

const features = [{
    title: 'Accessibility',
    icon: <PersonStanding/>,
    desc: <>Built on the <b>WAI-ARIA</b> select-only combobox pattern. Focus never leaves the combobox: <code>aria-activedescendant</code> points at the highlighted option, so a screen reader follows the highlight, while the list lives in a portal linked by <code>aria-controls</code>. Changes outside the list, like removing a chip, are not announced yet: there is no live region.</>
}, {
    title: 'Screen Reader Support',
    icon: <Glasses/>,
    desc: <>The trigger is a <code>combobox</code> with <code>aria-expanded</code>, <code>aria-busy</code> and <code>aria-required</code>. The <code>listbox</code> holds options with <code>aria-selected</code> and <code>aria-disabled</code>, in groups labelled by their headers. Clear and chip delete are real named buttons. Name the Select with <code>aria-label</code> or <code>aria-labelledby</code>: a <code>{'<label htmlFor>'}</code> cannot, the root is a <code>div</code>.</>
}, {
    title: 'Touch Accessibility',
    icon: <Smartphone/>,
    desc: <>Chips of a multiple Select answer to touch. <b>Swipe left</b> on a chip to reveal its delete button. <b>Long-press</b> a chip to enter delete mode: every chip shakes, a tap removes one, and the phone vibrates where the browser allows it. A tap on the field, <kbd>Esc</kbd> or leaving the Select ends the mode. A vertical swipe on a chip still scrolls the page.</>
}, {
    title: 'Keyboard Navigation',
    icon: <Keyboard/>,
    desc: <>Every action has a key, like in a native select. Tab into the Select under the shortcut table and try them: the arrows move the highlight, <kbd>PgDn</kbd> and <kbd>PgUp</kbd> jump ten options, <kbd>Enter</kbd> picks one and <kbd>Backspace</kbd> removes the last chip. Focus opens the list and Tab closes it, so the page never needs a mouse.</>
}]

function A11y() {
    return (
        <section className='rac-a11y' id='a11y'>
            <Track label='Accessibility features'>
                {features.map(item => <Card key={item.title} {...item}/>)}
            </Track>
            {keys}
            <Select placeholder='Pick options' aria-label='Keyboard demo' options={options} icons={arrowIcons} multiple/>
        </section>
    )
}

export default A11y
