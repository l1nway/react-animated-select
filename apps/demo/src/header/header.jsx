import {getStore} from '../components/store'
import {useLayoutEffect, useRef} from 'react'
import Menu from './menu'
import './header.css'

const TITLE = 'react-animated-select'
const WORDS = TITLE.split(/(?<=-)/).map((word, w, all) => [...word].map((char, i) => ({char, color: (all.slice(0, w).join('').length + i) % 5})))
const DESC = 'A lightweight, high-performance, and fully customizable Select component for React. Featuring smooth CSS animations, accessible keyboard navigation, and flexible option rendering.'
const CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/'

const random = () => CHARS[Math.random() * CHARS.length | 0]

const draw = (spans, progress, force) => spans.forEach((el, i) => {
    const next = i < progress * TITLE.length ? TITLE[i] : force || Math.random() < 0.15 ? random() : el.textContent
    if (el.textContent !== next) el.textContent = next
})

function Header() {
    const title = useRef(null)
    const desc = useRef(null)

    useLayoutEffect(() => {
        if (getStore().restoring || matchMedia('(prefers-reduced-motion: reduce)').matches) return
        const spans = [...title.current.querySelectorAll('.rac-lib-title')]
        const text = desc.current
        const state = {progress: 0}
        const libs = Promise.all([import('gsap'), import('gsap/ScrambleTextPlugin')])
        // fixed glyph slots
        const widths = spans.map(el => el.getBoundingClientRect().width)
        spans.forEach((el, i) => {el.style.width = `${widths[i]}px`})
        draw(spans, 0, true)
        text.textContent = ''

        const finish = () => {
            draw(spans, 1)
            spans.forEach(el => {el.style.width = ''})
        }
        let tl, timer, live = true
        const start = () => libs.then(([{gsap}, {ScrambleTextPlugin}]) => {
            if (!live) return
            gsap.registerPlugin(ScrambleTextPlugin)
            tl = gsap.timeline({onComplete: finish})
                .to(state, {progress: 1, duration: 1.5, ease: 'power2.inOut', onUpdate: () => draw(spans, state.progress)}, 0)
                .to(text, {duration: 2.5, ease: 'power2.inOut', scrambleText: {text: DESC, chars: CHARS, oldClass: 'rac-lib-temp', newClass: 'rac-lib-desc'}}, 1.25)
        }).catch(() => {finish(); text.textContent = DESC})
        // after first frame
        const frame = requestAnimationFrame(() => {timer = setTimeout(start)})

        return () => {
            live = false
            cancelAnimationFrame(frame)
            clearTimeout(timer)
            tl?.kill()
            finish()
            text.textContent = DESC
        }
    }, [])

    return (
        <header className='rac-header rac-enter'>
            <div className='rac-main-text'>
                <h1 className='rac-scramble rac-lib-heading'>
                    <span className='rac-scramble-ghost'>{TITLE}</span>
                    <span className='rac-scramble-text' ref={title} aria-hidden='true'>
                        {WORDS.map((word, w) => (
                            <span className='rac-scramble-word' key={w}>
                                {word.map(({char, color}, i) => <span className='rac-lib-title' data-color={color} key={i}>{char}</span>)}
                            </span>
                        ))}
                    </span>
                </h1>
                <p className='rac-scramble'>
                    <span className='rac-scramble-ghost'>{DESC}</span>
                    <span className='rac-scramble-text rac-lib-desc' ref={desc} aria-hidden='true'>{DESC}</span>
                </p>
            </div>
            <Menu/>
        </header>
    )
}

export default Header
