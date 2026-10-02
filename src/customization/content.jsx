import {LayoutList, DollarSign, Euro, PoundSterling, JapaneseYen, SwissFranc, IndianRupee, Bitcoin} from 'lucide-react'
import {Select, Option, defineOption} from 'react-animated-select'
import {useCallback, useReducer} from 'react'
import {snippet} from '../components/tokens'
import {merge, arrowIcons, Title} from '../components/helpers'
import {Showcase, Toggle} from './showcase'
import './content.css'

// demo data
const currencies = [
    {id: 'usd', name: 'US Dollar', icon: DollarSign, color: '#4ade80'},
    {id: 'eur', name: 'Euro', icon: Euro, color: '#60a5fa'},
    {id: 'gbp', name: 'British Pound', icon: PoundSterling, color: '#c084fc'},
    {id: 'jpy', name: 'Japanese Yen', icon: JapaneseYen, color: '#f87171'},
    {id: 'chf', name: 'Swiss Franc', icon: SwissFranc, color: '#fb923c'},
    {id: 'inr', name: 'Indian Rupee', icon: IndianRupee, color: '#facc15'},
    {id: 'btc', name: 'Bitcoin', icon: Bitcoin, color: '#9ca3af', disabled: true}
]

const Currency = ({c, disabled}) =>
    <span className='rac-content-currency'>
        <c.icon className='rac-content-icon' color={c.color} aria-hidden='true'/>
        <span className='rac-content-name'>{c.name}</span>
        <small className='rac-content-code'>{disabled ? 'soon' : c.id.toUpperCase()}</small>
    </span>

const renderCurrency = (c, {disabled}) => <Currency c={c} disabled={disabled}/>

const CurrencyOption = defineOption(({c}) =>
    <Option value={c.id} label={c.name} disabled={c.disabled} style={{'--accent': c.color}}>
        <Currency c={c} disabled={c.disabled}/>
    </Option>
)

const CHILDREN = currencies.map(c => <CurrencyOption key={c.id} c={c}/>)
const FLAGS = [{name: 'multiple'}, {name: 'valueAsOption', note: 'title and chips render the row'}]

const TABS = [{
    id: 'render',
    text: 'renderOption',
    codes: [snippet`const Currency = ({c, disabled}) =>
  <span className='currency'>
    <c.icon color={c.color} aria-hidden='true'/>
    {c.name}
    <small>{disabled ? 'soon' : c.id.toUpperCase()}</small>
  </span>

// module scope or useCallback: a stable function
const renderCurrency = (c, {disabled}) => <Currency c={c} disabled={disabled}/>

<Select
  options={currencies}
  renderOption={renderCurrency}
  valueAsOption
/>`]
}, {
    id: 'define',
    text: 'defineOption',
    codes: [snippet`import {Select, Option, defineOption} from 'react-animated-select'

// module level; a pure render function, no hooks
const CurrencyOption = defineOption(({c}) =>
  <Option value={c.id} label={c.name} disabled={c.disabled} style={{'--accent': c.color}}>
    <Currency c={c} disabled={c.disabled}/>
  </Option>
)

<Select valueAsOption>
  {currencies.map(c => <CurrencyOption key={c.id} c={c}/>)}
</Select>

// with valueAsOption the option's style moves onto the chip:
// .rac-chip {background: color-mix(in srgb, var(--accent) 20%, var(--rac-tint-2))}`]
}]

const title = <Title icon={<LayoutList/>}>Custom Options</Title>

const desc = <>Rows can hold any content. For array data, <code>renderOption(item, {'{selected, disabled}'})</code> draws each row from the original item. For JSX, <code>defineOption</code> turns a render function into a reusable option component, so <code>{'currencies.map(c => <CurrencyOption c={c}/>)'}</code> works where an ordinary wrapper would be ignored (it is ignored with a dev warning), on the server too; declare it at module level and keep hooks in the content it renders. By default the title and the chips show only the option's text, so a heavy row never breaks the trigger: it reads <code>label</code>, <code>name</code> or the strings inside the JSX (text inside a component or an image is not found, so give such options a <code>label</code>; an option with no text shows <code>texts.emptyOption</code>). <code>valueAsOption</code> renders the option's own content there instead, the same content or the text, never different JSX. Per-option <code>className</code> and <code>style</code> come from <code>{'<Option/>'}</code> and move onto the chip and the title; the checkbox and the row states stay in the list. Keep rich content decorative and light: buttons or links inside fight the chip's own click, swipe and long press. <code>options</code> can also be a dictionary, <code>{'{usd: {…}, eur: {…}}'}</code>: every value becomes an option, the keys are not used.</>

function Content() {
    const [state, dispatch] = useReducer(merge, {tab: 0, value: null, multiple: false, valueAsOption: false})
    const array = state.tab === 0

    const pick = useCallback(tab => dispatch({tab, value: null}), [])
    const setValue = useCallback(value => dispatch({value}), [])
    const toggle = useCallback((name, on) => dispatch(name === 'multiple' ? {multiple: on, value: null} : {[name]: on}), [])

    return (
        <section className='rac-states rac-content-section' id='content'>
            <Showcase id='content' label='Custom rows' tabs={TABS} active={state.tab} onPick={pick} codes={TABS[state.tab].codes} title={title} desc={desc}>
                <div className='rac-showcase-stage'>
                    <Select
                        className='rac-content-select'
                        renderOption={array ? renderCurrency : undefined}
                        options={array ? currencies : undefined}
                        valueAsOption={state.valueAsOption}
                        placeholder='Choose currency'
                        multiple={state.multiple}
                        value={state.value}
                        onChange={setValue}
                        icons={arrowIcons}
                    >
                        {array ? null : CHILDREN}
                    </Select>
                    <div className='rac-showcase-toggles'>
                        {FLAGS.map(item => <Toggle key={item.name} name={item.name} note={item.note} checked={state[item.name]} onChange={toggle}/>)}
                    </div>
                </div>
            </Showcase>
        </section>
    )
}

export default Content
