import {useEffect, useContext, useMemo, useId} from 'react'
import {SelectContext} from './selectContext'
import {GroupContext} from './optgroup'
import getText from './getText'

export default function Option({value, id, className, children, disabled, group: manualGroup}) {
    const ctx = useContext(SelectContext)
    const contextGroup = useContext(GroupContext)
    
    const registerOption = ctx?.registerOption;
    const unregisterOption = ctx?.unregisterOption;

    const uniqueId = useId()
    const stableId = useMemo(() => {
        return id ? String(id) : uniqueId.replace(/:/g, '')
    }, [id, uniqueId])

    useEffect(() => {
        if (!registerOption) return

        const textFallback = getText(children)
        const hasJsx = children !== undefined && children !== null
        let finalLabel = ''

        if (textFallback) {
            finalLabel = textFallback
        } else if (id !== undefined && id !== null && id !== '') {
            finalLabel = String(id)
        } else if (value !== undefined && value !== null && value !== '') {
            finalLabel = String(value)
        }

        const option = {
            id: stableId,
            value: value !== undefined ? value : textFallback,
            label: finalLabel,
            jsx: children,
            hasJsx,
            className,
            disabled: !!disabled,
            group: manualGroup || contextGroup || null 
        }

        registerOption(option)
        return () => unregisterOption(stableId)
        
    }, [stableId, value, children, className, disabled, manualGroup, contextGroup, registerOption, unregisterOption])

    return null
}