import Grouping from './grouping'
import Multiple from './multiple'
import Loading from './loading'
import States from './states'
import Safety from './safety'
import A11y from './a11y'

function Features() {
    return (
        <article
            className='rac-section'
            id='features'
        >
            <A11y/>
            <Safety/>
            <States/>
            <Multiple/>
            <Grouping/>
            <Loading/>
        </article>
    )
}
    
export default Features