import {useState, useMemo, useCallback, useId} from 'react'
import {makeId} from './makeId'

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

    // normalization list of options; converting an object or an unsuitable array into a suitable one
    const normalizedPropOptions = useMemo(() => {
        if (!options) return []

        const flat = []

        const push = (key, value, originalItem) => {
            if (typeof value === 'number' && value === 0) {
                flat.push({
                    key: '0',
                    value: 0,
                    userId: originalItem?.id ?? 0,
                    label: '0',
                    original: originalItem
                })
                return
            }

            if (typeof value == 'boolean') {
                flat.push({
                    key: `bool-${flat.length}`,
                    value,
                    userId: originalItem?.id ?? `bool-${flat.length}`,
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
                    userId: originalItem?.id ?? `empty-${flat.length}`,
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
                    userId: originalItem?.id ?? `invalid-${flat.length}`,
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
                    userId: value.id ?? value.value ?? value.name ?? key,
                    disabled: !!value.disabled,
                    label: value.name ?? value.label ?? key,
                    original: originalItem
                })
            } else {
                flat.push({
                    key,
                    value,
                    userId: key,
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
                        userId: item?.id ?? item ?? null,
                        disabled: true,
                        label: disabledOption,
                        original: item
                    })
                    continue
                }

                if (isOptionObject(item)) {
                    flat.push({
                        key: item.id ?? item.value ?? item.name ?? `opt-${flat.length}`,
                        value: item.value ?? item.id ?? item,
                        userId: item?.id ?? item?.value ?? item?.name ?? item?.label ?? item ?? null,
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

        const used = new Map()

        const makeUnique = (base) => {
            const n = used.get(base) || 0
            used.set(base, n + 1)
            return n == 0 ? base : `${base}-${n}`
        }

        return flat.map((item, i) => {
            const baseId = makeId(item.key ?? item.label ?? i, 'invalid-option', stableId)
            return {
                id: makeUnique(baseId),
                userId: item.userId ?? item.key ?? i,
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
            const uniqueId = `jsx-${stableId.replace(/:/g, '')}-${opt.id}`

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

    // option availability status
    const hasOptions = normalizedOptions.length > 0

    // select activity status
    const active = useMemo(() => (
        !error && !loading && !disabled && hasOptions
    ), [error, loading, disabled, hasOptions])

    const selected = useMemo(() => {
        const current = isControlled ? value : internalValue
        if (current === undefined || current === null) return null

        return normalizedOptions.find(o =>
            o.id === String(current) ||
            o.userId === String(current) ||
            o.raw === current ||
            o.original === current ||
            (typeof current === 'object' && current !== null && o.id === String(current.id || current.value))
        ) ?? null
    }, [isControlled, value, internalValue, normalizedOptions])

    // option selection function
    const selectOption = useCallback((option, e) => {
        if (option.disabled) {
            e.stopPropagation()
            e.preventDefault()
            return
        }
        
        if (!isControlled) {
            setInternalValue(option?.original) 
        }
        onChange?.(option?.original, option?.userId)
        
        setVisibility(false)
    }, [isControlled, onChange, setVisibility])

    // clear function of selected option    
    const clear = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!isControlled) {
            setInternalValue(null)
        }
        onChange?.(null, null)
    }, [isControlled, onChange])

    return {normalizedOptions, selected, selectOption, clear, hasOptions, active, selectedValue, placeholder, emptyText, disabledText, loadingText, errorText, disabledOption, emptyOption, invalidOption, disabled, loading, error}
}