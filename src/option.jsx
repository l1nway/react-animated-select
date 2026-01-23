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
        let finalLabel = ''

        if (typeof children === 'string' && children !== '') {
            finalLabel = children
        } else if (textFallback) {
            finalLabel = textFallback
        } else if (value !== undefined && value !== null) {
            finalLabel = String(value)
        } 

        const option = {
            id: stableId,
            value: value !== undefined ? value : textFallback,
            label: finalLabel,
            jsx: children,
            className,
            disabled: !!disabled,
            group: manualGroup || contextGroup || null 
        }

        registerOption(option)
        return () => unregisterOption(stableId)
        
    }, [stableId, value, children, className, disabled, manualGroup, contextGroup, registerOption, unregisterOption])

    return null
}