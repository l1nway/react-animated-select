import {Children, createContext, isValidElement, useCallback, useContext, useEffectEvent, useLayoutEffect, useMemo, useRef, useState} from 'react'
import {SelectConfigContext} from './state'

const AXES = {
    x: ['width', 'marginLeft', 'marginRight', 'paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'],
    y: ['height', 'marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth']
}
// [DOC: collapse]
const LIMITS = {x: {minWidth: '0px', maxWidth: 'none'}, y: {minHeight: '0px', maxHeight: 'none'}}

// [DOC: presence]
const PresenceContext = createContext(null)

// [DOC: collapse-group]
let batch = null
const currentBatch = () => batch ??= (queueMicrotask(() => {batch = null}), {})

// [DOC: collapse]
export function Collapse({
    as = 'div', axis = 'y', fade = false, in: inProp, unmountOnExit = true, easing: easingProp, duration: durationProp,
    group, nodeRef: externalRef, onEntered, onExited, ...rest
}) {
    const config = useContext(SelectConfigContext)
    const presence = useContext(PresenceContext)
    const byPresence = inProp === undefined && !!presence
    const shown = byPresence ? presence.present : !!inProp
    // [DOC: presence]
    const duration = durationProp ?? (config?.duration ?? 300) / (byPresence && presence.swap ? 2 : 1)
    const easing = easingProp ?? config?.easing ?? 'ease'
    const ownRef = useRef(null)
    const nodeRef = externalRef ?? ownRef
    const anim = useRef(null)
    const alive = useRef(false)
    const member = useRef({restart: () => {}})

    const [initial] = useState(() => byPresence && presence.appear ? !shown : shown)
    const last = useRef(initial)
    const [gone, setGone] = useState(!shown)
    if (shown && gone) setGone(false)

    const finish = useEffectEvent(() => {
        group?.delete(member.current)
        if (shown) {
            anim.current?.cancel()
            anim.current = null
            onEntered?.()
            return
        }
        onExited?.()
        if (byPresence) presence.onExited()
        if (unmountOnExit) {
            anim.current = null
            setGone(true)
        }
    })

    useLayoutEffect(() => {
        const el = nodeRef.current
        if (!el) return
        const props = fade ? [...AXES[axis], 'opacity'] : AXES[axis]
        // clip only while animating
        const still = {overflow: 'hidden', textOverflow: 'clip', ...LIMITS[axis]}
        const closed = {...Object.fromEntries(props.map(p => [p, p === 'opacity' ? 0 : '0px'])), ...still}
        // [DOC: collapse]
        const frame = () => {
            const {overflow} = el.style
            el.style.overflow = 'hidden'
            const computed = getComputedStyle(el)
            const box = {...Object.fromEntries(props.map(p => [p, computed[p]])), ...still}
            el.style.overflow = overflow
            return box
        }
        const play = (from, to) => {
            const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
            const animation = anim.current = el.animate([from, to], {duration: reduced ? 0 : duration, easing, fill: last.current ? 'backwards' : 'both'})
            animation.onfinish = () => {if (anim.current === animation && alive.current) finish()}
            member.current.frames = [from, to]
            if (!group) return
            // [DOC: collapse-group]
            const now = animation.timeline?.currentTime
            if (now != null) {
                animation.startTime = now
                animation.currentTime = 0
            }
            member.current.batch = currentBatch()
            group.add(member.current)
        }
        // [DOC: collapse-group]
        const current = () => {
            const [from, to] = member.current.frames
            const progress = anim.current.effect.getComputedTiming().progress ?? 0
            const value = p => parseFloat(from[p]) + (parseFloat(to[p]) - parseFloat(from[p])) * progress
            return {...Object.fromEntries(props.map(p => [p, p === 'opacity' ? value(p) : `${value(p)}px`])), ...still}
        }
        // [DOC: collapse-group]
        member.current.restart = (force) => {
            const running = anim.current
            if (running?.playState !== 'running' || (!force && member.current.batch === batch)) return
            const from = current()
            running.cancel()
            play(from, last.current ? frame() : closed)
        }

        // unchanged: hold hidden state
        if (last.current === shown) {
            if (!shown && !anim.current && el.animate) anim.current = el.animate([closed, closed], {fill: 'forwards'})
            return
        }
        last.current = shown

        const running = anim.current
        if (running?.playState === 'running') {
            // interrupted: reverse in place
            if (!group) {
                running.reverse()
                return
            }
            member.current.restart(true)
        } else {
            running?.cancel()
            if (!el.animate) {
                finish()
                return
            }
            if (shown) play(closed, frame())
            else play(frame(), closed)
        }
        // [DOC: collapse-group]
        group?.forEach(other => other !== member.current && other.restart())
    }, [shown, axis, fade, duration, easing, nodeRef, group])

    // [DOC: collapse]
    useLayoutEffect(() => {
        const self = member.current
        alive.current = true
        if (anim.current?.playState === 'running') group?.add(self)
        return () => {
            alive.current = false
            group?.delete(self)
        }
    }, [group])

    if (gone && unmountOnExit) return null

    const Tag = as
    return <Tag ref={nodeRef} {...rest}/>
}

const PresenceChild = ({id, present, appear, swap, onExited, children}) => {
    const value = useMemo(() => ({present, appear, swap, onExited: () => onExited(id)}), [id, present, appear, swap, onExited])
    return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
}

// merge next with leaving items
const sync = (list, children, wait, appear = true) => {
    const next = Children.toArray(children).filter(isValidElement)
    const keys = new Set(next.map(el => el.key))
    const known = new Map(list.map(item => [item.key, item]))
    const items = next.map(el => ({key: el.key, el, present: true, appear: known.get(el.key)?.appear ?? appear}))
    // leavers follow their old neighbour
    let at = 0
    const left = new Set()
    list.forEach(item => {
        if (keys.has(item.key)) {
            if (item.present) at = items.findIndex(next => next.key === item.key) + 1
        } else if (!item.pending) {
            const leaver = item.present ? {...item, present: false, swap: false} : item
            if (item.present) left.add(leaver)
            items.splice(at++, 0, leaver)
        }
    })
    // [DOC: presence]
    const fresh = item => item.present && (known.get(item.key)?.pending ?? !known.has(item.key))
    const waiting = wait && (left.size > 0 || list.some(item => item.pending)) && items.some(item => !item.present) && items.some(fresh)
    return {children, list: !waiting ? items : items.map(item => left.has(item) ? {...item, swap: true} : fresh(item) ? {...item, pending: true, swap: true} : item)}
}

// show waiting items
const release = (list) => list.some(item => !item.present) ? list : list.map(item => item.pending ? {...item, pending: false} : item)

// [DOC: presence]
export function Presence({children, hold = false, wait = false}) {
    const [state, setState] = useState(() => ({...sync([], children, wait, false), hold}))
    let next = state
    if (next.children !== children) next = {...next, ...sync(next.list, children, wait)}
    // release held leavers
    if (next.hold !== hold) next = {...next, hold, list: hold ? next.list : release(next.list.filter(item => item.present))}
    if (next !== state) setState(next)

    const remove = useCallback(key => setState(prev => !prev.hold && prev.list.some(item => item.key === key && !item.present)
        ? {...prev, list: release(prev.list.filter(item => item.key !== key))}
        : prev
    ), [])

    return state.list.map(({key, el, present, appear, pending, swap = false}) => !pending &&
        <PresenceChild key={key} id={key} present={present} appear={appear} swap={swap} onExited={remove}>{el}</PresenceChild>
    )
}
