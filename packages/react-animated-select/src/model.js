// [DOC: option-model]

const SYSTEM_KEYS = ['group', 'disabled', 'options', 'items', 'children']
const LABEL_KEYS = ['name', 'label', 'id', 'value']

const filled = v => v != null && v !== ''
const isRecord = item => item !== null && typeof item === 'object' && !Array.isArray(item)
// [DOC: option-model]
export const isPlain = item => isRecord(item) && [Object.prototype, null].includes(Object.getPrototypeOf(item))
const ownText = (obj) => {try {const text = String(obj); return text.startsWith('[object ') ? null : text} catch {return null}}

export const getLabel = (obj, isGroup = false) => {
    if (isGroup && typeof obj.group === 'string') return obj.group
    const foundKey = LABEL_KEYS.find(k => filled(obj[k]))
    if (foundKey) return String(obj[foundKey])
    // [DOC: option-model]
    const text = !isPlain(obj) && ownText(obj)
    if (text) return text
    const fallback = Object.entries(obj).find(([k, v]) => !SYSTEM_KEYS.includes(k) && filled(v))
    return fallback ? String(fallback[1]) : null
}

const isGroupItem = item => isPlain(item) && ('options' in item || ('group' in item && !LABEL_KEYS.some(k => k in item)))

const normalizeItem = (rawItem, index, prefix, group, groupDisabled, {emptyOption, invalidOption, disabledOption}) => {
    const id = `${prefix}-${index}`

    if (rawItem == null || rawItem === '') {
        return {id, userId: null, name: emptyOption, raw: rawItem, disabled: true, type: 'normal', group, groupDisabled}
    }
    if (typeof rawItem === 'function') {
        return {id, userId: null, name: invalidOption, raw: rawItem, disabled: true, invalid: true, type: 'normal', group}
    }
    if (isRecord(rawItem)) {
        const isItemDisabled = groupDisabled || rawItem.disabled === true
        const itemValue = rawItem.value !== undefined ? rawItem.value : (rawItem.id !== undefined ? rawItem.id : rawItem)
        const label = getLabel(rawItem) || (isItemDisabled ? disabledOption : emptyOption)
        return {
            id,
            userId: rawItem.id ?? rawItem.value ?? rawItem.name ?? rawItem.label,
            name: label,
            raw: itemValue,
            original: rawItem,
            disabled: isItemDisabled || label === emptyOption,
            type: typeof itemValue === 'boolean' ? 'boolean' : 'normal',
            group: group || rawItem.group || null,
            groupDisabled
        }
    }
    return {id, userId: rawItem, name: String(rawItem), raw: rawItem, original: rawItem, disabled: groupDisabled, type: typeof rawItem === 'boolean' ? 'boolean' : 'normal', group}
}

