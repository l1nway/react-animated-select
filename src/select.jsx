import {SelectConfigContext, SelectActionsContext, SelectStateContext, useShallowStable, useDeepStable} from './state'
import {Children, Fragment, isValidElement, useMemo} from 'react'
import Trigger from './trigger'
import Dropdown from './dropdown'
import {icons, warnOnce} from './utils'
import useSelect from './useSelect'

const EMPTY_STYLE = {}
const filled = (v) => v !== undefined && v !== null && v !== ''

const getText = (children) => {
    if (!children) return ''
    if (typeof children === 'string' || typeof children === 'number') return String(children)
    if (Array.isArray(children)) return children.map(getText).join(' ').replace(/\s+/g, ' ').trim()
    if (isValidElement(children)) return getText(children.props.children)
    return ''
}

// [DOC: jsx-options]
const optionRecord = ({name, label, id, value, className, style, children, disabled, group}, path, parentGroup) => {
    const text = getText(children)
    const finalValue = value !== undefined ? value : text
    if (children != null && !text && !filled(label) && !filled(name) && !filled(id) && !filled(value)) warnOnce('no text', '<Option> has content but no text to show in the title or chips. Add a `label` (or `value`), or enable `valueAsOption`.')
    return {
        id: filled(id) ? String(id) : path,
        userId: filled(id) ? id : finalValue,
        value: finalValue,
        label: filled(label) ? String(label) : filled(name) ? String(name) : text || (filled(id) ? String(id) : ''),
        jsx: children,
        hasJsx: children !== undefined && children !== null,
        className, style, disabled: !!disabled,
        group: group || parentGroup || null
    }
}

const groupRecord = ({name, label, value, id, disabled, className = '', style = EMPTY_STYLE}, emptyGroup) => {
    const val = name ?? label ?? id ?? value
    return {disabled: !!disabled, isGroupMarker: true, group: filled(val) ? String(val) : emptyGroup, className, style}
}

const typeName = (type) => `<${typeof type === 'string' ? type : type?.displayName || type?.name || 'Component'}>`

// [DOC: jsx-options]
const collectOptions = (children, emptyGroup, parentGroup = null, prefix = 'o', out = []) => {
    Children.toArray(children).forEach(child => {
        if (!isValidElement(child)) {
            warnOnce('text', `Text inside <Select> or <OptGroup> is ignored ("${String(child).slice(0, 30)}"). Wrap it in <Option>.`)
            return
        }
        const path = `${prefix}-${String(child.key).slice(1).replace(/[:$]/g, c => c === ':' ? '-' : 'k').replace(/[^\p{L}\p{N}-]/gu, '')}`
        const kind = child.type?.racKind
        if (child.type === Fragment) collectOptions(child.props.children, emptyGroup, parentGroup, path, out)
        else if (kind === 'option') out.push(optionRecord(child.props, path, parentGroup))
        else if (kind === 'define') collectOptions(child.type.racRender(child.props), emptyGroup, parentGroup, path, out)
        else if (kind === 'group') {
            const marker = groupRecord(child.props, emptyGroup)
            out.push(marker)
            collectOptions(child.props.children, emptyGroup, marker.group, path, out)
        } else {
            const name = typeName(child.type)
            warnOnce(`child ${name}`, `${name} inside <Select> is ignored: only <Option/>, <OptGroup/> and defineOption() components are read. Put custom content inside <Option>, or wrap the component with defineOption().`)
        }
    })
    return out
}

// [DOC: public-api]
const MODEL_KEYS = new Set(['ref', 'options', 'value', 'defaultValue', 'onChange', 'children', 'loadMore', 'open', 'onOpenChange', 'onFocus', 'onBlur', 'childrenFirst', 'groupsClosed', 'disabled', 'loading', 'error'])
// [DOC: public-api]
const ATTR = /^(aria|data)-/

