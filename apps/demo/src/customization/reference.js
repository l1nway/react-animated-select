import {Variable, Palette, Hash, Box, Tag, FileText, ChevronUp, ChevronsUp, Eraser, X, Sparkles} from 'lucide-react'
import {snippet} from '../components/tokens'
import basic from '../components/basic.css?snippet'

// theme presets
export const PRESETS = [{
    id: 'site',
    text: 'As styled',
    props: {icons: {arrow: ChevronUp}},
    codes: [snippet`import {ChevronUp} from 'lucide-react'
import './basic.css'

// the look of every Select on this site, no class needed
<Select icons={{arrow: ChevronUp}} options={cities}/>`, basic]
}, {
    id: 'default',
    text: 'Default',
    // [DOC: bare-preset]
    props: {className: 'rac-preset rac-bare', optionsClassName: 'rac-preset rac-bare'},
    codes: [snippet`// no class, no style, no icons: the built-in neutral theme
<Select options={cities}/>`, snippet.css`/* no CSS: only the library's own styles */`]
}, {
    id: 'aurora',
    text: 'Aurora',
    props: {
        // [DOC: preset-isolation]
        className: 'aurora rac-preset', optionsClassName: 'aurora rac-preset', placeholder: 'Pick a destination', style: {'--rac-list-max-height': '12em'},
        icons: {arrow: ChevronsUp, clear: Eraser, remove: X, check: Sparkles},
        texts: {loading: 'Charting routes', error: 'Signal lost', disabled: 'Locked', clear: 'Reset', remove: 'Drop'},
        duration: 450, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', offset: 8
    },
    codes: [snippet`import {ChevronsUp, Eraser, X, Sparkles} from 'lucide-react'

const icons = {arrow: ChevronsUp, clear: Eraser, remove: X, check: Sparkles}
const texts = {loading: 'Charting routes', error: 'Signal lost', disabled: 'Locked', clear: 'Reset', remove: 'Drop'}

// every knob at once: classes, variables, icons, texts, motion
<Select
  className='aurora'
  optionsClassName='aurora'
  placeholder='Pick a destination'
  style={{'--rac-list-max-height': '12em'}}
  icons={icons}
  texts={texts}
  duration={450}
  easing='cubic-bezier(0.34, 1.56, 0.64, 1)'
  offset={8}
  options={cities}
/>`, snippet.css`.aurora {--rac-bg: #110d24; --rac-fg: #ece6ff; --rac-danger: #ff4d8d; --rac-row: 2.5em; font-family: 'Trebuchet MS', system-ui, sans-serif;}
.rac-select.aurora {--ring: linear-gradient(120deg, #8b5cf6, #ec4899, #22d3ee); border: 2px solid transparent; border-radius: 1.25em; padding-inline: 1em 0.75em; background: linear-gradient(var(--rac-bg) 0 0) padding-box, var(--ring) border-box; transition: box-shadow 400ms, opacity 400ms, filter 400ms;}
.rac-select.aurora:not([aria-disabled='true']):hover {box-shadow: 0 0 22px -6px #ec4899;}
.rac-select.aurora[aria-expanded='true'] {box-shadow: 0 0 0 4px #8b5cf633, 0 0 28px -6px #8b5cf6;}
.rac-select.aurora[data-error] {--ring: linear-gradient(var(--rac-danger) 0 0);}
.rac-select.aurora[aria-disabled='true'] {--ring: linear-gradient(#4b4566 0 0); filter: grayscale(1); opacity: 0.6;}
.rac-select.aurora[aria-busy='true']::after {background-image: linear-gradient(90deg, transparent, #22d3ee, #ec4899, transparent);}
.rac-select.aurora[data-empty] .rac-title {font-style: italic; opacity: 0.55;}
.rac-select.aurora .rac-arrow {color: #ec4899;}
.rac-select.aurora .rac-clear:hover {color: var(--rac-danger);}
.aurora .rac-chip {border-radius: 999px; padding-inline: 0.7em 0.4em; background: linear-gradient(120deg, #8b5cf640, #ec489940); box-shadow: inset 0 0 0 1px #ec489966;}
.aurora .rac-chip:hover {box-shadow: inset 0 0 0 1px #ec4899;}
.aurora .rac-chip-del {border-radius: 0 999px 999px 0; padding-inline: 0.2em;}
.rac-select.aurora[data-deleting] .rac-chip {background: #ff4d8d33;}
.rac-options.aurora {--rac-radius: 1em; outline: 1px solid #8b5cf655; outline-offset: -1px;}
.rac-options.aurora .rac-list {padding: 0.35em; scrollbar-color: #ec4899 transparent;}
.aurora .rac-option {border-radius: 0.7em; padding-inline: 0.8em; transition: background-color 150ms, translate 250ms cubic-bezier(0.34, 1.56, 0.64, 1);}
.aurora .rac-option[data-highlighted] {background-image: linear-gradient(90deg, #ec489933, transparent 80%); translate: 0.25em 0;}
.aurora .rac-option[aria-selected='true'] {color: #f9a8d4; font-weight: 600;}
.aurora .rac-check[data-default] {border-color: #ec4899; border-radius: 0.35em;}
.aurora .rac-checkmark {color: #22d3ee;}`]
}]

