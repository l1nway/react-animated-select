import {PersonStanding, Keyboard, Glasses, Smartphone} from 'lucide-react'

const hotkeys = [{
    key: <><kbd>↓</kbd> ArrowDown</>,
    desc: 'Move highlight down'
}, {
    key: <><kbd>↑</kbd> ArrowUp</>,
    desc: 'Move highlight up'
}, {
    key: <><kbd>Enter</kbd> / <kbd>Space</kbd></>,
    desc: <>Select highlighted option<br/> Open focused dropdown</>
}, {
    key: <kbd>Esc</kbd>,
    desc: 'Close dropdown'
}, {
    key: <kbd>Tab</kbd>,
    desc: 'Close dropdown and move focus to next element'
}]

const mapHotkeys = hotkeys.map((hotkey, index) =>
    <div
        className='rac-hotkey-container'
        key={hotkey.desc}
    >
        <div className='rac-hotkey-key'>{hotkey.key}</div>
        <span className='rac-hotkey-desc'>{hotkey.desc}</span>
    </div>
)

const features = [{
    title: 'Accessibility',
    icon: <PersonStanding/>,
    desc: <>Component strictly follows <b>WAI-ARIA</b> patterns: utilizes <code>aria-live</code> regions for status updates and manages ${<code>aria-activedescendant</code>} to announce selected options without moving focus.</>
}, {
    title: 'Screen Reader Support',
    icon: <Glasses/>,
    desc: `The react-animated-select is engineered with inclusivity in mind, ensuring a seamless experience for users relying on assistive technologies or keyboard-only navigation.`
}, {
    title: 'Touch Accessibility',
    icon: <Smartphone/>,
    desc: <>Optimized for mobile UX: <b>Swipe left</b> on any option to reveal action buttons, or use a <b>Long-press</b> in multiple mode to trigger the shake animation and enable batch selection for easy cleanup.</>
}, {
    title: 'Keyboard Navigation',
    icon: <Keyboard/>,
    div: <div className='rac-hotkeys'>{mapHotkeys}</div>
}]

function A11y() {

    return (
        <section
            className='rac-a11y'
            id='a11y'
        >
            {features.map((item, index) =>
                <div
                    className='rac-a11y-container'
                    key={item.title}
                >
                    <div className='rac-a11y-icon'>{item.icon}</div>
                    <h3 className='rac-code-title'>{item.title}</h3>
                    {item.desc
                    ? <p className='rac-states-desc'>{item.desc}</p>
                    : item.div}
                </div>
            )}
        </section>
    )
}

export default A11y