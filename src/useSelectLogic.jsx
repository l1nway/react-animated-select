import {useState, useMemo, useCallback, useId} from 'react'

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

    // controlled select check
    const isControlled = value !== undefined

    // filled in value of the select by the user via prop
    const [internalValue, setInternalValue] = useState(defaultValue)

    // value chosenness status
    const selectedValue = isControlled ? value : internalValue

    const isOptionObject = (obj) => {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
        return (
            'id' in obj ||
            'value' in obj ||
            'name' in obj ||
            'label' in obj ||
            'disabled' in obj
        )
    }

    // normalization list of options
    const normalizedPropOptions = useMemo(() => {
        if (!options) return []

        const flat = []

        const push = (key, value, originalItem) => {
            let computedUserId = originalItem?.id ?? originalItem?.value
            if (computedUserId === undefined || computedUserId === null) {
                computedUserId = value ?? key
            }

            if (typeof value === 'number' && value === 0) {
                flat.push({
                    key: '0',
                    value: 0,
                    userId: 0,
                    label: '0',
                    original: originalItem
                })
                return
            }

            if (typeof value == 'boolean') {
                flat.push({
                    key: `bool-${flat.length}`,
                    value,
                    userId: computedUserId,
                    label: String(value),
                    type: 'boolean',
                    original: originalItem
                })
                return
            }

            if (value === '' || value === null || value === undefined) {
                flat.push({
                    key: `empty-${flat.length}`,
                    value: null,
                    userId: computedUserId ?? `empty-${flat.length}`,
                    disabled: true,
                    label: emptyOption,
                    original: originalItem
                })
                return
            }

            if (typeof value == 'function') {
                flat.push({
                    key: `invalid-${flat.length}`,
                    value: null,
                    userId: computedUserId ?? `invalid-${flat.length}`,
                    disabled: true,
                    label: invalidOption,
                    original: originalItem
                })
                return
            }

            if (value && typeof value === 'object' && !Array.isArray(value)) {
                flat.push({
                    key: value.id ?? value.value ?? value.name ?? key,
                    value,
                    userId: computedUserId,
                    disabled: !!value.disabled,
                    label: value.name ?? value.label ?? key,
                    original: originalItem
                })
            } else {
                flat.push({
                    key,
                    value,
                    userId: computedUserId,
                    label: String(value ?? key),
                    original: originalItem
                })
            }
        }

        if (Array.isArray(options)) {
            for (const item of options) {
                if (
                    item &&
                    typeof item == 'object' &&
                    !Array.isArray(item) &&
                    Object.keys(item).length == 1 &&
                    item.disabled == true
                ) {
                    flat.push({
                        key: `disabled-${flat.length}`,
                        value: null,
                        userId: null,
                        disabled: true,
                        label: disabledOption,
                        original: item
                    })
                    continue
                }

                if (isOptionObject(item)) {
                    
                    const stableUserId = item.id ?? 
                        (typeof item.value !== 'object' ? item.value : (item.label ?? item.name ?? item.value));

                    flat.push({
                        key: item.id ?? item.value ?? item.name ?? `opt-${flat.length}`,
                        value: item.value ?? item.id ?? item,
                        userId: stableUserId,
                        disabled: !!item.disabled,
                        label: item.name ?? item.label ?? String(item.id ?? item.value),
                        original: item
                    })
                }
                else if (item && typeof item == 'object') {
                    for (const [k, v] of Object.entries(item)) {
                        push(k, v, v) 
                    }
                }
                else {
                    push(item, item, item)
                }
            }
        }
        else if (typeof options == 'object') {
            for (const [k, v] of Object.entries(options)) {
                push(k, v, v)
            }
        }

        return flat.map((item, i) => {
            const internalId = `${stableId}-opt-${i}`

            return {
                id: internalId,         
                userId: item.userId,
                name: String(item.label),
                raw: item.value,
                original: item.original,
                disabled: item.disabled,
                type: typeof item.value === 'boolean' ? 'boolean' : 'normal'
            }
        })

    }, [options, stableId])

    const normalizedJsxOptions = useMemo(() => {
        return jsxOptions.map((opt, index) => {
            const uniqueId = `jsx-${stableId.replace(/:/g, '')}-${opt.id}-${index}`

            return {
                id: uniqueId,
                userId: opt.id, 
                value: opt.value,
                raw: opt.value,
                original: opt.value,
                name: opt.label,
                jsx: opt.jsx,
                disabled: opt.disabled,
                className: opt.className,
                type: typeof opt.value === 'boolean' ? 'boolean' : 'normal'
            }
        })
    }, [jsxOptions, stableId])

    const normalizedOptions = useMemo(() => {
        return [...normalizedPropOptions, ...normalizedJsxOptions]
    }, [normalizedPropOptions, normalizedJsxOptions])

    const hasOptions = normalizedOptions.length > 0

    const active = useMemo(() => (
        !error && !loading && !disabled && hasOptions
    ), [error, loading, disabled, hasOptions])

    const controlledId = useMemo(() => {
        if (!isControlled) return null
        
        if (internalValue) {
            const currentCachedOption = normalizedOptions.find(o => o.id === internalValue)
            if (currentCachedOption && currentCachedOption.userId === value) {
                return internalValue
            }
        }

        return normalizedOptions.find(o => o.userId === value)?.id ?? null
    }, [isControlled, value, normalizedOptions, internalValue])

    const selected = useMemo(() => {
        const currentId = isControlled ? controlledId : internalValue
        
        if (!currentId) return null

        return normalizedOptions.find(o => o.id === currentId) ?? null

    }, [isControlled, controlledId, internalValue, normalizedOptions])

    const selectOption = useCallback((option, e) => {
        if (option.disabled) {
            e.stopPropagation()
            e.preventDefault()
            return
        }
        
        setInternalValue(option.id) 
        
        onChange?.(option?.original, option?.userId)
        
        setVisibility(false)
    }, [onChange, setVisibility])

    const clear = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        
        setInternalValue(null)
        
        onChange?.(null, null)
    }, [onChange])

    return {normalizedOptions, selected, selectOption, clear, hasOptions, active, selectedValue, placeholder, emptyText, disabledText, loadingText, errorText, disabledOption, emptyOption, invalidOption, disabled, loading, error}
}