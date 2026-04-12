import {useState, useMemo, useCallback, useRef} from 'react'

const SYSTEM_KEYS = ['group', 'disabled', 'options', 'items', 'children']
const LABEL_KEYS = ['name', 'label', 'id', 'value']
const EMPTY_ARRAY = []

const getLabel = (obj, isGroup = false) => {
    if (isGroup && typeof obj.group === 'string') return obj.group
    const foundKey = LABEL_KEYS.find(k => obj[k] != null && obj[k] !== '')
    if (foundKey) return String(obj[foundKey])
    
    const fallback = Object.entries(obj).find(([k, v]) => !SYSTEM_KEYS.includes(k) && v != null && v !== '')
    return fallback ? String(fallback[1]) : null
}

function useSelectLogic({
    options = EMPTY_ARRAY,
    jsxOptions = EMPTY_ARRAY,
    value,
    onChange,
    disabled = false,
    loading = false,
    error = false,
    multiple = false,
    placeholder = 'Choose option',
    emptyText = 'No options',
    disabledText = 'Disabled',
    loadingText = 'Loading',
    errorText = 'Failed to load',
    disabledOption = 'Disabled option',
    emptyOption = 'Empty option',
    invalidOption = 'Invalid option',
    setVisibility,
    hasMore,
    loadButton,
    setLoadingTitle,
    loadingTitle,
    loadMoreText,
    loadMore,
    childrenFirst = false,
    groupsClosed = false,
}) {
    
    const isControlled = value !== undefined
    
    const [expandedGroups, setExpandedGroups] = useState(() => {
        const initial = new Set()
        if (groupsClosed) return initial

        const fillGroups = (items) => {
            if (!Array.isArray(items)) return
            items.forEach(item => {
                if (item && typeof item === 'object') {
                    const isGroup = 'options' in item || ('group' in item && !LABEL_KEYS.some(k => k in item))
                    if (isGroup && !item.disabled) {
                        const name = getLabel(item, true) || 'Empty group'
                        initial.add(name)
                    }
                    if (item.options) fillGroups(item.options)
                }
            })
        }
        fillGroups(options)
        return initial
    })

    const orderCache = useRef(null)

    const toggleGroup = useCallback((groupName) => {
        setExpandedGroups(prev => {
            const next = new Set(prev)
            next.has(groupName) ? next.delete(groupName) : next.add(groupName)
            return next
        })
    }, [])

    const normalize = useCallback((rawItem, index, prefix = 'n', group = null, groupDisabled = false) => {
        const id = `${prefix}-${index}`
        
        if (rawItem == null || rawItem === '' || rawItem === undefined) {
            return {
                name: emptyOption,
                disabled: true,
                type: 'normal',
                groupDisabled,
                userId: null,
                raw: rawItem,
                group,
                id, 
            }
        }

        if (typeof rawItem === 'function') {
            return {id, userId: null, name: invalidOption, raw: rawItem, disabled: true, invalid: true, type: 'normal', group}
        }

        if (typeof rawItem === 'object' && !Array.isArray(rawItem)) {
            const currentGroup = group || rawItem.group || null
            const isItemDisabled = groupDisabled || rawItem.disabled === true
            const userId = rawItem.id ?? rawItem.value ?? rawItem.name ?? rawItem.label
            const itemValue = rawItem.value !== undefined ? rawItem.value : (rawItem.id !== undefined ? rawItem.id : rawItem)
            
            let label = getLabel(rawItem) || (isItemDisabled ? disabledOption : emptyOption)
            
            return {
                id,
                userId,
                name: label,
                raw: itemValue,
                original: rawItem,
                disabled: isItemDisabled || (label === emptyOption && !isItemDisabled),
                type: typeof itemValue === 'boolean' ? 'boolean' : 'normal',
                group: currentGroup,
                groupDisabled
            }
        }

        return {
            id,
            userId: rawItem,
            name: String(rawItem),
            raw: rawItem,
            original: rawItem,
            disabled: groupDisabled,
            type: typeof rawItem === 'boolean' ? 'boolean' : 'normal',
            group
        }
    }, [emptyOption, invalidOption, disabledOption])

    const normalizedOptions = useMemo(() => {
        const groupsMap = new Map()
        const flatBase = []

        const preparedJsx = jsxOptions.map((opt, index) => {
            if (opt.isGroupMarker) return {...opt, type: 'group-marker'}
            const isActuallyEmpty = 
                !opt.label &&
                !opt.userId &&
                !opt.value &&
                (opt.value === undefined || opt.value === null || opt.value === '') &&
                !opt.hasJsx
            return {
                ...opt,
                id: `jsx-${opt.id}`,
                index: index,
                userId: opt.userId,
                raw: opt.value,
                original: opt.value,
                name: isActuallyEmpty ? emptyOption : (opt.label || opt.userId || String(opt.value || '')),
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
                const isObj = item !== null && item !== undefined && typeof item === 'object' && !Array.isArray(item)
                
                const isGroup = isObj && ('options' in item || ('group' in item && !LABEL_KEYS.some(k => k in item)))

                if (isGroup) {
                    const groupName = getLabel(item, true) || 'Empty group'
                    if (!groupsMap.has(groupName)) {
                        groupsMap.set(groupName, {disabled: !!item.disabled, closedByDefault: !!item.disabled || groupsClosed, items: []})
                    }
                    if (item.options) {
                        collect(item.options, groupName, parentDisabled || !!item.disabled, currentId)
                    } else {
                        flatBase.push({id: `empty-${groupName}-${currentId}`, name: groupName, group: groupName, isPlaceholder: true, type: 'group-marker', index: flatIndex++})
                    }
                } else if (isObj && !LABEL_KEYS.some(k => k in item) && !item.group) {
                    Object.entries(item).forEach(([k, v], j) => {
                        const norm = normalize(v, `${currentId}-${j}`, 'default', parentGroup, parentDisabled)
                            flatBase.push({...norm, index: flatIndex++})
                    })
                } else {
                    const norm = normalize(item, currentId, 'default', parentGroup, parentDisabled)
                        flatBase.push({...norm, index: flatIndex++})
                }
            })
        }

        collect(options)

        const combined = childrenFirst
        ? [...preparedJsx, ...flatBase]
        : [...flatBase, ...preparedJsx]
        
        if (!orderCache.current) {
            orderCache.current = new Map(combined.map((item, i) => [item.id, i]))
        } else {
            let hasNewItems = false
            combined.forEach(item => {
                if (!orderCache.current.has(item.id)) hasNewItems = true
            })

            if (hasNewItems) {
                const newMap = new Map()
                combined.forEach((item, index) => {
                    newMap.set(item.id, index)
                })
                orderCache.current = newMap
            }
        }

        const orderedList = [...combined].sort((a, b) => {
            const indexA = orderCache.current.get(a.id) ?? 999999
            const indexB = orderCache.current.get(b.id) ?? 999999
            return indexA - indexB
        })

        const structure = []
        const seenGroups = new Set()

        orderedList.forEach(opt => {
            if (!opt.group) {
                structure.push({type: 'item', data: opt})
            } else {
                if (!seenGroups.has(opt.group)) {
                    seenGroups.add(opt.group)
                    structure.push({type: 'group', name: opt.group})
                }
                const groupStore = groupsMap.get(opt.group) || {items: []}
                if (!groupsMap.has(opt.group)) groupsMap.set(opt.group, groupStore)

                if (opt.isGroupMarker) {
                    groupStore.className = opt.className
                    groupStore.style = opt.style
                    if (opt.disabled) groupStore.disabled = true
                } else if (!opt.isPlaceholder) {
                    groupStore.items.push(opt)
                }
            }
        })

        const final = []
        structure.forEach((entry) => {
            if (entry.type === 'item') {
                final.push(entry.data)
            } else {
                const groupName = entry.name
                const meta = groupsMap.get(groupName)
                const expanded = expandedGroups.has(groupName)
                
                final.push({
                    className: meta?.className || '',
                    id: `group-header-${groupName}`,
                    disabled: !!meta?.disabled,
                    style: meta?.style || {},
                    groupHeader: true,
                    name: groupName,
                    type: 'group',
                    hidden: false,
                    expanded
                })

                meta?.items.forEach(item => {
                    const hidden = expandedGroups.size > 0 
                        ? !expanded 
                        : !!groupsClosed
                        
                    final.push({...item, hidden: hidden})
                })
            }
        })

        if (hasMore && loadButton) {
            final.push({
                id: 'special-load-more-id',
                name: loadingTitle,
                loadMore: true,
                loading: loadingTitle === loadMoreText,
                type: 'special'
            })
        }

        return final
    }, [options, jsxOptions, normalize, childrenFirst, hasMore, loadButton, loadingTitle, loadMoreText, groupsClosed, expandedGroups, emptyOption])

    const getInitialSelection = useCallback(() => {
        
        if (value == null || (Array.isArray(value) && value.length === 0)) {
            return {initialId: null, initialIDs: []}
        }

        const usedIds = new Set()

        const getOrVirtualize = (val, index) => {
            let found = normalizedOptions.find(o => o.original === val && !usedIds.has(o.id))
            
            if (!found && typeof val === 'object') {
                try {
                    const str = JSON.stringify(val)
                    found = normalizedOptions.find(o => 
                        o.original && typeof o.original === 'object' && JSON.stringify(o.original) === str && !usedIds.has(o.id)
                    )
                } catch {}
            }

            if (found) {
                usedIds.add(found.id)
                return found
            }

            const stableKey = typeof val === 'object' ? (val.id || val.value || JSON.stringify(val)) : String(val)

            if (typeof val === 'object' && val !== null) {
                return {
                    id: `virtual-${stableKey}-${index}`,
                    name: getLabel(val) || String(val.id || 'Selected Object'),
                    raw: val.value ?? val.id ?? val,
                    original: val,
                    userId: val.id ?? val.value ?? null,
                    virtual: true
                }
            }
            return {
                id: `virtual-${stableKey}-${index}`,
                name: String(val),
                raw: val,
                original: val,
                userId: val,
                virtual: true
            }
        }

        if (multiple) {
            const vals = Array.isArray(value) ? value : [value]
            const newSelected = vals.map((val, index) => getOrVirtualize(val, index))
            return {initialId: null, initialIDs: newSelected}
        } else {
            const val = Array.isArray(value) ? value[0] : value
            const opt = getOrVirtualize(val, 0)
            return {initialId: opt.id, initialIDs: []}
        }
    }, [isControlled, value, normalizedOptions, multiple])

    const [selectedId, setSelectedId] = useState(() => getInitialSelection().initialId)
    const [selectedIDs, setSelectedIds] = useState(() => getInitialSelection().initialIDs)

    const selected = useMemo(() => {
        const found = normalizedOptions.find(o => o.id === selectedId)
        if (found) return found
        
        if (!multiple && selectedId?.startsWith('virtual-')) {
            const val = Array.isArray(value) ? value[0] : value
            if (val) {
                return {
                    id: selectedId,
                    name: typeof val === 'object' ? getLabel(val) : String(val),
                    original: val
                }
            }
        }
        return null
    }, [selectedId, normalizedOptions, multiple, isControlled, value])

    // select option in dropdown menu
    const selectOption = useCallback((option, e) => {
        // processing group header selection
        if (option.groupHeader) {
            cancelEvents(e)
            if (!option.disabled) toggleGroup(option.name)
            return
        }

        // processing disabled option
        if (option.disabled || option.loadMore) {
            cancelEvents(e)
            // proccesing load more button
            if (option.loadMore && !option.loading) {
                setLoadingTitle(loadMoreText)
                loadMore()
            }
            return
        }

        // multiple mode
        if (multiple) {
            // processing disabled option
            if (option.disabled || option.groupHeader || option.loadMore) {
                cancelEvents(e)
                return
            }

            cancelEvents(e)
            // toggle multiple option selection
            const isSelected = selectedIDs?.some(item => item.id === option.id)
            const next = isSelected 
                ? selectedIDs.filter(item => item.id !== option.id) 
                : [...selectedIDs, option]

            setSelectedIds(next)
            onChange?.(next.map(o => o.original), next.map(o => o.userId))
            return
        }
        // toggle option selection
        setSelectedId(option.id)
        onChange?.(option.original, option.userId)
        setVisibility(false)
    }, [onChange, setVisibility, loadMore, loadMoreText, setLoadingTitle, toggleGroup, multiple, selectedIDs])

    // prevent default behavior and stop event bubbling
    const cancelEvents = useCallback((e) => {
        e?.stopPropagation()
        e?.preventDefault()
    }, [])

    // clears a selectedId(s)
    const clear = useCallback(() => {
        onChange?.(null, null)
        setSelectedId(null)
        setSelectedIds([])
    }, [onChange])

    // remove selected option (multiple mode)
    const removeOption = useCallback((id) => {
        const next = selectedIDs.filter(item => item.id !== id)
        setSelectedIds(next)
        onChange?.(next.map(o => o.original), next.map(o => o.userId))
    }, [selectedIDs, onChange])

    return {
        normalizedOptions, selected, selectOption, clear, removeOption, hasOptions: normalizedOptions.length > 0,
        active: !error && !loading && !disabled && normalizedOptions.length > 0,
        selectedValue: value, 
        placeholder, emptyText, disabledText, loadingText, errorText, 
        disabledOption, emptyOption, invalidOption, disabled, loading, error,
        expandedGroups, toggleGroup, selectedIDs, multiple, setSelectedIds
    }
}

export default useSelectLogic