export const normalizeOptions = ({
    options, jsxOptions, childrenFirst, tail,
    emptyOption, invalidOption, disabledOption, emptyGroup
}) => {
    const texts = {emptyOption, invalidOption, disabledOption}
    const groupsMap = new Map()
    const flatBase = []

    // [DOC: selection-identity]
    const jsxIds = new Set()
    const claim = (base) => {let id = base; for (let n = 1; jsxIds.has(id); n++) id = `${base}~${n}`; jsxIds.add(id); return id}

    const preparedJsx = jsxOptions.map((opt, index) => {
        if (opt.isGroupMarker) return {...opt, type: 'group-marker'}
        const isActuallyEmpty = !opt.label && !filled(opt.userId) && !filled(opt.value) && !opt.hasJsx
        return {
            ...opt,
            id: claim(`jsx-${opt.id}`),
            index,
            userId: opt.userId,
            raw: opt.value,
            original: opt.value,
            name: opt.label || (filled(opt.value) ? String(opt.value) : emptyOption),
            disabled: !!opt.disabled || isActuallyEmpty,
            type: typeof opt.value === 'boolean' ? 'boolean' : 'normal',
            group: opt.group || null
        }
    })

    let flatIndex = 0
    const collect = (items, parentGroup = null, parentDisabled = false, depth = '0') => {
        if (!Array.isArray(items)) items = [items]
        items.forEach((item, i) => {
            const currentId = `${depth}-${i}`
            if (isGroupItem(item)) {
                const groupName = getLabel(item, true) || emptyGroup
                if (!groupsMap.has(groupName)) groupsMap.set(groupName, {disabled: !!item.disabled, items: []})
                if (item.options) collect(item.options, groupName, parentDisabled || !!item.disabled, currentId)
                else flatBase.push({id: `empty-${groupName}-${currentId}`, name: groupName, group: groupName, isPlaceholder: true, type: 'group-marker', index: flatIndex++})
            } else if (isPlain(item) && !LABEL_KEYS.some(k => k in item) && !item.group) {
                // bare object: option dictionary
                Object.values(item).forEach((v, j) => flatBase.push({...normalizeItem(v, `${currentId}-${j}`, 'default', parentGroup, parentDisabled, texts), index: flatIndex++}))
            } else {
                flatBase.push({...normalizeItem(item, currentId, 'default', parentGroup, parentDisabled, texts), index: flatIndex++})
            }
        })
    }
    collect(options)

    // [DOC: option-model]
    const combined = childrenFirst ? [...preparedJsx, ...flatBase] : [...flatBase, ...preparedJsx]

    const structure = []
    const seenGroups = new Set()
    combined.forEach(opt => {
        if (!opt.group) {
            structure.push({type: 'item', data: opt})
            return
        }
        if (!seenGroups.has(opt.group)) {
            seenGroups.add(opt.group)
            structure.push({type: 'group', name: opt.group})
        }
        if (!groupsMap.has(opt.group)) groupsMap.set(opt.group, {items: []})
        const groupStore = groupsMap.get(opt.group)

        if (opt.isGroupMarker) {
            groupStore.className = opt.className
            groupStore.style = opt.style
            if (opt.disabled) groupStore.disabled = true
        } else if (!opt.isPlaceholder) groupStore.items.push(opt)
    })

    const final = []
    structure.forEach(entry => {
        if (entry.type === 'item') {
            final.push(entry.data)
            return
        }
        // [DOC: option-model]
        const meta = groupsMap.get(entry.name)
        final.push({
            className: meta?.className || '',
            id: `group-header-${entry.name}`,
            disabled: !!meta?.disabled,
            style: meta?.style || {},
            groupHeader: true,
            name: entry.name,
            type: 'group'
        })
        meta?.items.forEach(item => final.push(item))
    })

    // [DOC: paging]
    if (tail) final.push(tail)
    return final
}

// [DOC: define-option]
export const defineOption = (render) => {
    const Defined = () => null
    Defined.racKind = 'define'
    Defined.racRender = render
    Defined.displayName = `defineOption(${render.name || 'anonymous'})`
    return Defined
}

const NO_SELECTION = {selected: null, selectedIDs: []}
export const toJSON = (v) => {try {return JSON.stringify(v)} catch {return undefined}}
const same = (a, b) => a === b || (a !== a && b !== b)
const isObject = v => typeof v === 'object' && v !== null
export const sameValue = (a, b) => same(a, b) || (isObject(a) && isObject(b) && toJSON(a) !== undefined && toJSON(a) === toJSON(b))

// [DOC: selection-identity]
export const resolveSelection = (value, normalizedOptions, multiple, picked) => {
    if (value == null || (Array.isArray(value) && value.length === 0)) return NO_SELECTION

    const byId = picked.length ? new Map(normalizedOptions.map(o => [o.id, o])) : null
    const pool = byId ? [...picked.map(id => byId.get(id)).filter(Boolean), ...normalizedOptions] : normalizedOptions
    const usedIds = new Set()
    const seen = new Map()
    const free = o => 'original' in o && !usedIds.has(o.id)
    const getOrVirtualize = (val) => {
        const object = isObject(val)
        let found = pool.find(o => free(o) && same(o.original, val))

        const str = object ? toJSON(val) : undefined
        if (!found && str !== undefined) found = pool.find(o => free(o) && isObject(o.original) && toJSON(o.original) === str)
        if (found) {
            usedIds.add(found.id)
            return found
        }

        const stableKey = object ? String(val.id || val.value || str || 'object') : String(val)
        const n = (seen.get(stableKey) ?? -1) + 1
        seen.set(stableKey, n)
        const id = `virtual-${stableKey}-${n}`
        return object
            ? {id, name: getLabel(val) || String(val.id || 'Selected Object'), raw: val.value ?? val.id ?? val, original: val, userId: val.id ?? val.value ?? null, virtual: true}
            : {id, name: String(val), raw: val, original: val, userId: val, virtual: true}
    }

    if (multiple) {
        const vals = Array.isArray(value) ? value : [value]
        return {selected: null, selectedIDs: vals.map(getOrVirtualize)}
    }
    return {selected: getOrVirtualize(Array.isArray(value) ? value[0] : value), selectedIDs: NO_SELECTION.selectedIDs}
}
