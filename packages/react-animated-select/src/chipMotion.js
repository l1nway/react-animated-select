import {slotsOf} from './chipGeometry'

// [DOC: chip-geometry]
const FLIP = 'rac-flip'
const RESIZE = 'rac-resize'
const DRESS = 'rac-dress'
const SLOT = 'rac-chip-slot'
const DEL = 'rac-chip-del'
// [DOC: chip-resize]
const STILL = {overflow: 'hidden', textOverflow: 'clip', boxSizing: 'border-box', minWidth: '0px', maxWidth: 'none', minHeight: '0px', maxHeight: 'none'}
// [DOC: plugin-morph]
const DRESSED = {boxSizing: 'border-box', minHeight: '0px', maxHeight: 'none'}

const chipOf = (slot) => slot.firstElementChild
const labelOf = (slot) => chipOf(slot)?.firstElementChild
const scripted = (el, test) => !!el?.getAnimations?.().some(a => a.constructor === Animation && test(a))
const running = (el, test) => scripted(el, a => a.playState === 'running' && test(a))
// [DOC: chip-resize]
export const isResizing = (value) => slotsOf(value).some(el => [chipOf(el), labelOf(el)].some(part => running(part, a => a.id === RESIZE)))
// collapse and resize animations
export const isBusy = (value, dress) => Array.from(value.children).some(el => running(el, a => a.id !== FLIP)) || isResizing(value)
    // [DOC: delete-mode]
    || !!dress && Array.from(value.querySelectorAll(`.${DEL}`)).some(el => running(el, () => true))

