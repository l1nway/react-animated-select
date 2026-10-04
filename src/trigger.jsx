import {SelectConfigContext, SelectActionsContext, SelectStateContext} from './state'
import {renderIcon, stopEvent, refocus, optionDomId, optionContent, flag, dots, withClass, followHeight} from './utils'
import {memo, useContext, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore} from 'react'
import {effectiveHighlight} from './useSelectBehavior'
import {toJSON} from './model'
import {Presence, Collapse} from './motion'

const NO_CHIPS = []
const noop = () => {}

// [DOC: form-field]
const formValue = (v) => v == null ? '' : typeof v === 'object' ? toJSON(v) ?? '' : String(v)

// [DOC: form-field]
const FormField = /* @__PURE__ */ memo(function FormField() {
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

// [DOC: value]
export const Title = /* @__PURE__ */ memo(function Title({hidden, settle}) {
    const {multiple, selectedText, valueAsOption, renderOption, texts} = useContext(SelectConfigContext)
    const {selectedIDs, title, valueOption, hasActualValue, loading, error} = useContext(SelectStateContext)
    // [DOC: trigger-width]
    const [titleGroup] = useState(() => new Set())

    // [DOC: value]
    const rich = valueAsOption && valueOption ? optionContent(valueOption, renderOption, true) : null
    const busy = loading && !error && !hasActualValue
    const picked = multiple && selectedIDs.length > 0 && !selectedText
    const titleKey = `${picked ? 'picked' : rich ? valueOption.id : title}${busy ? '-loading' : ''}`
    const bool = valueOption?.type === 'boolean' ? String(valueOption.raw) : undefined

    return (
        <Presence>
            {!hidden &&
                <Collapse axis='x' fade group={titleGroup} className={withClass('rac-title', rich && valueOption.className)} style={rich ? valueOption.style : undefined} data-bool={bool} onEntered={settle} onExited={settle} key={titleKey}>
                    {rich ? <div className='rac-option-jsx'>{rich}</div> : picked ? selectedIDs.map(o => o.name || texts.emptyOption).join(', ') : title}
                    {busy && dots}
                </Collapse>
            }
        </Presence>
    )
})

// [DOC: value]
const Value = /* @__PURE__ */ memo(function Value() {
    const {selectRef, multiple, valueAsOption, duration, easing, ext} = useContext(SelectConfigContext)
    const Plugin = multiple ? ext.Value : undefined
    const valueRef = useRef(null)
    // [DOC: value-height]
    const [follow, setFollow] = useState(valueAsOption)
    if (valueAsOption && !follow) setFollow(true)
    const timing = useRef({duration, easing})
    useLayoutEffect(() => {timing.current = {duration, easing}}, [duration, easing])
    useLayoutEffect(() => {
        const value = valueRef.current
        if (!follow || multiple || !value || typeof ResizeObserver === 'undefined') return
        const height = {value: 0, root: '', anim: null}
        const observer = new ResizeObserver(() => followHeight(selectRef.current, height, value.offsetHeight, timing.current.duration, timing.current.easing))
        observer.observe(value)
        return () => {observer.disconnect(); height.anim?.cancel()}
    }, [follow, multiple, selectRef])

    return Plugin ? <Plugin/> : <div className='rac-value' ref={valueRef}><Title/></div>
})

// [DOC: trigger]
const Trigger = /* @__PURE__ */ memo(function Trigger() {
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
