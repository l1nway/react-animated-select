import {Part} from '../components/deferred'
import {groupOf} from '../menu/components'

const SUB = groupOf('dev').sub

function Dev() {
    return (
        <article
            className='rac-section'
            id='dev'
        >
            {SUB.map(item => <Part id={item.id} key={item.id}/>)}
        </article>
    )
}

export default Dev
