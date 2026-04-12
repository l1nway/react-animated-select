import {useEffect, useContext, useMemo, useId} from 'react'
import {SelectContext} from './selectContext'
import {GroupContext} from './optgroup'
import getText from './getText'

export default function Option({name, label, id, value, className, style, children, disabled, group: manualGroup}) {
    const ctx = useContext(SelectContext)
    const contextGroup = useContext(GroupContext)
    
    const registerOption = ctx?.registerOption
    const unregisterOption = ctx?.unregisterOption

    const uniqueId = useId()
    const stableId = useMemo(() => {
        return id ? String(id) : uniqueId.replace(/:/g, '')
    }, [id, uniqueId])

    useEffect(() => {
        if (!registerOption) return

        const textFallback = getText(children)
        const hasJsx = children !== undefined && children !== null
        let finalLabel = ''

        if (label !== undefined && label !== null && label !== '') {
            finalLabel = String(label)
        } else if (name !== undefined && name !== null && name !== '') {
            finalLabel = String(name)
        } else if (textFallback) {
            finalLabel = textFallback
        } else if (id !== undefined && id !== null && id !== '') {
            finalLabel = String(id)
        }

        const option = {
            id: stableId,
            value: value !== undefined ? value : textFallback,
            label: finalLabel,
            jsx: children,
            hasJsx,
            className,
            style,
            disabled: !!disabled,
            group: manualGroup || contextGroup || null 
        }

        registerOption(option)
        return () => unregisterOption(stableId)
        
    }, [stableId, name, label, value, children, className, style, disabled, manualGroup, contextGroup, registerOption, unregisterOption])

    return null
}