import {Part} from '../components/deferred'
import {Motion} from '../components/motion'
import {groupOf} from '../menu/components'

const SUB = groupOf('custom').sub

function Customization() {
    return (
        <article
            className='rac-section'
            id='custom'
        >
            <Motion>
                {SUB.map(item => <Part id={item.id} key={item.id}/>)}
            </Motion>
        </article>
    )
}

export default Customization
