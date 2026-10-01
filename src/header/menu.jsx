import {GitHub, NPM} from '../components/icons'
import {setStore} from '../components/store'
import {Play} from 'lucide-react'

const scroll = () => setStore({scrollTo: 'playground'})

const menu = [{
    href: 'https://npmjs.com/package/react-animated-select',
    icon: <NPM className='rac-header-icon' aria-hidden='true'/>,
    text: 'NPM'
}, {
    href: 'https://github.com/l1nway/react-animated-select',
    icon: <GitHub className='rac-header-icon' aria-hidden='true'/>,
    text: 'GitHub'
}, {
    icon: <Play className='rac-header-icon' aria-hidden='true'/>,
    onClick: scroll,
    text: 'Sandbox',
    button: true
}]

const Menu = () => {
  return (
    <div className='rac-header-buttons'>
        {menu.map((item, i) => (
            <div className='rac-button-container rac-enter' style={{'--i': i}} key={item.text}>
                {!item.button
                    ? <a
                        className='rac-header-link'
                        aria-label={item.text}
                        href={item.href}
                        rel='noreferrer'
                        target='_blank'
                    >
                        {item.icon}
                    </a>
                    : <button
                        className='rac-header-link'
                        aria-label={item.text}
                        onClick={item.onClick}
                    >
                        {item.icon}
                    </button>
                }
            </div>
        ))}
    </div>
  )
}

export default Menu