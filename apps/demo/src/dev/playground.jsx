import {lazy, Suspense, useEffect, useRef, useState} from 'react'
import {Title} from '../components/helpers'
import {Play} from 'lucide-react'
import './playground.css'

const Live = lazy(() => import('./live'))

const CODE = `function App() {
    const [value, setValue] = useState()

    return (
        <Select icons={{arrow: ChevronUp}} onChange={setValue} value={value}>
            <Option value='1'><Zap/> Basic Plan</Option>
            <Option value='2'><Star/> Pro License</Option>
            <Option value='3' disabled><Shield/> Enterprise</Option>
        </Select>
    )
}

render(<App/>)`

// [DOC: playground-holder]
const holder =
    <div className='rac-panel rac-live-container'>
        <div className='rac-live-preview-box'/>
        <div className='rac-live-editor-box'>
            <div className='rac-editor-header'>Editable Source</div>
            <div className='rac-live-editor'><pre className='rac-live-code'>{CODE}</pre></div>
        </div>
    </div>

const Playground = () => {
    const section = useRef(null)
    const [near, setNear] = useState(false)

    // near viewport load
    useEffect(() => {
        const io = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return
            setNear(true)
            io.disconnect()
        }, {rootMargin: '1000px 0px'})
        io.observe(section.current)
        return () => io.disconnect()
    }, [])

    return (
        <section className='rac-playground' id='playground' ref={section}>
            <Title icon={<Play className='rac-playground-icon'/>}>Interactive Playground</Title>
            <p className='rac-code-desc'>
                Experiment with props, icons, and logic in real-time.
                Modify the code below and watch the component update instantly.
            </p>
            {near ? <Suspense fallback={holder}><Live code={CODE}/></Suspense> : holder}
        </section>
    )
}

export default Playground
