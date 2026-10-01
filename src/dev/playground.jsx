import {lazy, Suspense, useEffect, useRef, useState} from 'react'
import {Play} from 'lucide-react'

const Live = lazy(() => import('./live'))

const holder = <div className='rac-live-container rac-live-holder'/>

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
    <section
        style={{
            borderBottom: '0.1px solid rgba(168, 85, 247, 0.3)'
        }}
        className='rac-playground'
        id='playground'
        ref={section}
    >

        <div className='rac-code-title-container'>
            <div className='rac-code-icon'>
                <Play style={{color: 'rgb(220, 220, 170)'}}/>
            </div>
            <h3 className='rac-code-title'>
                Interactive Playground
            </h3>
        </div>

        <p className='rac-code-desc'>
          Experiment with props, icons, and logic in real-time.
          Modify the code below and watch the component update instantly.
        </p>

        {near ? <Suspense fallback={holder}><Live/></Suspense> : holder}
    </section>
  )
}

export default Playground
