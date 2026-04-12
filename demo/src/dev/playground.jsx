import {Zap, Star, Shield, WandSparkles, Keyboard, Loader, ChevronDown} from 'lucide-react'
import {LiveProvider, LiveEditor, LiveError, LivePreview} from 'react-live'
import {Select, Option, OptGroup} from 'react-animated-select'
import {themes} from 'prism-react-renderer'
import {Play} from 'lucide-react'
import {useState} from 'react'

const initialCode = `function App() {
    const [value, setValue] = useState()

    return (
        <Select
            optionsClassName='rac-playground-options'
            className='rac-playground-preview'
            OpenIcon={<ChevronDown/>}
            onChange={setValue}
            value={value}
        >
            <Option value='1'><Zap/> Basic Plan</Option>
            <Option value='2'><Star/> Pro License</Option>
            <Option value='3' disabled><Shield/> Enterprise</Option>
        </Select>
    )
}

render(<App/>)`

const Playground = () => {
    const scope = {useState, Select, Option, Zap, Star, Shield, WandSparkles, Keyboard, Loader, ChevronDown, OptGroup}

  return (
    <section
        style={{
            borderBottom: '0.1px solid rgba(168, 85, 247, 0.3)'
        }}
        className='rac-playground'
        id='playground'
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

        <LiveProvider
            theme={themes.vsDark}
            code={initialCode}
            noInline={true}
            scope={scope}
        >
            <div className='rac-live-container'>
                <div className='rac-live-preview-box'>
                    <LivePreview className='rac-preview-select'/>
                </div>

                <div className='rac-live-editor-box'>
                    <div className='rac-editor-header'>Editable Source</div>
                    <LiveEditor className='rac-live-editor'/>
                    <LiveError className='rac-live-error'/>
                </div>
            </div>
        </LiveProvider>
    </section>
  )
}

export default Playground