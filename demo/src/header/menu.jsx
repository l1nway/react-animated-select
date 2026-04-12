import {GitHub, NPM} from '../components/icons'
import {Play} from 'lucide-react'
import {gsap} from 'gsap'

const scroll = () => {
    const target = document.querySelector('#playground')
    if (target) {
        gsap.to(window, {
            scrollTo: {y: target, offsetY: 20},
            ease: 'power2.inOut',
            duration: 0.8,
        })
    }
}

const menu = [{
    href: 'https://npmjs.com/package/react-animated-select',
    icon: <NPM className='rac-header-icon'/>,
    text: 'NPM'
}, {
    href: 'https://github.com/l1nway/react-animated-select',
    icon: <GitHub className='rac-header-icon'/>,
    text: 'GitHub'
}, {
    icon: <Play className='rac-header-icon'/>,
    onClick: scroll,
    text: 'Sandbox',
    button: true
}]

const Menu = () => {
  return (
    <div className='rac-header-buttons'>
        {menu.map((item) => (
            <div tabIndex={0} className='rac-button-container' key={item.id}>
                {!item.button
                    ? <a tabIndex={'-1'} href={item.href} className='rac-header-link'>{item.icon}</a>
                    : <button tabIndex={'-1'} className='rac-header-link' onClick={item.onClick}>{item.icon}</button>
                }
                {/* <span className='rac-button-text'>
                    {item.text}
                </span> */}
            </div>
        ))}
    </div>
  )
}

export default Menu