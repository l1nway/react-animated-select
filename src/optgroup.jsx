import {useContext, useEffect, useMemo, createContext} from 'react'
import {SelectContext} from './selectContext'
import {makeId} from './makeId'

export const GroupContext = createContext(null)

export default function OptGroup({children, name, label, value, id, emptyGroupText = 'Empty group'}) {
    const ctx = useContext(SelectContext)

    const groupName = useMemo(() => {
        const val = name ?? label ?? value ?? id
        return (val !== undefined && val !== null && val !== '') ? String(val) : emptyGroupText
    }, [name, label, value, id, emptyGroupText])

    const groupId = useMemo(() => `group-marker-${makeId(groupName)}`, [groupName])

    useEffect(() => {
        if (!ctx) return

        const groupMarker = {
            id: groupId,
            group: groupName,
            isGroupMarker: true,
            disabled: true
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