import {useEffect, useRef, useLayoutEffect, useState, Fragment} from 'react'
import {ScrambleTextPlugin} from 'gsap/ScrambleTextPlugin'
import Menu from './menu'
import {gsap} from 'gsap'

gsap.registerPlugin(ScrambleTextPlugin)

function useRefs() {
    const refs = useRef({})
    const register = (name) => (el) => {
        if (el) refs.current[name] = el
    }
    return [refs.current, register]
}

const texts = {
    desc: 'A lightweight, high-performance, and fully customizable Select component for React. Featuring smooth CSS animations, accessible keyboard navigation, and flexible option rendering.',
    title: 'react-animated-select'
}

function Header() {
    const [animating, setAnimating] = useState(true)

    const [refs, reg] = useRefs()

    useLayoutEffect(() => {
        if (!refs.textsSize || !refs.ghostTitle || !refs.ghostDesc) return
        
        const syncSizes = () => {
            requestAnimationFrame(() => {
                refs.ghostTitle.style.display = 'block'
                refs.ghostDesc.style.display = 'block'

                const titleHeight = refs.ghostTitle.offsetHeight
                const descHeight = refs.ghostDesc.offsetHeight
                const maxWidth = Math.max(refs.ghostTitle.offsetWidth, refs.ghostDesc.offsetWidth)

                refs.textsSize.style.width = `${maxWidth}px`
                refs.desc.style.height = `${descHeight}px`
                refs.title.style.height = `${titleHeight}px`

                refs.ghostTitle.style.display = 'none'
                refs.ghostDesc.style.display = 'none'
            })
        }

        const ro = new ResizeObserver(() => syncSizes())
            ro.observe(refs.ghostTitle)
            ro.observe(refs.ghostDesc)
            syncSizes()

            refs.textsSize._ro = ro
            return () => ro.disconnect()
    }, [])

    useEffect(() => {
        const tl = gsap.timeline({
            onComplete: () => {
                if (refs.textsSize && refs.textsSize._ro) {
                    refs.textsSize._ro.disconnect()
                }

                gsap.set([refs.textsSize, refs.title, refs.desc], {
                    clearProps: 'width,height'
                })

                setAnimating(false)
            }
        })

      const animations = [
          {
            className: 'rac-lib-title',
            text: texts.title,
            ref: refs.title,
            duration: 3,
            split: true,
            speed: 0.1,
          }, {
            className: 'rac-lib-desc',
            text: texts.desc,
            ref: refs.desc,
            split: false,
            duration: 5,
            speed: 1
          }
      ]

      animations.forEach(({ref, text, duration, speed, split, className}) => {
          if (!ref) return

          tl.to(ref, {
              duration,
              scrambleText: {
                  chars: '!@#$%^&*()_+-=[]{}|;:,.<>?/',
                  oldClass: 'rac-lib-temp',
                  newClass: className,
                  speed,
                  text
              },
              ease: 'power2.inOut',
              onUpdate: function() {
                const currentText = ref.innerText
                if (split) {
                  ref.innerHTML = currentText
                    .split('')
                    .map(char => {
                      if (char === ' ') return '&nbsp;'
                      return `<span class='${className}'>${char}</span>`
                    })
                    .join('')
                } else {
                  ref.innerHTML = `<span class='${className}'>${currentText}</span>`
                }
              }
            }, '-=0.5')
      })

      return () => tl.kill()
    }, [])

    return (
      <header className='rac-header'>
        <div className='rac-main-text' ref={reg('textsSize')}>
            {animating &&
                <Fragment>
                    <h1 className='rac-lib-title' ref={reg('ghostTitle')}>{texts.title}</h1>
                    <p className='rac-lib-desc' ref={reg('ghostDesc')}>{texts.desc}</p>
                </Fragment>
            }
            <h1
                className='rac-title-container'
                ref={reg('title')}
            >
                {texts.title}
            </h1>
            <p ref={reg('desc')}/>
        </div>
        <Menu/>
      </header>
    )
}

export default Header