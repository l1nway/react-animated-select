// [DOC: chip-geometry]
const SLOT = 'rac-chip-slot'
const FLIP = 'rac-flip'
const RESIZE = 'rac-resize'
export const NONE = []
// [DOC: chip-resize]
const STILL = {overflow: 'hidden', textOverflow: 'clip', boxSizing: 'border-box', minWidth: '0px', maxWidth: 'none', minHeight: '0px', maxHeight: 'none'}

const REDUCED = '(prefers-reduced-motion: reduce)'
export const reducedMotion = () => !!window.matchMedia?.(REDUCED).matches
export const watchMotion = (callback) => {
    const query = window.matchMedia?.(REDUCED)
    query?.addEventListener('change', callback)
    return () => query?.removeEventListener('change', callback)
}
export const slotsOf = (parent) => Array.from(parent.children).filter(el => el.classList.contains(SLOT))
const labelOf = (slot) => slot.firstElementChild?.firstElementChild
const scripted = (el, test) => !!el?.getAnimations?.().some(a => a.constructor === Animation && test(a))
const running = (el, test) => scripted(el, a => a.playState === 'running' && test(a))
// [DOC: chip-resize]
export const isResizing = (value) => slotsOf(value).some(el => running(labelOf(el), a => a.id === RESIZE))
// collapse and resize animations
export const isBusy = (value) => Array.from(value.children).some(el => running(el, a => a.id !== FLIP)) || isResizing(value)
const sameList = (a, b) => a.length === b.length && a.every((item, i) => item === b[i])

// [DOC: chip-layout]
const rowsOf = (slots) => {
    const rows = []
    let bottom = -Infinity
    for (const el of slots) {
        const rect = el.getBoundingClientRect()
        if (rect.top >= bottom - 1) {
            rows.push([])
            bottom = rect.bottom
        }
        rows.at(-1).push(el)
        bottom = Math.max(bottom, rect.bottom)
    }
    return rows
}

// [DOC: chip-hold]
const ghostRows = (value, held, reserve, ids, floor) => {
    const ghost = value.cloneNode(true)
    const {height, paddingInlineEnd} = getComputedStyle(value)
    // [DOC: chip-resize]
    const fixed = floor ? '' : `height: ${height}; min-height: 0;`
    ghost.style.cssText = `visibility: hidden; pointer-events: none; ${fixed} padding-inline-end: calc(${paddingInlineEnd} + ${reserve}px)`
    ghost.querySelectorAll(`:scope > :not(.${SLOT})`).forEach(el => el.remove())
    if (ids) slotsOf(ghost).forEach(el => ids.has(el.dataset.id) || el.remove())
    // [DOC: delete-reserve]
    if (reserve) ghost.querySelectorAll('.rac-chip-del').forEach(el => el.remove())
    const slots = slotsOf(ghost)
    // [DOC: chip-resize]
    slots.forEach(el => floor?.has(el.dataset.id) && Object.assign(labelOf(el)?.style ?? {}, {minWidth: floor.get(el.dataset.id), boxSizing: 'border-box'}))
    const order = new Map(slots.map((el, index) => [el.dataset.id, index]))
    // rebuild held boundaries
    held?.slice(1).forEach((row, index) => {
        const start = Math.min(...row.map(id => order.get(id) ?? Infinity))
        const end = Math.max(...held[index].map(id => order.get(id) ?? -1).filter(at => at < start))
        if (end >= 0) slots[end].after(Object.assign(document.createElement('div'), {className: 'rac-spacer'}))
    })
    // [DOC: trigger-width]
    value.style.position = 'absolute'
    value.after(ghost)
    ghost.getAnimations?.({subtree: true}).forEach(a => a.effect?.getComputedTiming().endTime < Infinity && a.finish())
    const rows = rowsOf(slots).map(row => row.map(el => el.dataset.id))
    const fit = ghost.offsetHeight
    ghost.remove()
    value.style.position = ''
    return {rows, fit}
}

