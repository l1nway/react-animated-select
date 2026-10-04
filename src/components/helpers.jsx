import {ChevronUp, TriangleAlert} from 'lucide-react'
import {chips, paging} from 'react-animated-select'

export const merge = (prev, next) => Object.keys(next).some(key => !Object.is(prev[key], next[key])) ? {...prev, ...next} : prev

export const shake = (el) => {
    el.classList.remove('--null')
    void el.offsetWidth
    el.classList.add('--null')
}

export const clearShake = (el) => el?.classList.remove('--null')

export const arrowIcons = {arrow: ChevronUp}
export const CHIPS = [chips]
export const PAGING = [paging]
export const NONE = []

export const prevent = e => e.preventDefault()

// demo options
export const options = ['Crimson', 'Azure', 'Emerald', 'Goldenrod', 'Lavender', 'Slate', 'Coral', 'Indigo', 'Mint', 'Amber'].map((label, i) => ({id: i + 1, label}))

export const numbered = (count, name = 'Option') => Array.from({length: count}, (_, i) => `${name} ${i + 1}`)

// [DOC: section-heading]
export const Title = ({icon, id, className, children}) => (
    <div className={className ? `rac-code-title-container ${className}` : 'rac-code-title-container'}>
        <div className='rac-code-icon' aria-hidden>{icon}</div>
        <h3 className='rac-code-title' id={id}>{children}</h3>
    </div>
)

export const Heading = ({icon, id, title, desc}) => (
    <>
        <Title icon={icon} id={id}>{title}</Title>
        {desc && <p className='rac-heading-desc'>{desc}</p>}
    </>
)

// framer presets
export const slide = {
    initial: {x: -25, opacity: 0},
    animate: {x: 0, opacity: 1},
    exit: {x: -25, opacity: 0},
    transition: {
        transform: {duration: 0.3, ease: [0.34, 1.5, 0.64, 1]},
        opacity: {duration: 0.2, ease: 'linear'}
    }
}

const popIn = duration => ({
    initial: {scale: 0.5, opacity: 0},
    animate: {scale: 1, opacity: 1},
    exit: {scale: 0.5, opacity: 0},
    transition: {
        transform: {duration, ease: [0.34, 1.8, 0.64, 1]},
        opacity: {duration: 0.2, ease: 'linear'}
    }
})

export const pop = popIn(0.2)
export const popSlow = popIn(0.5)

export const Warn = ({title, children}) => <span className='rac-warn rac-iconed'><TriangleAlert aria-hidden='true'/><strong>{title}:</strong><span>{children}</span></span>
