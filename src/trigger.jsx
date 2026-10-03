import {SelectConfigContext, SelectActionsContext, SelectStateContext} from './state'
import {renderIcon, stopEvent, refocus, optionDomId, optionContent, flag, dots, withClass} from './utils'
import {Component, memo, useContext, useEffect, useRef, useState, useSyncExternalStore} from 'react'
import {effectiveHighlight} from './useSelectBehavior'
import {sameValue, toJSON} from './model'
import {Presence, Collapse} from './motion'
import useChipLayout from './useChipLayout'
import Chip from './chip'

const PROBE_STYLE = {position: 'absolute', visibility: 'hidden', pointerEvents: 'none'}
const NO_CHIPS = []
const noop = () => {}

// [DOC: form-field]
const formValue = (v) => v == null ? '' : typeof v === 'object' ? toJSON(v) ?? '' : String(v)

// [DOC: form-field]
const FormField = memo(function FormField() {
    const {selectRef, multiple, name, form, required} = useContext(SelectConfigContext)
    const {selected, selectedIDs, disabled, fieldsetDisabled} = useContext(SelectStateContext)
    const {reset, markInvalid} = useContext(SelectActionsContext)
    const inputRef = useRef(null)
    // reset listener
    useEffect(() => {
        const scope = inputRef.current?.getRootNode()
        let timer
        const onReset = (e) => {
            if (e.target !== inputRef.current?.form) return
            clearTimeout(timer)
            timer = setTimeout(() => e.defaultPrevented || reset())
        }
        scope?.addEventListener('reset', onReset, true)
        return () => {clearTimeout(timer); scope?.removeEventListener('reset', onReset, true)}
    }, [reset])
    const picked = multiple ? selectedIDs : selected ? [selected] : NO_CHIPS
    // form anchor
    const silent = !required && (!name || multiple && !picked.length)
    const values = silent || !picked.length ? [''] : picked.map(option => formValue(option.original))
    const focus = () => selectRef.current?.focus()
    return values.map((value, i) =>
        <input className='rac-input' key={i} ref={i ? undefined : inputRef} name={silent ? undefined : name} form={form} value={value} hidden={silent} required={required && !i} disabled={disabled && !fieldsetDisabled} tabIndex={-1} aria-hidden='true' autoComplete='off' onChange={noop} onInvalid={markInvalid} onFocus={focus}/>
    )
})

// [DOC: chip-hold]
class Snapshot extends Component {
    getSnapshotBeforeUpdate(prev) {
        // [DOC: chip-resize]
        const sized = prev.look !== this.props.look
        if (sized || prev.chips !== this.props.chips) this.props.take(sized)
        return null
    }
    componentDidUpdate() {}
    render() {return null}
}

// [DOC: chip-keys]
const rekey = (chips, prev) => {
    const ids = new Set(chips.map(chip => chip.id))
    const byId = new Map(prev.map(([key, chip]) => [chip.id, key]))
    const free = prev.filter(([, chip]) => !ids.has(chip.id))
    const taken = new Set(prev.map(([key]) => key))
    return chips.map(chip => {
        if (byId.has(chip.id)) return [byId.get(chip.id), chip]
        const at = free.findIndex(([, old]) => sameValue(old.original, chip.original))
        if (at >= 0) return [free.splice(at, 1)[0][0], chip]
        let key = chip.id
        while (taken.has(key)) key += '~'
        taken.add(key)
        return [key, chip]
    })
}

const useChipKeys = (chips) => {
    const [last, setLast] = useState(() => ({chips, keyed: rekey(chips, [])}))
    if (last.chips === chips) return last.keyed
    const keyed = rekey(chips, last.keyed)
    setLast({chips, keyed})
    return keyed
}

