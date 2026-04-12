import {useContext, useEffect, useMemo, createContext} from 'react'
import {SelectContext} from './selectContext'
import {makeId} from './makeId'

export const GroupContext = createContext(null)

export default function OptGroup({children, name, label, value, id, disabled, emptyGroupText = 'Empty group', className = '', style = {}}) {
    const ctx = useContext(SelectContext)

    const groupName = useMemo(() => {
        const val = name ?? label ?? id ?? value
        return (val !== undefined && val !== null && val !== '') ? String(val) : emptyGroupText
    }, [name, label, value, id, emptyGroupText])

    const groupId = useMemo(() => `group-marker-${makeId(groupName)}`, [groupName])

    useEffect(() => {
        if (!ctx) return

        const groupMarker = {
            disabled: !!disabled,
            isGroupMarker: true,
            group: groupName,
            id: groupId,
            className,
            style
        }

        ctx.registerOption(groupMarker)
        return () => ctx.unregisterOption(groupId)
    }, [ctx.registerOption, ctx.unregisterOption, groupId, groupName])

    return (
        <GroupContext.Provider value={groupName}>
            {children}
        </GroupContext.Provider>
    )
}