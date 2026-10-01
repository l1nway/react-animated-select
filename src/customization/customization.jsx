import Animations from './animations'
import Styling from './styling'
import {Motion} from '../components/motion'
import Icons from './icons'

function Features() {
    return (
        <article
            className='rac-section'
            id='custom'
        >
            <Motion>
                <Styling/>
                <Icons/>
                <Animations/>
            </Motion>
        </article>
    )
}
    
export default Features