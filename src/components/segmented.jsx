import {memo, useLayoutEffect, useRef} from 'react'

const CSS = `
.rac-segmented {
  --rac-pill-inset: 0.25em;
  border: 1px solid #1f293780;
  background-color: #0e111a;
  grid-auto-columns: 1fr;
  grid-auto-flow: column;
  border-radius: 0.5rem;
  position: relative;
  display: grid;
}

.rac-segmented > .rac-pill {
  transition: left 350ms cubic-bezier(0.4, 0, 0.2, 1), width 350ms cubic-bezier(0.4, 0, 0.2, 1);
  left: calc(var(--x, var(--index) / var(--count)) * 100%);
  width: calc(var(--w, 1 / var(--count)) * 100%);
  will-change: auto;
  transform: none;
}

.rac-segmented-item {
  transition: color 0.3s ease, opacity 150ms ease;
  background-color: transparent;
  font-family: inherit;
  padding: 0.6em 1.1em;
  border-radius: 0.5rem;
  text-align: center;
  position: relative;
  font-size: 0.9em;
  cursor: pointer;
  color: #9ca3af;
  border: none;

  &:hover:not(:disabled, :has(:disabled)) {
    color: #f3f4f6;
  }

  &:disabled, &:has(:disabled) {
    cursor: progress;
    opacity: 0.45;
  }

  &[aria-selected='true'], &:has(:checked) {
    color: #c084fc;
  }

  &:focus-visible, &:has(:focus-visible) {
    outline: 2px solid #a78bfa;
    outline-offset: -2px;
  }
}

.rac-segmented-radio {
  position: absolute;
  cursor: pointer;
  opacity: 0;
  margin: 0;
  inset: 0;

  &:disabled {
    cursor: progress;
  }
}
`

const norm = item => typeof item === 'object' ? item : {text: item, value: item}

// roving tab keys
const roving = (e, i, count, pick) => {
    const next = {ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: count - 1}[e.key]
    if (next === undefined) return
    e.preventDefault()
    const to = (next + count) % count
    pick(to)
    e.currentTarget.parentElement.querySelectorAll('[role=tab]')[to].focus()
}

// [DOC: segmented-pill]
const place = (pill, index, still) => {
    const root = pill.parentElement, rect = root.querySelectorAll('.rac-segmented-item')[index]?.getBoundingClientRect()
    const box = root.getBoundingClientRect(), s = box.width / root.offsetWidth, pad = box.width - (root.offsetWidth - root.clientWidth) * s
    if (!rect || !pad) return
    const x = `${(rect.left - box.left - root.clientLeft * s) / pad}`, w = `${rect.width / pad}`
    if (pill.style.getPropertyValue('--x') === x && pill.style.getPropertyValue('--w') === w) return
    if (still) pill.style.transition = 'none'
    pill.style.setProperty('--x', x)
    pill.style.setProperty('--w', w)
    if (still) {pill.getBoundingClientRect(); pill.style.transition = ''}
}

// [DOC: segmented]
export const Segmented = memo(function Segmented({id, name, label, items, value, onPick, tabs, disabled, className, ...rest}) {
    const list = items.map(norm)
    const index = tabs ? value : list.findIndex(item => item.value === value)
    const pill = useRef(null), moved = useRef(false)
    useLayoutEffect(() => {
        const node = pill.current
        place(node, index, !moved.current)
        moved.current = true
        const observer = new ResizeObserver(() => place(node, index, true))
        node.parentElement.querySelectorAll('.rac-segmented-item').forEach(item => observer.observe(item))
        return () => observer.disconnect()
    }, [index, list.length])
    return (
        <div className={className ? `rac-segmented ${className}` : 'rac-segmented'} role={tabs ? 'tablist' : 'radiogroup'} aria-label={label} {...rest}>
            <style href='rac-segmented' precedence='low'>{CSS}</style>
            <span className='rac-pill' ref={pill} style={{'--index': index, '--count': list.length}} aria-hidden='true'/>
            {list.map((item, i) => tabs
                ? <button
                    onKeyDown={e => !disabled && roving(e, i, list.length, to => onPick(to, name))}
                    className='rac-segmented-item' id={`${id}-tab-${item.id}`} aria-controls={`${id}-panel`}
                    tabIndex={i === index ? 0 : -1} aria-selected={i === index} onClick={() => onPick(i, name)}
                    disabled={disabled && i !== index} data-tone={item.tone} type='button' role='tab' key={item.id}
                >
                    {item.text}
                </button>
                : <label className='rac-segmented-item' data-tone={item.tone} key={item.text}>
                    <input className='rac-segmented-radio' onChange={() => onPick(item.value, name)} checked={i === index} disabled={disabled && i !== index} name={id} type='radio'/>
                    {item.text}
                </label>
            )}
        </div>
    )
})