// [DOC: chip-hold]
export const snapOf = (value, sized) => new Map(slotsOf(value).map(el => {
    const {left, top, width} = el.getBoundingClientRect()
    const label = sized && labelOf(el)
    return [el, {left, top, width, line: {top: el.offsetTop, bottom: el.offsetTop + el.offsetHeight}, label: label ? boxOf(label) : null, dress: label ? dressOf(chipOf(el), label) : null}]
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
    const style = getComputedStyle(el), {marginLeft, marginRight} = style, border = style.boxSizing === 'border-box'
    const sum = (...keys) => `${keys.reduce((total, key) => total + parseFloat(style[key]), 0)}px`
    const width = border ? style.width : sum('width', 'paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth')
    return {width, height: border ? style.height : sum('height', 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'), marginLeft, marginRight}
}

// [DOC: plugin-morph]
const LOOK = ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'marginLeft', 'marginRight', 'marginTop', 'marginBottom', 'backgroundColor', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius']
const dressOf = (chip, label) => {
    const style = getComputedStyle(chip), {content, opacity} = getComputedStyle(label, '::after')
    return {box: Object.fromEntries(LOOK.map(key => [key, style[key]])), height: boxOf(chip).height, sep: /^["']/.test(content) ? {content, opacity: +opacity} : null}
}
const moved = (a, b) => a !== b && !(Math.abs(parseFloat(a) - parseFloat(b)) <= 0.5)
const unsep = (label) => {delete label.dataset.sep; label.style.removeProperty('--rac-sep')}

// [DOC: chip-resize]
export const resizesOf = (snap) => {
    const found = []
    snap.forEach(({label: from, dress: was, width}, slot) => {
        const el = from && slot.isConnected && labelOf(slot), chip = chipOf(slot)
        if (!el?.animate || scripted(slot, a => a.id !== FLIP)) return
        // [DOC: plugin-morph]
        chip.getAnimations({subtree: true}).forEach(a => a.id === RESIZE ? a.cancel() : a.transitionProperty && a.finish())
        unsep(el)
        found.push({id: slot.dataset.id, width, el, from, chip, was})
    })
    return found.map(run => {
        const to = boxOf(run.el), now = dressOf(run.chip, run.el)
        const sized = Object.keys(to).some(key => moved(run.from[key], to[key]))
        const dressed = LOOK.some(key => moved(run.was.box[key], now.box[key]))
        const fade = !run.was.sep !== !now.sep || Math.abs((run.was.sep?.opacity ?? 0) - (now.sep?.opacity ?? 0)) > 0.01
        return {...run, to, now, sized, dressed, fade}
    }).filter(run => run.sized || run.dressed || run.fade)
}

// [DOC: chip-resize]
export const resize = (runs, duration, easing, onfinish) => {
    // [DOC: plugin-morph]
    const done = () => {runs.forEach(run => run.kept?.splice(0).forEach(anim => {anim.cancel(); unsep(run.el)})); onfinish()}
    runs.forEach(run => {
        const {el, from, to, chip, was, now, sized, dressed, fade} = run
        const temp = fade && !now.sep
        const play = (target, frames, pseudoElement) => {
            const anim = target.animate(frames, {id: RESIZE, duration, easing, pseudoElement, fill: temp ? 'forwards' : 'none'})
            anim.onfinish = done
            if (temp) (run.kept ??= []).push(anim)
        }
        if (sized) play(el, [{...STILL, ...from}, {...STILL, ...to}])
        if (dressed) play(chip, [{...DRESSED, ...was.box, height: was.height}, {...DRESSED, ...now.box, height: now.height}])
        if (!fade) return
        if (temp) {el.dataset.sep = ''; el.style.setProperty('--rac-sep', was.sep.content)}
        play(el, [{opacity: was.sep?.opacity ?? 0}, {opacity: now.sep?.opacity ?? 0}], '::after')
    })
}

// [DOC: plugin-morph]
export const padOf = (value, {paddingTop, paddingBottom} = getComputedStyle(value)) => ({paddingTop, paddingBottom})
export const repad = (value, from, duration, easing) => {
    value.getAnimations().forEach(a => a.id === RESIZE && a.cancel())
    const to = padOf(value)
    if (from && (moved(from.paddingTop, to.paddingTop) || moved(from.paddingBottom, to.paddingBottom))) value.animate([from, to], {id: RESIZE, duration, easing})
}

// [DOC: delete-mode]
const EDGES = ['marginInlineStart', 'marginInlineEnd', 'marginBlockStart', 'marginBlockEnd', 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth']
const px = (n) => `${n}px`

// [DOC: delete-mode]
const placeOf = (el) => {
    const chip = el.parentElement.getBoundingClientRect(), box = el.getBoundingClientRect(), style = getComputedStyle(el)
    const [ms, me, mbs, mbe, ...inner] = EDGES.map(key => parseFloat(style[key]) || 0)
    const start = style.direction === 'rtl' ? chip.right - box.right : box.left - chip.left
    return {ms, me, mbs, mbe, inner: style.boxSizing === 'border-box' ? 0 : inner.reduce((a, b) => a + b, 0), start, top: box.top - chip.top, width: box.width, height: box.height}
}

// [DOC: delete-mode]
const framesOf = (flow, over) => {
    const frame = (ms, me, mbs, mbe, height) => ({position: 'relative', marginInlineStart: px(ms), marginInlineEnd: px(me), marginBlockStart: px(mbs), marginBlockEnd: px(mbe), height: px(height - flow.inner)})
    const ms = flow.ms + over.start - flow.start, mbs = flow.mbs + over.top - flow.top
    return [frame(flow.ms, flow.me, flow.mbs, flow.mbe, flow.height), frame(ms, -flow.width - ms, mbs, flow.height + flow.mbs + flow.mbe - over.height - mbs, over.height)]
}

// [DOC: delete-mode]
const frameNow = (anim) => {
    const [from, to] = anim.frames, progress = anim.effect.getComputedTiming().progress ?? 0
    return Object.fromEntries(Object.keys(to).map(key => [key, key === 'position' ? to[key] : px(parseFloat(from[key]) + (parseFloat(to[key]) - parseFloat(from[key])) * progress)]))
}

// [DOC: delete-mode]
export const shift = (value, flow, duration, easing, onfinish) => {
    const live = Array.from(value.querySelectorAll(`.${SLOT} .${DEL}`)).filter(el => el.animate).map(el => {
        const anim = el.getAnimations().find(a => a.id === DRESS)
        const now = anim?.frames ? frameNow(anim) : null
        anim?.cancel()
        return {el, now, busy: running(el, () => true)}
    })
    const idle = live.filter(run => !run.busy)
    const here = idle.map(({el}) => placeOf(el))
    idle.forEach(({el}) => {el.style.position = flow ? 'absolute' : 'relative'})
    const there = idle.map(({el}) => placeOf(el))
    idle.forEach(({el}) => {el.style.position = ''})
    const play = (el, frames) => {
        const anim = el.animate(frames, {id: DRESS, duration, easing, fill: 'backwards'})
        anim.onfinish = onfinish
        return anim
    }
    live.forEach(({el, busy}) => busy && !flow && play(el, [{position: 'relative'}, {position: 'relative'}]))
    idle.forEach(({el, now}, index) => {
        const [inFlow, over] = framesOf(flow ? here[index] : there[index], flow ? there[index] : here[index])
        const frames = [now ?? (flow ? over : inFlow), flow ? inFlow : over]
        play(el, frames).frames = frames
    })
}
