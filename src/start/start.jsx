import {CopyButton, CodeBlock} from '../components/code'
import {useCallback, useEffect, useRef, useState} from 'react'
import {Part} from '../components/deferred'
import {setStore} from '../components/store'
import {snippet} from '../components/tokens'
import {Play} from 'lucide-react'
import Usage from './usage'

const INSTALL = snippet.bash`npm install react-animated-select`

const tryDemo = () => setStore({scrollTo: 'playground'})

function Start() {
    const [copied, setCopied] = useState(false)
    const timer = useRef()

    useEffect(() => () => clearTimeout(timer.current), [])

    const copy = useCallback((code, keyId) => {
        navigator.clipboard.writeText(code)
        setCopied(keyId)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), 2000)
    }, [])

    return (
        <article
            className='rac-section'
            id='start'
        >
            <section className='rac-main-container'>
                <h2 className='rac-start-title'>Getting started</h2>
                <p className='rac-start-desc'>A premium React select component focused on performance and reliability. Beyond its extensive feature set and deep customization options, this component is built to be exceptionally stable. It gracefully handles complex data and unexpected prop values, providing a rock-solid foundation for your application's UI.</p>
                <p className='rac-start-desc'>Go ahead — experiment with different configurations and build the perfect Select component tailored to your needs.</p>
                <label className='rac-start-label'>
                    <button
                        className='rac-start-button'
                        onClick={tryDemo}
                    >
                        <Play/> <span>Try demo</span>
                    </button>
                </label>
                <label className='rac-code-container' tabIndex={0}>
                    <CodeBlock code={INSTALL}/>
                    <CopyButton copy={copy} code={INSTALL.text} keyId='install' copied={copied}/>
                </label>
            </section>
            <Usage copy={copy} copied={copied}/>
            <Part id='question'/>
        </article>
  )
}

export default Start
