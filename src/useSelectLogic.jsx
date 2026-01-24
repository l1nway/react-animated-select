import {useState, useMemo, useCallback, useId, useEffect, useRef} from 'react'

const SYSTEM_KEYS = ['group', 'disabled', 'options', 'items', 'children']
const LABEL_KEYS = ['name', 'label', 'id', 'value']

const getLabel = (obj, isGroup = false) => {
    if (isGroup && typeof obj.group === 'string') return obj.group
    const foundKey = LABEL_KEYS.find(k => obj[k] != null && obj[k] !== '')
    if (foundKey) return String(obj[foundKey])
    
    const fallback = Object.entries(obj).find(([k, v]) => !SYSTEM_KEYS.includes(k) && v != null && v !== '')
    return fallback ? String(fallback[1]) : null
}

function useSelectLogic({
    options = [],
    jsxOptions = [],
    value,
    defaultValue,
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
    childrenFirst,
    groupsClosed
}) {
    const stableId = useId()
    const isControlled = value !== undefined
    const [selectedId, setSelectedId] = useState(null)
    const [selectedIDs, setSelectedIds] = useState([])
    const [expandedGroups, setExpandedGroups] = useState(new Set())

    const orderCache = useRef(null)

    const toggleGroup = useCallback((groupName) => {
        setExpandedGroups(prev => {
            const next = new Set(prev)
            next.has(groupName) ? next.delete(groupName) : next.add(groupName)
            return next
        })
    }, [])

    const normalize = useCallback((rawItem, index, prefix = 'n', group = null, groupDisabled = false) => {
        const id = `${stableId}-${prefix}-${index}`
        
        if (rawItem == null || rawItem === '') {
            return {id, userId: null, name: emptyOption, raw: null, disabled: true, type: 'normal', group, groupDisabled}
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
    }, [stableId, emptyOption, invalidOption, disabledOption])

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
                if (!item) return
                const currentId = `${depth}-${i}`
                const isObj = typeof item === 'object' && !Array.isArray(item)
                
                const isGroup = isObj && ('options' in item || ('group' in item && !LABEL_KEYS.some(k => k in item)))

                if (isGroup) {
                    const groupName = getLabel(item, true) || 'Empty group'
                    if (!groupsMap.has(groupName)) {
                        groupsMap.set(groupName, {disabled: !!item.disabled, closedByDefault: !!item.disabled || groupsClosed, items: []})
                    }
                    if (item.options) {
                        collect(item.options, groupName, parentDisabled || !!item.disabled, currentId)
                    } else {
                        flatBase.push({id: `empty-${groupName}-${currentId}`, name: groupName, group: groupName, isPlaceholder: true, type: 'group-marker',index: flatIndex++})
                    }
                } else if (isObj && !LABEL_KEYS.some(k => k in item) && !item.group) {
                    Object.entries(item).forEach(([k, v], j) => {
                        const norm = normalize(v, `${currentId}-${j}`, 'normal', parentGroup, parentDisabled)
                            flatBase.push({ ...norm, index: flatIndex++ })
                    })
                } else {
                    const norm = normalize(item, currentId, 'normal', parentGroup, parentDisabled);
                        flatBase.push({ ...norm, index: flatIndex++ })
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
            let hasNewItems = false;
            combined.forEach(item => {
                if (!orderCache.current.has(item.id)) hasNewItems = true;
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
                if (!opt.isPlaceholder && !opt.isGroupMarker) {
                    const groupStore = groupsMap.get(opt.group) || {items: []}
                    if (!groupsMap.has(opt.group)) groupsMap.set(opt.group, groupStore)
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
                    id: `group-header-${groupName}`,
                    name: groupName,
                    disabled: !!meta?.disabled,
                    groupHeader: true,
                    expanded,
                    type: 'group',
                    hidden: false
                })

                meta?.items.forEach(item => {
                    final.push({...item, hidden: !expanded})
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
    }, [options, jsxOptions, stableId, normalize, childrenFirst, hasMore, loadButton, loadingTitle, loadMoreText, groupsClosed, expandedGroups, emptyOption])

    useEffect(() => {
        if (expandedGroups.size > 0) return
        const initial = new Set()
        normalizedOptions.forEach(opt => {
            if (opt.groupHeader && !opt.disabled && opt.expanded !== false) {
                initial.add(opt.name)
            }
        })
        if (initial.size > 0) setExpandedGroups(initial)
    }, [normalizedOptions])

    const findIdByValue = useCallback((val) => {
        if (val == null) return null
        const match = normalizedOptions.find(o => o.original === val || o.raw === val || o.userId === val)
        if (match) return match.id

        if (typeof val === 'object') {
            try {
                const str = JSON.stringify(val)
                return normalizedOptions.find(o => 
                    o.original && typeof o.original === 'object' && JSON.stringify(o.original) === str
                )?.id ?? null
            } catch { return null }
        }
        return null
    }, [normalizedOptions])

    useEffect(() => {
        const effectiveValue = isControlled ? value : defaultValue
        const currentSelected = normalizedOptions.find(o => o.id === selectedId)
        
        const isStillValid = currentSelected && (
            currentSelected.original === effectiveValue || 
            currentSelected.raw === effectiveValue || 
            currentSelected.userId === effectiveValue
        )

        if (!isStillValid) {
            setSelectedId(findIdByValue(effectiveValue))
        }
    }, [value, defaultValue, isControlled, normalizedOptions, findIdByValue, selectedId])

    const selected = useMemo(() => 
        normalizedOptions.find(o => o.id === selectedId) ?? null, 
    [selectedId, normalizedOptions])

    const selectOption = useCallback((option, e) => {
        if (option.groupHeader) {
            e?.stopPropagation()
            e?.preventDefault()
            if (!option.disabled) toggleGroup(option.name)
            return
        }

        if (option.disabled || option.loadMore) {
            e?.stopPropagation()
            e?.preventDefault()
            if (option.loadMore && !option.loading) {
                setLoadingTitle(loadMoreText)
                loadMore()
            }
            return
        }

        if (multiple) {
            if (option.disabled || option.groupHeader || option.loadMore) {
                e?.stopPropagation()
                e?.preventDefault()
                return
            }

            e?.stopPropagation()
            e?.preventDefault()
            setSelectedIds(prev => {
                if (prev.some(o => o.id === option.id)) {
                    return prev.filter(o => o.id !== option.id)
                }
                return [...prev, option]
            })
            return
        }
        setSelectedId(option.id)
        onChange?.(option.original, option.userId)
        setVisibility(false)
    }, [onChange, setVisibility, loadMore, loadMoreText, setLoadingTitle, toggleGroup])

    const clear = useCallback(() => {
        setSelectedId(null)
        onChange?.(null, null)
    }, [onChange])

    return {
        normalizedOptions, selected, selectOption, clear, 
        hasOptions: normalizedOptions.length > 0,
        active: !error && !loading && !disabled && normalizedOptions.length > 0,
        selectedValue: value ?? defaultValue, 
        placeholder, emptyText, disabledText, loadingText, errorText, 
        disabledOption, emptyOption, invalidOption, disabled, loading, error,
        expandedGroups, toggleGroup, selectedIDs, multiple, setSelectedIds
    }
}

export default useSelectLogic