const inputs = [
    {name: '--rac-bg', value: 'color-mix(in srgb, Canvas 98%, CanvasText 2%)', desc: 'Trigger and panel background, trigger border; the base of every tint'},
    {name: '--rac-fg', value: 'CanvasText', desc: 'Trigger and panel text; the color of every tint'},
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

const classes = [
    {name: '.rac-select', value: 'div[role=combobox]', desc: 'The root: border, background, padding. Gets className and style, carries every state attribute'},
    {name: '.rac-value', depth: 1, value: 'div', desc: 'The value area: a wrapping row with the title or the chips; its min-height is --rac-row'},
    {name: '.rac-title', depth: 2, value: 'div', desc: 'Placeholder, selected label or state text; one line with an ellipsis'},
    {name: '.rac-dots', depth: 3, value: 'span > i×3', desc: 'Loading dots after the title and in loading rows; currentColor'},
    {name: '.rac-chip', depth: 2, value: 'div', desc: 'One selected value in multiple mode; with valueAsOption it also gets the option\'s className and style'},
    {name: '.rac-chip-text', depth: 3, value: 'span', desc: 'The chip label (not with valueAsOption)'},
    {name: '.rac-chip-del', depth: 3, value: 'button', desc: 'The chip delete button (icons.remove), labelled by texts.remove and the name'},
    {name: '.rac-clear', depth: 1, value: 'button', desc: 'The clear button (icons.clear), labelled by texts.clear'},
    {name: '.rac-arrow', depth: 1, value: 'div', desc: 'The arrow wrapper (icons.arrow), rotated by CSS from the root state'},
    {name: '.rac-options', value: 'div (portal)', desc: 'The floating panel in document.body: background, color, radius. Gets optionsClassName and the --* keys of style'},
    {name: '.rac-list', depth: 1, value: 'div[role=listbox]', desc: 'The scrolling list: max-height from --rac-list-max-height, scrollbar. Shape it (radius, padding, outline) only together with .rac-options'},
    {name: '.rac-option', depth: 2, value: 'div[role=option]', desc: 'One row: padding, highlight and selected tints (no :hover rule, the pointer sets the highlight)'},
    {name: '.rac-option-text', depth: 3, value: 'span', desc: 'The text label of a row'},
    {name: '.rac-option-jsx', depth: 3, value: 'div', desc: 'Custom row content (<Option> children, renderOption); also wraps chip content with valueAsOption'},
    {name: '.rac-check', depth: 3, value: 'div', desc: 'The row checkbox in multiple mode; the built-in frame has data-default'},
    {name: '.rac-checkmark', depth: 4, value: 'icon', desc: 'icons.check, fades and scales in on selected rows; a custom icons.checkbox is .rac-check-icon'},
    {name: '.rac-group', depth: 2, value: 'div', desc: 'A group header; click, Enter or Space toggles it'},
    {name: '.rac-group-text', depth: 3, value: 'span', desc: 'The group name'},
    {name: '.rac-group-arrow', depth: 3, value: 'div', desc: 'The group arrow (icons.arrow), rotated while the group is open'},
    {name: '.rac-group-items', depth: 2, value: 'div[role=group]', desc: 'The collapsible container of a group\'s options, indented'},
    {name: '.rac-icon', value: 'img', desc: 'Any icon passed as a URL, 1em high'},
    {name: 'internal', value: 'rac-chip-slot, rac-spacer, rac-input', desc: 'Layout and form internals: style .rac-chip and .rac-value instead'}
]

const states = [
    {name: '[aria-expanded=\'true\']', value: '.rac-select', desc: 'The panel is open'},
    {name: '[aria-disabled=\'true\']', value: '.rac-select', desc: 'disabled, or no options: dimmed, not-allowed cursor, no hover'},
    {name: '[aria-busy=\'true\']', value: '.rac-select', desc: 'loading or a pending loadMore: the busy stripe (::after), still interactive'},
    {name: '[data-error]', value: '.rac-select', desc: 'error: red border, kept on hover'},
    {name: '[data-empty]', value: '.rac-select', desc: 'No value: the title shows the placeholder or a state text'},
    {name: '[data-placement]', value: '.rac-select, .rac-options', desc: '\'top\' or \'bottom\': the side the panel opens on, known before it opens'},
    {name: '[data-deleting]', value: '.rac-select', desc: 'Touch delete mode: chips shake and show their delete buttons; the clear button and the arrow collapse in place and the chips take over their width'},
    {name: '[data-inline-delete]', value: '.rac-select', desc: 'deleteInline: delete buttons sit inside the chip'},
    {name: '[data-bool]', value: '.rac-title, .rac-option', desc: '\'true\' or \'false\': a boolean value, green or red'},
    {name: '[aria-selected=\'true\']', value: '.rac-option', desc: 'Selected; with data-highlighted a stronger tint'},
    {name: '[aria-disabled=\'true\']', value: '.rac-option', desc: 'Disabled or loading: muted, not-allowed cursor'},
    {name: '[data-highlighted]', value: '.rac-option, .rac-group', desc: 'Keyboard or pointer highlight'},
    {name: '[data-invalid]', value: '.rac-option', desc: 'A value that could not become a valid option'},
    {name: '[data-loading]', value: '.rac-option', desc: 'The load more row and the loading footer'},
    {name: '[data-error]', value: '.rac-option', desc: 'The error row at the end of the list'},
    {name: '[data-default]', value: '.rac-check', desc: 'No custom icons.checkbox: the built-in frame is drawn'},
    {name: '[data-open]', value: '.rac-group', desc: 'The group is expanded'},
    {name: '[data-disabled]', value: '.rac-group', desc: 'The group is disabled'}
]

const desc = [FileText, 'Description']
const vars = [[Variable, 'Variable'], [Palette, 'Default'], desc]

export const TABLES = [
    {id: 'inputs', name: 'Input variables', columns: vars, element: inputs},
    {id: 'derived', name: 'Derived variables', columns: vars, element: derived},
    {id: 'props', name: 'Prop variables', columns: vars, element: fromProps},
    {id: 'classes', name: 'Classes', columns: [[Hash, 'Class'], [Box, 'Element'], desc], element: classes},
    {id: 'states', name: 'State attributes', columns: [[Tag, 'Attribute'], [Box, 'Set on'], desc], element: states}
]
