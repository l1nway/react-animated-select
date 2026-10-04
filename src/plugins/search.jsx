import {Hammer} from 'lucide-react'
import {Soon} from '../components/code'
import {Heading} from '../components/helpers'

function SearchDemo() {
    return (
        <section className='rac-states' id='search'>
            <Heading icon={<Hammer/>} title='Search'/>
            <Soon title='search'/>
        </section>
    )
}

export default SearchDemo
