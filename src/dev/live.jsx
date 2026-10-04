import {Zap, Star, Shield, WandSparkles, Keyboard, Loader, ChevronUp} from 'lucide-react'
import {LiveProvider, LiveEditor, LiveError, LivePreview} from 'react-live'
import {Select, Option, OptGroup, chips, paging} from 'react-animated-select'
import {themes} from 'prism-react-renderer'
import * as ReactModule from 'react'
import {useState} from 'react'

const createElement = (type, props, ...children) => {
    const {__self, __source, ...rest} = props || {}
    return ReactModule.createElement(type, rest, ...children)
}

const scope = {React: {...ReactModule, createElement}, useState, Select, chips, paging, Option, Zap, Star, Shield, WandSparkles, Keyboard, Loader, ChevronUp, OptGroup}

const Live = ({code}) =>
    <LiveProvider theme={themes.vsDark} code={code} noInline={true} scope={scope}>
        <div className='rac-panel rac-live-container'>
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
