import Playground from './playground'
import Author from './author'
import Debug from './debug'

function Dev() {
    return (
        <article
            className='rac-section'
            id='dev'
        >
            <Debug/>
            <Playground/>
            <Author/>
        </article>
    )
}
    
export default Dev