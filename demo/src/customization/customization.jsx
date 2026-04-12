import Animations from './animations'
import Styling from './styling'
import Icons from './icons'

function Features() {
    return (
        <article
            className='rac-section'
            id='custom'
        >
            <Styling/>
            <Icons/>
            <Animations/>
        </article>
    )
}
    
export default Features