import {MENU, ITEMS, groupOf, dyOf} from './components'
import {pathOf, titleOf} from './seo'
import {setStore, subscribe, getStore, PARTS, INPUT, showAll} from '../components/store'
import {Collapse} from '@l1nway/collapse'
import {useRef, useEffect, useLayoutEffect, useState, useCallback, memo} from 'react'
import './menu.css'
import './nav.css'

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
// soft keyboard fields
const TEXT = ':is(input:not([type=checkbox], [type=radio], [type=range], [type=color], [type=file], [type=button], [type=submit], [type=reset], [type=image], [type=date], [type=datetime-local], [type=month], [type=time]), textarea, [contenteditable]:not([contenteditable=false])):not([readonly], [inputmode=none])'
const FIELD = {attributeFilter: ['type', 'readonly', 'inputmode', 'contenteditable']}
const FOCUS = ['focusin', 'focusout']

const hrefOf = id => import.meta.env.BASE_URL + pathOf(id)
// group link shows its first sub
const entryOf = item => item.sub && !item.self ? item.sub[0] : item

// debounced url and title sync
let routeTimer
const setRoute = item => {
    clearTimeout(routeTimer)
    routeTimer = setTimeout(() => {
        document.title = titleOf(item)
        const url = hrefOf(item?.id) + location.search
        url !== location.pathname + location.search + location.hash && history.replaceState(history.state, '', url)
    }, 300)
}

const Link = memo(function Link({item, selected, className = '', onPick}) {
    const Icon = item.icon
    return (
        <a
            className={`${selected ? '--selected' : ''} rac-menu-element ${className}`}
            aria-current={selected ? 'location' : undefined}
            onClick={e => {if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); onPick(item)}}
            href={hrefOf(item.id)}
        >
            <Icon aria-hidden='true'/>
            <span className='rac-menu-text'>{item.text}</span>
            {item.short && <span className='rac-menu-short'>{item.short}</span>}
        </a>
    )
})

function Menu() {
    const [active, setActive] = useState(null)
    const [entered, setEntered] = useState(false)

    // [DOC: held-section]
    const held = useRef(null)
    const observer = useRef(null)
    const current = useRef(null)
    const bar = useRef(null)

    const group = groupOf(active)
    const index = MENU.indexOf(group)
    // pill fades out in place
    const slot = useRef(0)
    index >= 0 && (slot.current = index)

    const pick = useCallback(item => {
        const shown = entryOf(item)
        held.current = current.current = shown.id
        setActive(shown.id)
        setRoute(shown)

        // wait for parts to settle
        const waiting = PARTS.some(id => !document.getElementById(id))
        let frames = 0, settled = 0
        const scroll = () => {
            const target = document.getElementById(item.id)
            settled = target && PARTS.every(id => document.getElementById(id)) ? settled + 1 : 0
            if (waiting && settled < 3 && ++frames < 180) return requestAnimationFrame(scroll)
            target && scrollTo({
                behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
                top: target.getBoundingClientRect().top + scrollY - dyOf(item.id)
            })
        }

        waiting && showAll()
        scroll()
    }, [])

    // url route held, before paint
    useLayoutEffect(() => {
        const route = getStore().target?.route
        held.current = current.current = route ? entryOf(ITEMS.find(item => item.id === route)).id : null
        held.current && setActive(held.current)
        // free on visitor input
        const free = () => {getStore().restoring || (held.current = null)}
        INPUT.forEach(type => addEventListener(type, free, {passive: true}))
        return () => {
            INPUT.forEach(type => removeEventListener(type, free))
            clearTimeout(routeTimer)
        }
    }, [])

    // entrance ended before hydration
    useEffect(() => {getStore().restoring || bar.current.getAnimations?.().length || setEntered(true)}, [])

    // [DOC: mobile-bottom-bar]
    useEffect(() => {
        const root = document.documentElement
        let field = null
        const set = () => root.toggleAttribute('data-typing', !!field?.matches(TEXT))
        const watcher = new MutationObserver(set)
        const focus = e => {
            field = e.type === 'focusin' ? e.target : e.relatedTarget
            watcher.disconnect()
            field && watcher.observe(field, FIELD)
            set()
        }
        FOCUS.forEach(name => document.addEventListener(name, focus))
        return () => {
            FOCUS.forEach(name => document.removeEventListener(name, focus))
            watcher.disconnect()
            root.removeAttribute('data-typing')
        }
    }, [])

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
        const visible = new Set()
        let top = true
        let restoring = getStore().restoring
        const sync = () => {
            // paused while typing
            if (getStore().restoring || getComputedStyle(bar.current).visibility === 'hidden') return
            // held, deepest section, header root
            const item = held.current ? ITEMS.find(i => i.id === held.current) : top ? null : ITEMS.findLast(i => visible.has(i.id))
            if (!item && !top) return
            // held or own head
            const head = held.current || item?.self && document.getElementById(item.sub[0].id)?.getBoundingClientRect().top > innerHeight / 2
            // gap between subs keeps current
            const shown = item && (item.sub && !head ? item.sub.find(s => s.id === current.current) ?? item.sub[0] : item)
            current.current = shown?.id ?? null
            setActive(shown?.id ?? null)
            setRoute(shown)
        }
        observer.current = new IntersectionObserver(entries => {
            entries.forEach(({isIntersecting, target, boundingClientRect}) => {
                isIntersecting ? visible.add(target.id) : visible.delete(target.id)
                isIntersecting && target.id === 'playground' && boundingClientRect.top > 0 && setStore({cat: 'show'})
            })
            sync()
        }, {rootMargin: '-50% 0px -50% 0px'})
        const header = new IntersectionObserver(([entry]) => {
            top = entry.isIntersecting
            sync()
        }, {rootMargin: '-1px 0px 0px 0px'})
        header.observe(document.querySelector('.rac-header'))
        const unsubscribe = subscribe(() => restoring !== (restoring = getStore().restoring) && sync())
        return () => {
            observer.current.disconnect()
            header.disconnect()
            unsubscribe()
        }
    }, [])

    // observe mounted parts
    useEffect(() => {
        let last
        const observe = () => {
            const {mounted} = getStore()
            if (mounted === last) return
            last = mounted
            ITEMS.forEach(item => {const el = document.getElementById(item.id); el && observer.current.observe(el)})
        }
        observe()
        return subscribe(observe)
    }, [])

    return (
        <aside className='rac-menu rac-enter' ref={bar} data-entered={entered || undefined} onAnimationEnd={e => e.target === e.currentTarget && setEntered(true)}>
            <nav aria-label='Sections'>
                <span className='rac-menu-indicator rac-pill' data-on={index >= 0 || undefined} style={{'--index': slot.current, '--count': MENU.length}} aria-hidden='true'/>
                <ul className='rac-menu-list'>
                    {MENU.map((item, i) => (
                        <li className='rac-enter' style={{'--i': i}} key={item.id}>
                            <Link item={item} selected={item === group} className='rac-menu-group' onPick={pick}/>
                            <Collapse in={item === group} unmountOnExit={false} fade easing={EASE} className='rac-menu-sub-container' data-open={item === group || undefined} inert={item !== group}>
                                <ul>
                                    {item.sub.map((sub, i) => (
                                        <li key={sub.id} style={{'--i': i}}>
                                            <Link item={sub} selected={sub.id === active} onPick={pick}/>
                                        </li>
                                    ))}
                                </ul>
                            </Collapse>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    )
}

export default Menu