// [DOC: chip-hold]
const breaksOf = (store, rows) => {
    const next = rows ? rows.slice(0, -1).map(row => row.at(-1)) : NONE
    const {breaks} = store.get()
    return sameList(breaks, next) ? breaks : next
}

// [DOC: delete-reserve]
export const restBreaks = (store, value, chips, reserve) =>
    breaksOf(store, reserve && chips.length ? ghostRows(value, null, reserve, new Set(chips.map(chip => chip.id))).rows : null)

// [DOC: chip-hold]
export const freeze = (store, value, hold) => {
    const {rows, fit} = ghostRows(value, hold.rows, hold.reserve, null, hold.floor)
    Object.assign(hold, {rows, fit: hold.floor ? fit : null})
    store.set({held: true, breaks: breaksOf(store, rows)})
}

// [DOC: chip-hold]
export const snapOf = (value, sized) => new Map(slotsOf(value).map(el => {
    const {left, top} = el.getBoundingClientRect()
    const label = sized && labelOf(el)
    return [el, {left, top, label: label ? boxOf(label) : null}]
}))

// [DOC: chip-hold]
export const flip = (el, from, duration, easing) => {
    if (!el.animate) return
    el.getAnimations().forEach(a => a.id === FLIP && a.cancel())
    const to = el.getBoundingClientRect()
    const x = from.left - to.left, y = from.top - to.top
    if (Math.abs(x) > 0.5 || Math.abs(y) > 0.5) el.animate([{transform: `translate(${x}px, ${y}px)`}, {transform: 'none'}], {id: FLIP, duration, easing})
}

// [DOC: chip-resize]
const boxOf = (el) => {
    const style = getComputedStyle(el)
    const sum = (...keys) => `${keys.reduce((total, key) => total + parseFloat(style[key]), 0)}px`
    return style.boxSizing === 'border-box' ? {width: style.width, height: style.height} : {
        width: sum('width', 'paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'),
        height: sum('height', 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth')
    }
}

// [DOC: chip-resize]
export const resizesOf = (snap) => {
    const found = []
    snap.forEach(({label: from}, slot) => {
        const el = from && slot.isConnected && labelOf(slot)
        if (!el?.animate || scripted(slot, a => a.id !== FLIP)) return
        el.getAnimations().forEach(a => a.id === RESIZE && a.cancel())
        found.push({id: slot.dataset.id, el, from})
    })
    const moved = (a, b) => Math.abs(parseFloat(a) - parseFloat(b)) > 0.5
    return found.map(run => ({...run, to: boxOf(run.el)})).filter(({from, to}) => moved(from.width, to.width) || moved(from.height, to.height))
}

// [DOC: chip-resize]
export const resize = (runs, duration, easing, onfinish) => runs.forEach(({el, from, to}) => {
    el.animate([{...STILL, ...from}, {...STILL, ...to}], {id: RESIZE, duration, easing}).onfinish = onfinish
})

// [DOC: value-height]
export const followHeight = (root, memo, value, duration, easing, pin) => {
    if (!root || value === memo.value) return
    const style = getComputedStyle(root)
    const from = memo.anim ? style.height : memo.root
    memo.anim?.cancel()
    // [DOC: chip-resize]
    if (pin) Object.assign(pin.style, {height: `${value}px`, boxSizing: 'border-box'})
    memo.root = style.height
    if (pin) Object.assign(pin.style, {height: '', boxSizing: ''})
    const skip = !memo.value || from === memo.root || !root.animate || reducedMotion()
    memo.value = value
    memo.anim = null
    if (skip) return
    const frame = {overflow: 'hidden', alignItems: 'flex-start'}
    const anim = memo.anim = root.animate([{...frame, height: from}, {...frame, height: memo.root}], {duration, easing})
    anim.onfinish = () => {if (memo.anim === anim) memo.anim = null}
}
