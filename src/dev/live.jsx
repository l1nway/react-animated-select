import {Zap, Star, Shield, WandSparkles, Keyboard, Loader, ChevronUp} from 'lucide-react'
import {LiveProvider, LiveEditor, LiveError, LivePreview} from 'react-live'
import {Select, Option, OptGroup} from 'react-animated-select'
import {themes} from 'prism-react-renderer'
import {useState} from 'react'

const initialCode = `function App() {
    const [value, setValue] = useState()

    return (
        <Select
            optionsClassName='rac-playground-options'
            className='rac-playground-preview'
            icons={{arrow: ChevronUp}}
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

const scope = {useState, Select, Option, Zap, Star, Shield, WandSparkles, Keyboard, Loader, ChevronUp, OptGroup}

const Live = () =>
    <LiveProvider theme={themes.vsDark} code={initialCode} noInline={true} scope={scope}>
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

export default Live
