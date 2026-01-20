import {useState, useMemo, useCallback, useId, useEffect} from 'react'

export function useSelectLogic({
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
    setVisibility
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
                    isInvalid: true,
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
            }

            if (val && typeof val === 'object' && !Array.isArray(val)) {
                flat.push({
                    key: val.id ?? val.value ?? val.name ?? key ?? `obj-${flat.length}`,
                    value: val,
                    userId: computedUserId,
                    disabled: !!val.disabled,
                    label: val.name ?? val.label ?? String(key),
                    original: originalItem
                })
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
                    flat.push({ key: `dis-${index}`, value: null, userId: null, disabled: true, label: disabledOption, original: item })
                } else if (isOptionObject(item)) {
                    const stableUserId = item.id ?? (typeof item.value !== 'object' ? item.value : (item.label ?? item.name ?? item.value));
                    flat.push({
                        key: item.id ?? item.value ?? item.name ?? `opt-${index}`,
                        value: item.value !== undefined ? item.value : (item.id !== undefined ? item.id : item),
                        userId: stableUserId,
                        disabled: !!item.disabled,
                        label: item.name ?? item.label ?? String(item.id ?? item.value),
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
            isInvalid: item.isInvalid,
            type: typeof item.value === 'boolean' ? 'boolean' : 'normal'
        }))

        const jsxOpts = jsxOptions.map((opt, index) => ({
            ...opt,
            id: `jsx-${stableId.replace(/:/g, '')}-${opt.id}-${index}`,
            userId: opt.id,
            raw: opt.value,
            original: opt.value,
            name: opt.label,
            type: typeof opt.value === 'boolean' ? 'boolean' : 'normal'
        }))

        return [...propOpts, ...jsxOpts]
    }, [options, jsxOptions, stableId, emptyOption, disabledOption])

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
        if (option.disabled) {
            e?.stopPropagation()
            e?.preventDefault()
            return
        }
        
        setSelectedId(option.id)
        onChange?.(option.original, option.userId)
        setVisibility(false)
    }, [onChange, setVisibility])

    const clear = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
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