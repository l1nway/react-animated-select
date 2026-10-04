import {GitHub, NPM} from '../components/icons'
import {setStore} from '../components/store'
import {Play} from 'lucide-react'

const scroll = () => setStore({scrollTo: 'playground'})

const menu = [
    {text: 'NPM', Icon: NPM, href: 'https://npmjs.com/package/react-animated-select'},
    {text: 'GitHub', Icon: GitHub, href: 'https://github.com/l1nway/react-animated-select'},
    {text: 'Sandbox', Icon: Play, onClick: scroll}
]

const Menu = () => (
    <div className='rac-header-buttons'>
        {menu.map(({text, Icon, href, onClick}, i) => {
            const Tag = href ? 'a' : 'button'
            return (
                <div className='rac-button-container rac-enter' style={{'--i': i}} key={text}>
                    <Tag className='rac-btn-glow' aria-label={text} href={href} rel={href && 'noreferrer'} target={href && '_blank'} onClick={onClick}>
                        <Icon className='rac-header-icon' aria-hidden='true'/>
                    </Tag>
                </div>
            )
        })}
    </div>
)

export default Menu
