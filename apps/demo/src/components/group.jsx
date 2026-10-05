import {Part} from './deferred'
import {Motion} from './motion'
import {groupOf} from '../menu/components'

// [DOC: group-part]
function Group({id}) {
    return (
        <article className='rac-section' id={id}>
            <Motion>
                {groupOf(id).sub.map(item => <Part id={item.id} key={item.id}/>)}
            </Motion>
        </article>
    )
}

export default Group
