import {PanelsTopLeft} from 'lucide-react'
import {Heading} from '../components/helpers'

// section text
const desc = <>The options panel is a <code>position: fixed</code> portal into <code>document.body</code>, so no parent can clip it or hide it under another stacking context: cards, tables, scroll containers. It opens upward when there is no room below and more room above, and the arrow turns before the list even opens. The trigger and the panel both carry <code>data-placement</code> (<code>'top'</code> or <code>'bottom'</code>), so the panel can be styled by side.</>
const BLOCKS = [
    ['Modals and focus traps', <>Modals and focus traps (Radix, MUI, Headless UI) treat a click in <code>document.body</code> outside their content as an outside click and close. Pass the modal's element as <code>container</code> and the panel lives inside it. A <code>transform</code> on that element makes <code>position: fixed</code> relative to it; the Select checks where the panel really landed and corrects it. The <code>--*</code> keys of <code>style</code> are copied onto the panel, so one place themes both: <code>--rac-list-max-height</code> limits the list and the up/down decision. Not compensated: a scaled container (<code>scale</code>, <code>zoom</code>).</>],
    ['Grows with its content, truncates at the limit', <>The Select is never wider than its container. Where the layout sizes it by content (a flex toolbar, an <code>auto</code> grid column, <code>width: fit-content</code>), it grows with the chosen title and with every chip, and the chip rows are computed for the width it grows to, so chips never jump to a new row and back. At the limit, the title and any chip wider than the row are cut with an ellipsis. With a fixed width it simply truncates. With the chip delete button <code>inline</code> (<code>deleteInline</code>), hovering a chip in a content-sized Select widens it by one button. A wrapper that shrinks to fit without being a flex or grid parent (<code>inline-block</code>, a float) needs <code>max-width: 100%</code>; rich content (<code>valueAsOption</code>) is clipped, not ellipsized; the ellipsis appears once an animation ends.</>]
]

function Layout() {
    return (
        <section className='rac-states' id='layout'>
            <Heading icon={<PanelsTopLeft/>} title='Layout & Portal' desc={desc}/>
            {BLOCKS.map(([title, text]) => (
                <div key={title}>
                    <h4>{title}</h4>
                    <p className='rac-group-desc'>{text}</p>
                </div>
            ))}
        </section>
    )
}

export default Layout
