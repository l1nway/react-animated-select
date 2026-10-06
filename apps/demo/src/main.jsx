import {boot} from './components/store'
import {createRoot, hydrateRoot} from 'react-dom/client'
import {StrictMode, startTransition} from 'react'
import App from './app'
import './rac.css'
// [DOC: site-theme]
import './components/basic.css'

boot()

const root = document.getElementById('root')
const app = (
    <StrictMode>
        <App/>
    </StrictMode>
)
// [DOC: prerender]
startTransition(() => root.firstChild ? hydrateRoot(root, app) : createRoot(root).render(app))
