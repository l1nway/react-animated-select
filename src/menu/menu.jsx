import {MENU, ITEMS, groupOf} from './components'
import {setStore, subscribe, getStore, useStore, PARTS, showAll} from '../components/store'
import {useRef, useEffect, useState, useCallback, memo} from 'react'
import './menu.css'
import './nav.css'

const EDITABLE = 'input:not([type=checkbox], [type=radio], [type=range], [type=button], [type=submit], [type=reset], [type=color], [type=file], [readonly]), textarea:not([readonly]), [contenteditable]:not([contenteditable=false])'

const setTitle = item => {document.title = `${item.text} — react-animated-select`}

const Link = memo(function Link({item, selected, className = '', onPick}) {
    const Icon = item.icon
    return (
        <a
            className={`${selected ? '--selected' : ''} rac-menu-element ${className}`}
            aria-current={selected ? 'location' : undefined}
            onClick={e => {e.preventDefault(); onPick(item)}}
            href={`#${item.id}`}
        >
            <Icon aria-hidden='true'/>
            <span className='rac-menu-text'>{item.text}</span>
            {item.short && <span className='rac-menu-short'>{item.short}</span>}
        </a>
    )
})

function Menu() {
    const [active, setActive] = useState(null)
    const [keyboard, setKeyboard] = useState(false)
    const [entered, setEntered] = useState(false)

    const mounted = useStore(state => state.mounted)
    const autoScroll = useRef(false)
    const release = useRef(null)
    const observer = useRef(null)

    const group = groupOf(active)
    const index = MENU.indexOf(group)

    const pick = useCallback(item => {
        autoScroll.current = true
        setActive(item.id)
        setTitle(item)

        // wait for parts to settle
        const waiting = PARTS.some(id => !document.getElementById(id))
        let frames = 0, settled = 0
        const scroll = () => {
            const target = document.getElementById(item.id)
            settled = target && PARTS.every(id => document.getElementById(id)) ? settled + 1 : 0
            if (waiting && settled < 3 && ++frames < 180) return requestAnimationFrame(scroll)
            if (!target) return

            // scroll end guard
            release.current?.()
            const done = () => {
                autoScroll.current = false
                release.current()
            }
            const timer = setTimeout(done, 1500)
            release.current = () => {
                clearTimeout(timer)
                removeEventListener('scrollend', done)
                release.current = null
            }
            addEventListener('scrollend', done)

            scrollTo({
                behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
                top: target.getBoundingClientRect().top + scrollY - 20
            })
        }

        waiting && showAll()
        scroll()
    }, [])

    useEffect(() => () => release.current?.(), [])

    // scroll requests
    useEffect(() => subscribe(() => {
        const id = getStore().scrollTo
        if (!id) return
        setStore({scrollTo: null})
        const item = ITEMS.find(i => i.id === id)
        item && pick(item)
    }), [pick])

    // section tracking
    useEffect(() => {
        observer.current = new IntersectionObserver(entries => entries.forEach(({isIntersecting, target, boundingClientRect}) => {
            const item = isIntersecting && ITEMS.find(i => i.id === target.id)
            if (!item) return
            setTitle(item)
            !autoScroll.current && setActive(item.id)
            item.id === 'playground' && boundingClientRect.top > 0 && setStore({cat: 'show'})
        }), {rootMargin: '-50% 0px -50% 0px'})
        return () => observer.current.disconnect()
    }, [])

    useEffect(() => {ITEMS.forEach(item => {const el = document.getElementById(item.id); el && observer.current.observe(el)})}, [mounted])

    // keyboard guard
    useEffect(() => {
        const coarse = matchMedia('(pointer: coarse)')
        const update = el => setKeyboard(coarse.matches && !!el?.matches?.(EDITABLE))
        const onIn = e => update(e.target)
        const onOut = e => update(e.relatedTarget)

        document.addEventListener('focusin', onIn)
        document.addEventListener('focusout', onOut)
        return () => {
            document.removeEventListener('focusin', onIn)
            document.removeEventListener('focusout', onOut)
        }
    }, [])

    return (
        <aside
            className='rac-menu rac-enter'
            data-keyboard={keyboard || undefined}
            data-entered={entered || undefined}
            onAnimationEnd={e => e.target === e.currentTarget && setEntered(true)}
        >
            <nav aria-label='Sections'>
                {index >= 0 && <span className='rac-menu-indicator rac-pill' style={{'--index': index, '--count': MENU.length}} aria-hidden='true'/>}
                <ul className='rac-menu-list'>
                    {MENU.map((item, i) => (
                        <li className='rac-enter' style={{'--i': i}} key={item.id}>
                            <Link item={item} selected={item === group} className='rac-menu-group' onPick={pick}/>
                            <div className='rac-menu-sub-container' data-open={item === group || undefined} inert={item !== group}>
                                <ul>
                                    {item.sub.map((sub, i) => (
                                        <li key={sub.id} style={{'--i': i}}>
                                            <Link item={sub} selected={sub.id === active} onPick={pick}/>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    )
}

export default Menu
