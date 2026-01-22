import {useState, useMemo, useCallback, useId, useEffect} from 'react'

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

    const isOptionObject = (obj) => {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
        return ('id' in obj || 'value' in obj || 'name' in obj || 'label' in obj || 'disabled' in obj)
    }

    const normalizedOptions = useMemo(() => {
        const flat = []
        const push = (key, val, originalItem) => {
            let computedUserId = originalItem?.id ?? originalItem?.value ?? val ?? key
            
            if (typeof val === 'function') {
                flat.push({ 
                    key: `invalid-${flat.length}`, 
                    value: val, 
                    userId: null, 
                    disabled: true, 
                    invalid: true,
                    label: invalidOption, 
                    original: originalItem 
                })
                return
            }

            if (val === '') {
                flat.push({
                    key: `empty-str-${flat.length}`,
                    value: '',
                    userId: null,
                    disabled: true,
                    label: emptyOption,
                    original: originalItem
                })
                return
            }

            if (val === null || val === undefined) {
                flat.push({
                    key: `empty-${flat.length}`,
                    value: null,
                    userId: null,
                    disabled: true,
                    label: emptyOption,
                    original: originalItem
                })
                return
            }

            if (typeof val === 'number' || typeof val === 'boolean') {
                flat.push({ 
                    key: `${typeof val}-${val}-${flat.length}`, 
                    value: val, 
                    userId: computedUserId, 
                    label: String(val), 
                    original: originalItem 
                })
                return
            } else {
                flat.push({ 
                    key: key ?? `opt-${flat.length}`, 
                    value: val, 
                    userId: computedUserId, 
                    label: String(val ?? key), 
                    original: originalItem 
                })
            }
        }

        if (Array.isArray(options)) {
            options.forEach((item, index) => {
                if (item && typeof item === 'object' && Object.keys(item).length === 1 && item.disabled === true) {
                    flat.push({key: `dis-${index}`, value: null, userId: null, disabled: true, label: disabledOption, original: item})
                } else if (isOptionObject(item)) {
                    const stableUserId = item.id ?? (typeof item.value !== 'object' ? item.value : (item.label ?? item.name ?? item.value))

                    let rawLabel = item.name || item.label || item.id || item.value
                    
                    if (rawLabel === null || rawLabel === undefined || rawLabel === '') {
                        const fallbackEntry = Object.entries(item).find(([k, v]) => 
                            k !== 'disabled' && v !== null && v !== undefined && v !== ''
                        )
                        if (fallbackEntry) {
                            rawLabel = fallbackEntry[1]
                        }
                    }
    
                    const hasNoContent = rawLabel === null || rawLabel === undefined || rawLabel === ''
                    const finalLabel = hasNoContent ? emptyOption : String(rawLabel)

                    flat.push({
                        key: item.id ?? item.value ?? item.name ?? `opt-${index}`,
                        value: item.value !== undefined ? item.value : (item.id !== undefined ? item.id : item),
                        userId: stableUserId,
                        disabled: hasNoContent || !!item.disabled,
                        label: finalLabel,
                        original: item
                    })
                } else if (item && typeof item === 'object' && !Array.isArray(item)) {
                    Object.entries(item).forEach(([k, v]) => push(k, v, v))
                } else {
                    push(item, item, item)
                }
            })
        } else if (typeof options === 'object' && options !== null) {
            Object.entries(options).forEach(([k, v]) => push(k, v, v))
        }

        const propOpts = flat.map((item, i) => ({
            id: `${stableId}-opt-${i}`,
            userId: item.userId,
            name: String(item.label),
            raw: item.value,
            original: item.original,
            disabled: item.disabled,
            invalid: item.invalid,
            type: typeof item.value === 'boolean' ? 'boolean' : 'normal'
        }))

        const jsxOpts = jsxOptions.map((opt, index) => {
            const hasNoValue = opt.value === null || opt.value === undefined
            const hasNoLabel = opt.label === null || opt.label === undefined || opt.label === ''
            
            const isActuallyEmpty = hasNoValue && hasNoLabel

            return {
                ...opt,
                id: `jsx-${stableId.replace(/:/g, '')}-${opt.id}-${index}`,
                userId: opt.id,
                raw: opt.value,
                original: opt.value,
                name: isActuallyEmpty ? emptyOption : opt.label,
                disabled: opt.disabled || isActuallyEmpty,
                type: typeof opt.value === 'boolean' ? 'boolean' : 'normal'
            }
        })

        const combined = childrenFirst ? [...jsxOpts, ...propOpts] : [...propOpts, ...jsxOpts]

        if (hasMore && loadButton) {
            const isLoading = loadingTitle === loadMoreText

            combined.push({
                id: 'special-load-more-id',
                name: loadingTitle,
                loadMore: true,
                loading: isLoading,
                type: 'special'
            })
        }

        return combined
    }, [options, jsxOptions, stableId, emptyOption, disabledOption, hasMore, loadButton, loadingTitle, loadMoreText])

    const findIdByValue = useCallback((val) => {
        if (val === undefined || val === null) return null
        
        const refMatch = normalizedOptions.find(o => o.original === val || o.raw === val)
        if (refMatch) return refMatch.id

        if (typeof val === 'object') {
            try {
                const str = JSON.stringify(val)
                const structMatch = normalizedOptions.find(o => 
                    o.original && typeof o.original === 'object' && JSON.stringify(o.original) === str
                )
                if (structMatch) return structMatch.id
            } catch {}
        }

        return normalizedOptions.find(o => o.userId === val)?.id ?? null
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
    }, [value, defaultValue, isControlled, normalizedOptions, findIdByValue])

    const selected = useMemo(() => {
        return normalizedOptions.find(o => o.id === selectedId) ?? null
    }, [selectedId, normalizedOptions])

    const selectOption = useCallback((option, e) => {
        if (option.disabled || option.loadMore) {
            e?.stopPropagation()
            e?.preventDefault()

            if (loadingTitle !== loadMoreText) {
                setLoadingTitle(loadMoreText)
                loadMore()
            }

            return
        }
        
        setSelectedId(option.id)
        onChange?.(option.original, option.userId)
        setVisibility(false)
    }, [onChange, setVisibility])

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
        disabledOption, emptyOption, invalidOption, disabled, loading, error
    }
}

export default useSelectLogic