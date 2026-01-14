import {useEffect, useContext} from 'react'
import {SelectContext} from './selectContext'
import {makeId} from './makeId'
import getText from './getText'

export default function Option({value, id, className, children, disabled}) {
    const ctx = useContext(SelectContext)

    useEffect(() => {
        if (!ctx) return

        const textFallback = getText(children)
        
        const option = {
            id: String(id ?? makeId(String(textFallback))),
            value: value !== undefined ? value : textFallback,
            label: typeof children === 'string' ? children : String(value ?? id),
            jsx: children,
            className,
            disabled: !!disabled
        }

        ctx.registerOption(option)
        return () => ctx.unregisterOption(option.id)
    }, [id, value, children, className, disabled])

    return null
}