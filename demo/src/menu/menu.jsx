import {House, MousePointer2, Mouse, Play, Loader, Sparkles, Group, Info, Eclipse, LineStyle, Atom, ListVideo, PersonStanding, Bug, FileStack, ShieldCogCorner, Cpu, PawPrint, BadgeQuestionMark} from 'lucide-react'
import {useRef, useLayoutEffect, useEffect, useState, useMemo, useCallback} from 'react'
import {showEyes, clearScrollTarget} from '../components/store'
import {containerVariants, itemVariants} from './components'
import {useSelector, useDispatch} from 'react-redux'
import {ScrollToPlugin} from 'gsap/ScrollToPlugin'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {AnimatePresence, m} from 'framer-motion'
import {gsap} from 'gsap'

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger)

function Menu() {
    const dispatch = useDispatch()
    const scrollTarget = useSelector(state => state.cat.scrollTo)

    const autoScroll = useRef(false)

    const [opacity, setOpacity] = useState(0.25)

    const [menu, setMenu] = useState([{
        text: 'Getting started',
        selected: false,
        icon: <House/>,
        id: 'start',
        sub: [{
            icon: <MousePointer2/>,
            text: 'Basic usage',
            selected: false,
            id: 'basic'
        }, {
            text: 'Advanced usage',
            selected: false,
            icon: <Mouse/>,
            id: 'advanced'
        }, {
            text: 'Ask a question',
            selected: false,
            icon: <BadgeQuestionMark/>,
            id: 'question'
        }]
    }, {
        icon: <Sparkles/>,
        text: 'Features',
        id: 'features',
        sub: [{
            text: 'Accessibility (A11y)',
            icon: <PersonStanding/>,
            selected: false,
            id: 'a11y'
        }, {
            icon: <ShieldCogCorner/>,
            selected: false,
            text: 'Safety',
            id: 'safety'
        }, {
            text: 'Component States',
            selected: false,
            icon: <Info/>,
            id: 'states'
        }, {
            text: 'Multiple Options',
            selected: false,
            icon: <FileStack/>,
            id: 'multiple'
        }, {
            text: 'Grouping Options',
            selected: false,
            icon: <Group/>,
            id: 'grouping'
        }, {
            icon: <Loader className='rac-loader'/>,
            text: 'Infinite Loading',
            id: 'loading'
        }]
    }, {
        text: 'Customization',
        icon: <Eclipse/>,
        selected: false,
        id: 'custom',
        sub: [{
            text: 'Styling & Variables',
            selected: false,
            icon: <LineStyle/>,
            id: 'styling'
        }, {
            text: 'Icons',
            selected: false,
            icon: <Atom/>,
            id: 'icons'
        }, {
            icon: <ListVideo/>,
            text: 'Animations',
            id: 'animations'
        }]
    }, {
        selected: false,
        text: 'Dev Hub',
        icon: <Cpu/>,
        id: 'dev',
        sub: [{
            selected: false,
            text: 'Debug',
            icon: <Bug/>,
            id: 'debug'
        }, {
            text: 'Playground',
            selected: false,
            icon: <Play/>,
            id: 'playground'
        }, {
            text: 'Author',
            selected: false,
            icon: <PawPrint/>,
            id: 'author'
        }]
    }, ])

    const setActiveStateRef = useRef()

    const setActiveState = useCallback((id) => {
        setMenu(prev => prev.map(item => {
            const subActive = item.sub?.some(s => s.id === id)

            return {
                ...item,
                selected: item.id === id || subActive,
                sub: item.sub?.map(s => ({
                    ...s,
                    selected: s.id === id
                }))
            }
        }))
    }, [])
    
    const handleMenuClick = (element) => {
        element.onClick && element.onClick()
        autoScroll.current = true
        setActiveState(element.id)

        document.title = `${element.text} — react-animated-select`

        const scroll = () => {
            const target = document.querySelector(`#${element.id}`)
            if (!target) return requestAnimationFrame(scroll)

            gsap.to(window, {
                onComplete: () => autoScroll.current = false,
                scrollTo: {y: target, offsetY: 20},
                ease: 'power2.inOut',
                duration: 0.8,
            })
        }

        scroll()
    }

    useEffect(() => {
        if (scrollTarget) {
            const targetElement = menu.flatMap(item => [item, ...(item.sub || [])]).
                find(i => i.id === scrollTarget)

            targetElement && handleMenuClick(targetElement)
            dispatch(clearScrollTarget())
        }
    }, [scrollTarget, menu])

    useLayoutEffect(() => {
        setActiveStateRef.current = setActiveState

        const timer = setTimeout(() => {
            const allItems = menu.flatMap(item => [item, ...(item.sub || [])]).filter(i => i.id)

            ScrollTrigger.create({
                onUpdate: (self) => {
                    if (Math.abs(self.getVelocity()) > 10) {
                        setOpacity(0.25)
                    }
                }
            })

            allItems.forEach((item) => {
                const element = document.querySelector(`#${item.id}`)
                if (!element) return

                ScrollTrigger.create({
                    trigger: element,
                    start: 'top center', 
                    end: 'bottom center',
                    onToggle: (self) => {
                        if (!autoScroll.current && self.isActive) {
                            setActiveStateRef.current(item.id)
                        }
                    },
                    onEnter: () => {
                        document.title = `${item.text} — react-animated-select`
                        if (item.id === 'playground') {dispatch(showEyes())}
                    },
                    onEnterBack: () => {
                        document.title = `${item.text} — react-animated-select`
                    },
                    fastScrollEnd: true,
                    refreshPriority: item.id === 'playground' ? 3 : 1,
                })
            })

            ScrollTrigger.refresh()
        }, 100)

        return () => {
            clearTimeout(timer)
            ScrollTrigger.getAll().forEach(t => t.kill())
        }
    }, [])

    const renderMenu = useMemo(() => {
        return (menu.map((element, index) => {
            const isParentActive = element.selected || element.sub?.some(s => s.selected)
            return (
                <li key={element.id}>
                    <a
                        className={`${element.selected ? '--selected' : ''} rac-menu-element`}
                        onClick={(e) => {
                            e.preventDefault()
                            handleMenuClick(element)
                        }}
                        href={`/${element.id}`}
                        key={element.text}
                        tabIndex={-1}
                    >
                        {element?.icon} 
                        <span className='rac-menu-text'>{element.text}</span>
                    </a>
                    <AnimatePresence initial={false}>
                        {element.sub && isParentActive && (
                            <m.ul
                                className='rac-menu-sub-container'
                                variants={containerVariants}
                                key={`${element.id}-sub`}
                                style={{originY: 0}}
                                animate='visible'
                                initial='hidden'
                                exit='hidden'
                            >
                                {element.sub.map(subItem => (
                                    <m.li
                                        className={`${subItem.selected ? '--selected' : ''} rac-menu-element`}
                                        onClick={() => handleMenuClick(subItem)}
                                        variants={itemVariants}
                                        key={subItem.id}
                                    >
                                        {subItem?.icon}
                                        <span className='rac-menu-text'>{subItem.text}</span>
                                    </m.li>
                                ))}
                            </m.ul>
                        )}
                    </AnimatePresence>
                </li>
    )}))}, [menu])

    return (
        <aside
            style={{'--mobile-menu': opacity}}
            onTouchStart={() => setOpacity(1)}
            className='rac-menu'
        >
            <nav>
                <ul>
                    {renderMenu}
                </ul>
            </nav>
        </aside>
    )
}
export default Menu