// [DOC: value]
const Value = memo(function Value() {
    const {selectedText, icons, valueAsOption, renderOption} = useContext(SelectConfigContext)
    const {selectedIDs, title, valueOption, hasActualValue, loading, error, deleting, active} = useContext(SelectStateContext)
    const showChips = selectedIDs.length > 0 && !selectedText
    const chips = showChips ? selectedIDs : NO_CHIPS
    const {chipStore, delGroup, valueRef, delIconRef, probe, settle, held, snapshot, look, wait} = useChipLayout(chips)
    const keyed = useChipKeys(chips)
    // [DOC: trigger-width]
    const [titleGroup] = useState(() => new Set())

    // [DOC: value]
    const rich = valueAsOption && valueOption ? optionContent(valueOption, renderOption, true) : null
    const busy = loading && !error && !hasActualValue
    const titleKey = `${rich ? valueOption.id : title}${busy ? '-loading' : ''}`
    const bool = valueOption?.type === 'boolean' ? String(valueOption.raw) : undefined

    return (
        <div className='rac-value' ref={valueRef}>
            <Snapshot chips={chips} look={look} take={snapshot}/>
            <Presence>
                {!showChips &&
                    <Collapse axis='x' fade group={titleGroup} className={withClass('rac-title', rich && valueOption.className)} style={rich ? valueOption.style : undefined} data-bool={bool} onEntered={settle} onExited={settle} key={titleKey}>
                        {rich ? <div className='rac-option-jsx'>{rich}</div> : title}
                        {busy && dots}
                    </Collapse>
                }
            </Presence>
            <Presence hold={held} wait={wait}>
                {keyed.map(([key, element]) =>
                    <Chip
                        key={key}
                        element={element}
                        deleting={deleting}
                        locked={!active}
                        chipStore={chipStore}
                        delGroup={delGroup}
                        settle={settle}
                    />
                )}
            </Presence>
            {probe && <button type='button' className='rac-chip-del' tabIndex={-1} aria-hidden='true' ref={delIconRef} style={PROBE_STYLE}>{renderIcon(icons.remove)}</button>}
        </div>
    )
})

// [DOC: trigger]
const Trigger = memo(function Trigger() {
    const {selectRef, selectId, highlightStore, className, style, duration, easing, deleteInline, icons, texts, placeholder, id, required, popup, attrs} = useContext(SelectConfigContext)
    const {visibility, active, hasActualValue, deleting, loading, loadPending, error, invalid, normalizedOptions} = useContext(SelectStateContext)
    const {handleBlur, handleFocus, handleKeyDown, toggleVisibility, clear} = useContext(SelectActionsContext)

    // [DOC: trigger]
    const activeDescendant = useSyncExternalStore(highlightStore.subscribe, () => {
        const option = visibility ? normalizedOptions[effectiveHighlight(highlightStore.get())] : null
        return option ? optionDomId(selectId, option.id) : undefined
    }, () => undefined)

    // [DOC: state-semantics]
    const showClear = !!icons.clear && hasActualValue && active && !deleting
    const showArrow = !!icons.arrow && active && !deleting && popup
    // [DOC: popup]
    const roleAttrs = popup ? {role: 'combobox', 'aria-haspopup': 'listbox', 'aria-controls': `${selectId}-listbox`, 'aria-expanded': visibility, 'aria-activedescendant': activeDescendant, 'aria-required': required || undefined} : {role: 'group'}

    return (
        <div
            {...attrs}
            id={id}
            ref={selectRef}
            style={{'--rac-duration': `${duration}ms`, '--rac-ease': easing, ...style}}
            className={withClass('rac-select', className)}
            {...(active && {
                onKeyDown: handleKeyDown,
                onFocus: handleFocus,
                onClick: toggleVisibility,
                onBlur: handleBlur
            })}
            {...roleAttrs}
            aria-disabled={!active}
            tabIndex={active ? 0 : -1}
            aria-busy={loading || loadPending || undefined}
            aria-label={attrs['aria-label'] ?? (attrs['aria-labelledby'] ? undefined : placeholder)}
            aria-invalid={invalid || attrs['aria-invalid']}
            aria-describedby={[attrs['aria-describedby'], error && `${selectId}-error`].filter(Boolean).join(' ') || undefined}
            data-inline-delete={flag(deleteInline)}
            data-empty={flag(!hasActualValue)}
            data-deleting={flag(deleting)}
            data-error={flag(error)}
            data-invalid={flag(invalid)}
        >
            <Value/>
            <Presence>
                {showClear &&
                    <Collapse as='button' type='button' axis='x' className='rac-clear' tabIndex={-1} aria-label={texts.clear} onMouseDown={stopEvent} onClick={e => {refocus(e, selectRef); clear(e)}} key='clear'>
                        {renderIcon(icons.clear)}
                    </Collapse>
                }
                {showArrow &&
                    <Collapse axis='x' className='rac-arrow' aria-hidden='true' key='arrow'>
                        {renderIcon(icons.arrow)}
                    </Collapse>
                }
            </Presence>
            <FormField/>
        </div>
    )
})

export default Trigger
