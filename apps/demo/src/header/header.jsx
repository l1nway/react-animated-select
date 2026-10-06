import {afterPaint, getStore} from '../components/store'
import {useLayoutEffect, useRef} from 'react'
import Menu from './menu'
import './header.css'

const TITLE = 'react-animated-select'
const DESC = 'A lightweight, high-performance, and fully customizable Select component for React. Featuring smooth CSS animations, accessible keyboard navigation, and flexible option rendering.'
const CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/'
// fixed start glyphs
const WORDS = TITLE.split(/(?<=-)/).map((word, w, all) => [...word].map((char, i) => {
    const at = all.slice(0, w).join('').length + i
    return {char, color: at % 5, glyph: CHARS[(at * 11 + 5) % CHARS.length]}
}))
const random = () => CHARS[Math.random() * CHARS.length | 0]

const draw = (glyphs, progress) => glyphs.forEach((el, i) => {
    const next = i < progress * TITLE.length ? TITLE[i] : Math.random() < 0.15 ? random() : el.textContent
    if (el.textContent !== next) el.textContent = next
})

// [DOC: header-intro]
function Header() {
    const title = useRef(null)
    const desc = useRef(null)

    useLayoutEffect(() => {
        const box = title.current
        const glyphs = [...box.querySelectorAll('.rac-lib-glyph')]
        const text = desc.current
        const finish = () => {delete box.dataset.glyphs}
        const done = () => {
            finish()
            text.textContent = DESC
        }
        delete text.dataset.intro
        if (getStore().restoring || matchMedia('(prefers-reduced-motion: reduce)').matches) return done()
        box.dataset.glyphs = ''
        text.textContent = ''

        const state = {progress: 0}
        let tl, live = true
        // after first paint
        afterPaint(() => live && Promise.all([import('gsap'), import('gsap/ScrambleTextPlugin')]).then(([{gsap}, {ScrambleTextPlugin}]) => {
            if (!live) return
            gsap.registerPlugin(ScrambleTextPlugin)
            tl = gsap.timeline({onComplete: finish})
                .to(state, {progress: 1, duration: 1.5, ease: 'power2.inOut', onUpdate: () => draw(glyphs, state.progress)}, 0)
                .to(text, {duration: 2.5, ease: 'power2.inOut', scrambleText: {text: DESC, chars: CHARS, oldClass: 'rac-lib-temp', newClass: 'rac-lib-desc'}}, 0)
        }).catch(done))

        return () => {
            live = false
            tl?.kill()
            done()
        }
    }, [])

    return (
        <header className='rac-header rac-enter'>
            <div className='rac-main-text'>
                <h1 className='rac-scramble rac-lib-heading'>
                    <span className='rac-scramble-ghost'>{TITLE}</span>
                    <span className='rac-scramble-text' ref={title} data-glyphs aria-hidden='true'>
                        {WORDS.map((word, w) => (
                            <span className='rac-scramble-word' key={w}>
                                {word.map(({char, color, glyph}, i) => (
                                    <span className='rac-lib-title' data-color={color} key={i}>{char}<span className='rac-lib-glyph'>{glyph}</span></span>
                                ))}
                            </span>
                        ))}
                    </span>
                </h1>
                <p className='rac-scramble'>
                    <span className='rac-scramble-ghost'>{DESC}</span>
                    <span className='rac-scramble-text rac-lib-desc' ref={desc} data-intro aria-hidden='true'>{DESC}</span>
                </p>
            </div>
            <Menu/>
        </header>
    )
}

export default Header
