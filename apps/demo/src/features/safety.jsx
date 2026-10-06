import {ShieldCogCorner, Plus, Trash, X} from 'lucide-react'
import {Select} from 'react-animated-select'
import {arrowIcons, Title} from '../components/helpers'
import {CHIPS} from '../components/chips'
import {Tick} from '../components/section'
import {Segmented} from '../components/segmented'
import {Collapse} from '@l1nway/collapse'
import {useSafety} from './useSafety'
import '../plugins/multiple.css'
import './safety.css'

const PRESETS = [{text: 'broken values', value: 'shapes'}, {text: 'duplicates', value: 'duplicates'}]

// [DOC: safety-list]
const LIST_ICONS = {remove: <Trash className='rac-safety-delete' aria-hidden='true'/>, clear: <X className='rac-safety-x' aria-hidden='true'/>}
const LIST_TEXTS = {clear: 'Remove all options'}

function Safety() {
    const {state, options, children, keys, chips, addOption, edit, load, prune, toggle, change, inputRef} = useSafety()
    const {list, option, value, preset, multiple} = state
    return (
        <section className='rac-multiple' id='safety'>
            <Title icon={<ShieldCogCorner/>}>Safety</Title>
            <p className='rac-desc rac-multiple-desc rac-safety-desc'>
                This developer-first component is engineered for seamless integration and maximum runtime resilience, ensuring the application remains stable even when encountering malformed data. It features a robust error-handling layer that prevents crashes by gracefully processing invalid inputs; whether passed as numbers, strings, booleans, dates, class instances, circular objects or objects missing standard name/label or id/value keys, the Select will attempt to parse and render them. Even in extreme cases where unsupported types like functions are provided as options, the component shows a safe "Invalid option" row (texts.invalidOption) rather than breaking the render cycle.
            </p>
            <p className='rac-desc rac-multiple-desc rac-safety-desc'>
                Duplicates stay separate options too: 1, 1, 1, true ×3, equal strings, NaN, equal objects and two {'<Option/>'} with the same id. A click selects exactly the row you clicked, unchecking removes exactly that row and its chip; null, undefined and '' become disabled placeholders. Remove every option with ×: the value stays on screen and its chips keep their place without replaying their animation. Load the same set again and the value lands back on its rows. The limit: value and onChange cannot tell equal duplicates apart, and once the list itself changes, equal primitives are matched by position. Give duplicates distinct ids when your code needs to know which one was picked.
            </p>
            <div className='rac-safety-settings'>
                <label className='rac-safety-flag'>
                    <Tick onChange={e => toggle(e.target.checked)} checked={multiple}/>
                    <span><span className='rac-safety-name'>multiple</span> shows the value as chips.</span>
                </label>
                <Segmented id='safety-preset' label='Option set' items={PRESETS} value={preset} onPick={load}/>
            </div>
            <Collapse in={list.length > 0}>
                <Select aria-label='Options' popup={false} plugins={CHIPS} multiple deleteAlways deleteInline valueAsOption icons={LIST_ICONS} texts={LIST_TEXTS} value={keys} onChange={prune}>
                    {chips}
                </Select>
            </Collapse>
            <form className='rac-safety-interactive' onSubmit={addOption}>
                <h4>Try it yourself!</h4>
                <div className='rac-safety-add' data-value={option}>
                    <input className='rac-safety-input' aria-label='Option as a JS literal' onChange={edit} ref={inputRef} value={option} type='text'/>
                    <button className='rac-btn-bare rac-safety-button' aria-label='Add option' type='submit'>
                        <Plus className='rac-safety-plus' aria-hidden='true'/>
                    </button>
                </div>
            </form>
            <Select plugins={CHIPS} multiple={multiple} onChange={change} options={options} icons={arrowIcons} value={value}>
                {children}
            </Select>
        </section>
    )
}

export default Safety
