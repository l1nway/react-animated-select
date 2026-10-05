import {Hammer} from 'lucide-react'
import {Soon} from '../components/code'
import {Heading} from '../components/helpers'

function Virtual() {
    return (
        <section className='rac-states' id='virtual'>
            <Heading icon={<Hammer/>} title='Virtualization'/>
            <Soon title='virtualized option list'/>
        </section>
    )
}

export default Virtual
