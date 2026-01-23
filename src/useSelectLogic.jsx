import {useState, useMemo, useCallback, useId, useEffect} from 'react'

// keys that cannot be taken as a name if labelKeys are unavailable
const systemKeys = ['group', 'disabled', 'options', 'items', 'children']

// main keys in order of priority that can be taken for the name
const labelKeys = ['name', 'label', 'id', 'value']

function useSelectLogic({
    options = [],
    jsxOptions = [],
    value,
    defaultValue = undefined,
    onChange,
    disabled = false,
    loading = false,
    error = false,
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
    childrenFirst
}) {
    const stableId = useId()
    const isControlled = value !== undefined
    const [selectedId, setSelectedId] = useState(null)

    // getting option name
    const getLabelFromObject = useCallback((obj, fallback = false) => {
        // 
        const foundKey = labelKeys.find(k => obj[k] !== undefined && obj[k] !== null && obj[k] !== '')
        if (foundKey) return String(obj[foundKey])

        const fallbackEntry = Object.entries(obj).find(([k, v]) => 
            !systemKeys.includes(k) && v != null && v !== ''
        )
        
        if (fallbackEntry) return String(fallbackEntry[1])
        return fallback
    }, [])

    const createNormalizedOption = useCallback((rawItem, index, type = 'normal', injectedGroup = null, injectedDisabled = false) => {
        let label = ''
        let itemValue = rawItem
        let isDisabled = injectedDisabled
        let userId = null
        let group = injectedGroup

        if (rawItem == null || rawItem === '') {
            return {
                id: `${stableId}-${type}-${index}`,
                userId: null,
                name: emptyOption,
                raw: null,
                disabled: true,
                type: 'normal',
                group: group
            }
        }

        if (typeof rawItem === 'function') {
            return {
                id: `${stableId}-inv-${index}`,
                userId: null,
                name: invalidOption,
                raw: rawItem,
                disabled: true,
                invalid: true,
                type: 'normal',
                group: group
            }
        }

        if (typeof rawItem === 'object' && !Array.isArray(rawItem)) {
            if (!group) group = rawItem.group || null
            isDisabled = isDisabled || !!rawItem.disabled 

            userId = rawItem.id ?? rawItem.value ?? rawItem.name ?? rawItem.label
            itemValue = rawItem.value !== undefined ? rawItem.value : (rawItem.id !== undefined ? rawItem.id : rawItem)

            label = getLabelFromObject(rawItem, isDisabled ? disabledOption : emptyOption)
            if (label === emptyOption && !isDisabled) isDisabled = true
        } else {
            label = String(rawItem)
            userId = rawItem
            itemValue = rawItem
        }

        return {
            id: `${stableId}-${type}-${index}`,
            userId: userId,
            name: label,
            raw: itemValue,
            original: rawItem,
            disabled: isDisabled,
            type: typeof itemValue === 'boolean' ? 'boolean' : 'normal',
            group: group
        }
    }, [stableId, emptyOption, invalidOption, disabledOption, getLabelFromObject])

    const [expandedGroups, setExpandedGroups] = useState(new Set())

    const toggleGroup = useCallback((groupName) => {
        setExpandedGroups(prev => {
            const next = new Set(prev)
            if (next.has(groupName)) next.delete(groupName)
            else next.add(groupName)
            return next
        })
    }, [])

    const normalizedOptions = useMemo(() => {
        const combined = []

        const processItem = (opt, uniqueIdx, parentGroup = null, parentDisabled = false) => {
            if (opt && typeof opt === 'object' && !Array.isArray(opt) && 'options' in opt) {
                const groupName = getLabelFromObject(opt, 'Empty group', true)
                const isGroupDisabled = parentDisabled || !!opt.disabled
                const innerData = opt.options

                if (Array.isArray(innerData)) {
                    innerData.forEach((child, i) => processItem(child, `${uniqueIdx}-${i}`, groupName, isGroupDisabled))
                } else if (innerData && typeof innerData === 'object') {
                    Object.entries(innerData).forEach(([k, v], i) => processItem(v, `${uniqueIdx}-${i}`, groupName, isGroupDisabled))
                } else {
                    processItem(innerData, `${uniqueIdx}-0`, groupName, isGroupDisabled)
                }
                return
            }

            const isMapObj = opt && typeof opt === 'object' && !Array.isArray(opt) && 
                !labelKeys.some(k => k in opt) && !('group' in opt)
            
            if (isMapObj) {
                Object.entries(opt).forEach(([k, v], j) => {
                    combined.push(createNormalizedOption(v, `${uniqueIdx}-${j}`, 'normal', parentGroup, parentDisabled))
                })
                return
            }

            combined.push(createNormalizedOption(opt, uniqueIdx, 'normal', parentGroup, parentDisabled))
        }

        if (Array.isArray(options)) {
            options.forEach((opt, i) => processItem(opt, i))
        }

        const jsxMapped = jsxOptions.map(opt => {
            if (opt.isGroupMarker) return { ...opt, type: 'group-marker' }
            const isActuallyEmpty = (opt.value == null || opt.value === '') && !opt.label
            return {
                ...opt,
                id: `jsx-${opt.id}`,
                userId: opt.id,
                raw: opt.value,
                original: opt.value,
                name: isActuallyEmpty ? emptyOption : opt.label,
                disabled: !!opt.disabled || isActuallyEmpty,
                type: typeof opt.value === 'boolean' ? 'boolean' : 'normal',
                group: opt.group || null
            }
        })

        const baseList = childrenFirst ? [...jsxMapped, ...combined] : [...combined, ...jsxMapped]

        const finalFlattened = []
        const groupsMap = new Map()
        const order = []

        baseList.forEach(opt => {
            if (!opt.group) {
                order.push({type: 'item', data: opt})
            } else {
                if (!groupsMap.has(opt.group)) {
                    groupsMap.set(opt.group, [])
                    order.push({type: 'group', name: opt.group})
                }
                if (!opt.isGroupMarker) {
                    const visible = expandedGroups.has(opt.group)
                    groupsMap.get(opt.group).push({...opt, hidden: !visible})
                }
            }
        })

        order.forEach((entry, idx) => {
            if (entry.type === 'item') {
                finalFlattened.push(entry.data)
            } else {
                const expanded = expandedGroups.has(entry.name)
                finalFlattened.push({
                    id: `group-header-${entry.name}-${idx}`,
                    name: entry.name,
                    disabled: false,
                    groupHeader: true,
                    expanded,
                    type: 'group'
                })
                
                const items = groupsMap.get(entry.name)
                finalFlattened.push(...items)
                
            }
        })

        if (hasMore && loadButton) {
            finalFlattened.push({
                id: 'special-load-more-id',
                name: loadingTitle,
                loadMore: true,
                loading: loadingTitle === loadMoreText,
                type: 'special'
            })
        }

        return finalFlattened
    }, [options, jsxOptions, stableId, createNormalizedOption, childrenFirst, hasMore, loadButton, loadingTitle, loadMoreText, emptyText, emptyOption, getLabelFromObject])

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
            toggleGroup(option.name)
            return
        }

        if (option.disabled || option.loadMore) {
            e?.stopPropagation()
            e?.preventDefault()
            if (option.loadMore) {
                setLoadingTitle(loadMoreText)
                loadMore()
            }
            return
        }
        setSelectedId(option.id)
        onChange?.(option.original, option.userId)
        setVisibility(false)
    }, [onChange, setVisibility, loadMore, loadMoreText, setLoadingTitle])

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
        expandedGroups, toggleGroup, visibleOptions: normalizedOptions.filter(o => !o.hidden)
    }
}

export default useSelectLogic