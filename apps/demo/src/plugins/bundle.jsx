import {Package, FileCode, Palette} from 'lucide-react'
import {CodeBlock} from '../components/code'
import {Heading} from '../components/helpers'
import {Table} from '../components/section'

// demo data
const IMPORT = `import {Select, chips, paging} from 'react-animated-select'

<Select multiple plugins={[chips]}/>
<Select hasMore loadMore={next} plugins={[paging]}/>`
const COLUMNS = [[Package, 'Part'], [FileCode, 'JS, min / gzip'], [Palette, 'CSS, min / gzip']]
const SIZES = [['Core', '39.5 / 15.6 KB', '6.4 / 1.8 KB'], ['chips', '+15.7 / +5.6 KB', '+2.3 / +0.5 KB'], ['paging', '+1.5 / +0.5 KB', '—']]
const desc = <>Chips and async loading are plugins: a plugin you do not import is not bundled. Without <code>chips</code> a multiple Select shows its labels joined with <code>, </code>; without <code>paging</code> <code>hasMore</code>, <code>loadMore</code> and <code>loadButton</code> do nothing and warn in development. Search, virtualization and chip sorting are planned as plugins too. Sizes come from a Vite (Rollup) consumer build with React external, measured on 2026-10-07. esbuild keeps <code>chip.css</code> by design, so a build with it ships the chip styles even without the plugin.</>

function Bundle() {
    return (
        <section className='rac-states' id='bundle'>
            <Heading icon={<Package/>} id='plugins-heading' title='Plugins and bundle size' desc={desc}/>
            <CodeBlock code={IMPORT}/>
            <Table id='plugin-sizes' title='Bundle size by plugin' columns={COLUMNS}>
                {SIZES.map(([name, js, css]) =>
                    <tr key={name}><th scope='row'>{name}</th><td>{js}</td><td>{css}</td></tr>
                )}
            </Table>
        </section>
    )
}

export default Bundle
