import {Part} from '../components/deferred'
import {Motion} from '../components/motion'
import {groupOf} from '../menu/components'

const SUB = groupOf('features').sub

function Features() {
    return (
        <article
            className='rac-section'
            id='features'
        >
            <Motion>
                {SUB.map(item => <Part id={item.id} key={item.id}/>)}
            </Motion>
        </article>
    )
}

export default Features