// [DOC: public-api]
const DEFAULT_PROPS = {
    options: [],
    value: undefined,
    defaultValue: undefined,
    onChange: undefined,
    multiple: false,
    childrenFirst: false,
    groupsClosed: false,

    disabled: false,
    loading: false,
    error: false,

    open: undefined,
    onOpenChange: undefined,
    onFocus: undefined,
    onBlur: undefined,

    id: undefined,
    name: undefined,
    required: false,

    hasMore: false,
    loadMore: undefined,
    loadButton: false,
    loadOffset: 100,
    loadAhead: 3,

    placeholder: 'Choose option',
    selectedText: undefined,
    texts: {
        empty: 'No options',
        disabled: 'Disabled',
        loading: 'Loading',
        error: 'Failed to load',
        clear: 'Clear selection',
        remove: 'Remove',
        loadMore: 'Load more',
        loadingMore: 'Loading',
        emptyOption: 'Empty option',
        invalidOption: 'Invalid option',
        disabledOption: 'Disabled option',
        emptyGroup: 'Empty group',
        list: 'Options'
    },
    renderOption: undefined,
    valueAsOption: false,

    icons: {arrow: icons.ArrowUp, clear: icons.XMark, remove: icons.XMark, check: icons.Checkmark, checkbox: undefined},
    deleteInline: false,
    deleteAlways: false,

    className: '',
    optionsClassName: '',
    style: {},
    container: undefined,
    duration: 300,
    easing: 'ease',
    offset: 1,
    animateOpacity: true,
    keepMounted: false
}

// [DOC: public-api]
const RENAMED = {
    visibility: 'open', setVisibility: 'onOpenChange', ownBehavior: 'open without onOpenChange', onOpen: 'onOpenChange', onClose: 'onOpenChange',
    unmount: 'keepMounted (inverted)', showDelete: 'deleteAlways',
    OpenIcon: 'icons.arrow', ClearIcon: 'icons.clear', DelIcon: 'icons.remove', Checkmark: 'icons.check', Checkbox: 'icons.checkbox',
    emptyText: 'texts.empty', disabledText: 'texts.disabled', loadingText: 'texts.loading', errorText: 'texts.error', clearText: 'texts.clear', removeText: 'texts.remove',
    loadButtonText: 'texts.loadMore', loadMoreText: 'texts.loadingMore', emptyOption: 'texts.emptyOption', invalidOption: 'texts.invalidOption', disabledOption: 'texts.disabledOption'
}

const withDefaults = (defaults, user) => {
    const merged = {...defaults}
    for (const key in user) if (user[key] !== undefined) merged[key] = user[key]
    return merged
}

export function Select(userProps) {
    // [DOC: public-api]
    for (const key in userProps) if (key in RENAMED) warnOnce(`renamed ${key}`, `The \`${key}\` prop was removed. Use \`${RENAMED[key]}\`.`)
    if (userProps.value !== undefined && !userProps.onChange) warnOnce('read-only value', '`value` is set without `onChange`, so the Select is read-only. Pass `onChange`, or `defaultValue` instead of `value`.')
    const props = withDefaults(DEFAULT_PROPS, userProps)
    props.texts = withDefaults(DEFAULT_PROPS.texts, userProps.texts)
    props.icons = withDefaults(DEFAULT_PROPS.icons, userProps.icons)

    // [DOC: jsx-options]
    const emptyGroup = props.texts.emptyGroup
    const jsxOptions = useDeepStable(useMemo(() => collectOptions(props.children, emptyGroup), [props.children, emptyGroup]))

    const {selectId, selectRef, highlightStore, positionStore, state, actions} = useSelect(props, jsxOptions)

    const uiProps = {}, attrs = {}
    for (const key in props) if (!MODEL_KEYS.has(key)) (ATTR.test(key) ? attrs : uiProps)[key] = props[key]
    const config = useShallowStable({...uiProps, attrs, selectId, selectRef, highlightStore, positionStore})

    return (
        <SelectConfigContext.Provider value={config}>
            <SelectActionsContext.Provider value={actions}>
                <SelectStateContext.Provider value={state}>
                    <Trigger/>
                    <Dropdown/>
                </SelectStateContext.Provider>
            </SelectActionsContext.Provider>
        </SelectConfigContext.Provider>
    )
}

// [DOC: jsx-options]
export function Option() {
    warnOnce('option outside', '<Option/> was rendered outside <Select>, or inside a component that <Select> cannot read. Use it as a direct child, or wrap the component with defineOption().')
    return null
}
Option.racKind = 'option'

// [DOC: jsx-options]
export function OptGroup() {
    return null
}
OptGroup.racKind = 'group'
