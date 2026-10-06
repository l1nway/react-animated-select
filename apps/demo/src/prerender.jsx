import {renderToString} from 'react-dom/server'
import {StrictMode} from 'react'
import App from './app'

// [DOC: prerender]
export const render = () => renderToString(
    <StrictMode>
        <App/>
    </StrictMode>
)
