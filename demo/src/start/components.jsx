import {vscDarkPlus} from 'react-syntax-highlighter/dist/esm/styles/prism'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import {Copy, CopyCheck, MousePointer2, Mouse} from 'lucide-react'
import {m, AnimatePresence} from 'framer-motion'

// animation props
const animCopy = {
    initial: {opacity: 0, scale: 0.5},
    animate: {opacity: 1, scale: 1},
    exit: {opacity: 0, scale: 0.5},
    transition: {duration: 0.1}
}

export const animIcon = {
    base: {
        transition: {
            type: 'spring',
            stiffness: 300,
            duration: 0.4,
            damping: 20,
        },
        initial: {
            opacity: 0,
            scale: 0.8
        },
        animate: {
            scale: [0.8, 1.1, 1],
            opacity: 1,
        },
        exit: {
            opacity: 0,
            scale: 0.8
        },
    },
    twist: {
        transition: {
            type: 'spring',
            stiffness: 200,
            damping: 15
        },
        initial: {
            opacity: 0,
            scale: 0.5,
            rotate: -120,
            x: -50
        },
        exit: {
            rotate: 120,
            opacity: 0,
            scale: 0.5,
            x: 50
        },
        animate: {
            scale: [0.5, 1.1, 1],
            opacity: 1,
            rotate: 0,
            x: 0
        },
    }, 
    blur: {
        initial: {
            filter: 'blur(1.5px)',
            scale: 0.95,
            opacity: 0,
        },
        animate: {
            filter: 'blur(0px)',
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.5,
                ease: 'easeInOut',
            },
        },
        exit: {
            filter: 'blur(1.5px)',
            opacity: 0,
            scale: 0.95,
            transition: {
                duration: 0.3,
            },
        },
    },
    container: {
        initial: { 
            opacity: 0, 
            x: -10,
            background: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 100%)',
        },
        animate: { 
            opacity: 1, 
            x: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)',
            transition: {
                duration: 0.4,
                ease: 'easeOut',
                background: {duration: 0.8} 
            }
        },
        exit: { 
            opacity: 0, 
            x: 10,
            background: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 100%)',
            transition: {
                duration: 0.3,
                ease: 'easeIn'
            }
        }
    }
}

//

export const shake = (el) => {
  el.classList.remove('--null')
  void el.offsetWidth
  el.classList.add('--null')
}

export const clearShake = (el) => el?.classList.remove('--null')

export const submit = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        const form = e.currentTarget.form
        
        if (form) {
            if (!form.checkValidity()) {
                shake(e.currentTarget.parentElement)
                form.reportValidity()
            } else {
                form.requestSubmit()
            }
        }
    }
}

export const CopyButton = ({copy, code, keyId, copied}) => 
    <button
        onClick={() => copy(code, keyId)}
        className='rac-code-button'
        tabIndex={-1}
    >
        <AnimatePresence mode='wait' initial={false}>
            {copied !== keyId
                ? <m.div key='copy' {...animCopy}><Copy/></m.div>
                : <m.div key='copied' {...animCopy}><CopyCheck/></m.div>
            }
        </AnimatePresence>
    </button>

export const CodeBlock = ({code, language = 'jsx'}) => 
    <SyntaxHighlighter
        language={language} 
        style={vscDarkPlus}
        customStyle={{
            backgroundColor: '#1a1a24',
            fontSize: '0.95rem',
            padding: '16px',
            margin: 0
        }}
    >
        {code}
    </SyntaxHighlighter>

// 

const basicCode = `import {Select} from 'react-animated-select'\nimport {useState} from 'react'\n\nfunction App() {\n  const options = ['Apple', 'Banana', 'Orange', 'Strawberry']\n  const [value, setValue] = useState('Apple')\n\n  return (\n    <Select\n      options={options}\n      value={value}\n      onChange={setValue}\n    />\n  )\n}`

const advancedCode = `import {Select, Option} from 'react-animated-select'\nimport {useState} from 'react'\nimport {Zap, Shield, Star} from 'lucide-react'\n\nfunction App() {\n  const [value, setValue] = useState()\n\n  return (\n    <Select \n      placeholder='Choose plan' \n      value={value} \n      onChange={setValue}\n    >\n      <Option value='basic'><Zap/>Basic</Option>\n      <Option value='pro'><Star/>Pro</Option>\n      <Option value='enterprise' disabled><Shield/>Enterprise</Option>\n    </Select>\n  )\n}`

//
export const content = {
    basic: {
        id: 'basic',
        title: 'Basic usage',
        desc: 'The simplest way to use the component by passing an array to the options prop.',
        code: basicCode,
        icon: <MousePointer2/>
    },
    advanced: {
        id: 'advanced',
        title: 'Advanced Usage (JSX Children)',
        desc: 'For more control, use Option components as children. This allows for custom styling and complex data structures.',
        code: advancedCode,
        icon: <Mouse/>
    }
}

export const options = ['Apple', 'Banana', 'Orange', 'Strawberry']