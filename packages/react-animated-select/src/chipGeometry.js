// [DOC: chip-geometry]
const SLOT = 'rac-chip-slot'
const DEL = 'rac-chip-del'
export const NONE = []

export const slotsOf = (parent) => Array.from(parent.children).filter(el => el.classList.contains(SLOT))
const sameList = (a, b) => a.length === b.length && a.every((item, i) => item === b[i])

// [DOC: chip-layout]
const rowsOf = (slots, rectOf = el => el.getBoundingClientRect()) => {
    const rows = []
    let bottom = -Infinity
    for (const el of slots) {
        const rect = rectOf(el)
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
const ghostRows = (value, held, reserve, ids, floor, wide) => {
    const ghost = value.cloneNode(true)
    const {height, paddingInlineEnd} = getComputedStyle(value)
    // [DOC: chip-resize]
    const fixed = floor ? '' : `height: ${height}; min-height: 0;`
    ghost.style.cssText = `visibility: hidden; pointer-events: none; ${fixed} padding-inline-end: calc(${paddingInlineEnd} + ${reserve}px)`
    ghost.querySelectorAll(`:scope > :not(.${SLOT})`).forEach(el => el.remove())
    if (ids) slotsOf(ghost).forEach(el => ids.has(el.dataset.id) || el.remove())
    // [DOC: delete-reserve]
    if (reserve) ghost.querySelectorAll(`.${DEL}`).forEach(el => el.remove())
    // [DOC: delete-mode]
    if (wide) ghost.querySelectorAll(`.${DEL}`).forEach(el => {el.style.position = 'relative'})
    const slots = slotsOf(ghost)
    // [DOC: chip-resize]
    slots.forEach(el => floor?.has(el.dataset.id) && (el.style.minWidth = `${floor.get(el.dataset.id)}px`))
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
    const {rows, fit} = ghostRows(value, hold.rows, hold.wide ? 0 : hold.reserve, null, hold.floor, hold.wide)
    Object.assign(hold, {rows, fit: hold.floor ? fit : null})
    store.set({held: true, breaks: breaksOf(store, rows)})
}

// [DOC: delete-mode]
export const snapRows = (snap) => snap?.size ? rowsOf([...snap.keys()], el => snap.get(el).line).map(row => row.map(el => el.dataset.id)) : null
