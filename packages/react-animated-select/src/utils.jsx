/* global process */
import {isValidElement, cloneElement} from 'react'

export const icons = {
    XMark: ({className = '', ...props}) => (
        <svg
            className={className}
            viewBox='0 0 320 512'
            fill='currentColor'
            aria-hidden='true'
            height='1em'
            width='1em'
            {...props}
        >
            <path d='M310.6 361.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L160 301.3 54.6 406.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L114.7 256 9.4 150.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 210.7 265.4 105.4c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3L205.3 256l105.3 105.4z'/>
        </svg>
    ),

    ArrowUp: ({className = '', ...props}) => (
        <svg
            className={className}
            viewBox='0 0 448 512'
            fill='currentColor'
            aria-hidden='true'
            height='1em'
            width='1em'
            {...props}
        >
            <path d='M34.9 289.5l175.9-175.8c9.4-9.4 24.6-9.4 33.9 0L420.1 289.5c15.1 15.1 4.4 41-17 41H51.9c-21.4 0-32.1-25.9-17-41z'/>
        </svg>
    ),

    Checkmark: ({className = '', ...props}) => (
        <svg
            className={className}
            viewBox='0 0 24 24'
            fill='currentColor'
            aria-hidden='true'
            height='1em'
            width='1em'
            {...props}
        >
            <path d='M20.285 6.708a1 1 0 0 0-1.414-1.416l-9.192 9.192-4.243-4.244a1 1 0 1 0-1.414 1.416l5 5a1 1 0 0 0 1.414 0l9.849-9.948z'/>
        </svg>
    )
}

// url, element or component
export const renderIcon = (Icon, defaultProps) => {
    if (!Icon) return null

    const mergeProps = (props = {}) => ({
        ...defaultProps,
        ...props,
        style: {
            ...defaultProps?.style,
            ...props?.style
        }
    })

    if (typeof Icon === 'string') return <img src={Icon} {...mergeProps()} className={withClass('rac-icon', defaultProps?.className)} alt=''/>
    if (isValidElement(Icon)) return cloneElement(Icon, mergeProps(Icon.props))
    if (typeof Icon === 'function' || (typeof Icon === 'object' && Icon.$$typeof)) {
        const IconComponent = Icon
        return <IconComponent {...mergeProps()}/>
    }
    return null
}

// [DOC: dom-ids]
export const optionDomId = (selectId, optionId) => `${selectId}-${String(optionId).replace(/[^A-Za-z0-9-]/gu, c => `_${c.codePointAt(0).toString(36)}_`)}`

// [DOC: state-attributes]
export const flag = (on) => on ? '' : undefined

export const withClass = (base, extra) => extra ? `${base} ${extra}` : base

// [DOC: option-content]
export const optionContent = (option, renderOption, selected) => option.jsx || (renderOption && 'original' in option ? renderOption(option.original, {selected, disabled: !!option.disabled}) : null)

export const dots =<span className='rac-dots' aria-hidden='true'><i/><i/><i/></span>

// [DOC: dev-warnings]
const DEV = (() => {
    try {return process.env.NODE_ENV !== 'production'} catch {return false}
})()
const warned = new Set()

// [DOC: dev-warnings]
export const warnOnce = (key, message) => {
    if (!DEV || warned.has(key)) return
    warned.add(key)
    console.warn(`[react-animated-select] ${message}`)
}

export const stopEvent = (e) => {
    e?.stopPropagation()
    e?.preventDefault()
}

// [DOC: nested-controls]
export const refocus = (e, ref) => {if (e?.currentTarget.contains(document.activeElement)) ref.current?.focus({preventScroll: true})}

const REDUCED = '(prefers-reduced-motion: reduce)'
export const reducedMotion = () => !!window.matchMedia?.(REDUCED).matches
export const watchMotion = (callback) => {
    const query = window.matchMedia?.(REDUCED)
    query?.addEventListener('change', callback)
    return () => query?.removeEventListener('change', callback)
}

// [DOC: value-height]
export const followHeight = (root, memo, value, duration, easing, pin) => {
    if (!root || value === memo.value) return
    const style = getComputedStyle(root)
    const from = memo.anim?.playState === 'running' ? style.height : memo.root
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
