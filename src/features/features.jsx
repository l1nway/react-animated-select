import Grouping from './grouping'
import Multiple from './multiple'
import Loading from './loading'
import States from './states'
import Safety from './safety'
import {Motion} from '../components/motion'
import A11y from './a11y'

function Features() {
    return (
        <article
            className='rac-section'
            id='features'
        >
            <Motion>
                <A11y/>
                <Safety/>
                <States/>
                <Multiple/>
                <Grouping/>
                <Loading/>
            </Motion>
        </article>
    )
}
    
export default Features