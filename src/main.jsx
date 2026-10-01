import {boot} from './components/store'
import {createRoot} from 'react-dom/client'
import {StrictMode, startTransition} from 'react'
import App from './app'
import './rac.css'

boot()

const root = createRoot(document.getElementById('root'))
// sliced first render
startTransition(() => root.render(
    <StrictMode>
        <App/>
    </StrictMode>
))
