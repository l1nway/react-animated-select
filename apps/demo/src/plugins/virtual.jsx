import {Hammer} from 'lucide-react'
import {Soon} from '../components/code'
import {Heading} from '../components/helpers'

// demo data
const CODE = `// planned plugin, not released yet
import {Select, virtual} from 'react-animated-select'

<Select options={products} plugins={[virtual]}/> // 10 000 rows`
const desc = <>Today every row is mounted while the list is open, which is why opening is the slowest step in the Performance meter. A <code>virtual</code> plugin will mount only the rows in view plus an overscan, between two spacers, so your CSS keeps working. Variable heights (JSX options, wrapped text, group headers) are measured and cached, the highlighted row stays mounted for <code>aria-activedescendant</code>, and rows get <code>aria-setsize</code> / <code>aria-posinset</code>. The target is 10 000 rows.</>

function Virtual() {
    return (
        <section className='rac-states' id='virtual'>
            <Heading icon={<Hammer/>} title='Virtualization' desc={desc}/>
            <Soon title='virtualized option list' code={CODE}/>
        </section>
    )
}

export default Virtual
