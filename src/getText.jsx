import React from 'react'

const getText = (children) => {
    if (!children) return ''
    if (typeof children === 'string' || typeof children === 'number') return String(children)
    if (Array.isArray(children)) return children.map(getText).join(' ').replace(/\s+/g, ' ').trim()
    if (React.isValidElement(children)) return getText(children.props.children)
    return ''
}

export default getText