import {LazyMotion, domAnimation} from 'framer-motion'
import {createRoot} from 'react-dom/client'
import {store} from './components/store'
import {Provider} from 'react-redux'
import {StrictMode} from 'react'
import App from './app'
import './rac.css'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Provider store={store}>
            <LazyMotion features={domAnimation}>
                <App/>
            </LazyMotion>
        </Provider>
    </StrictMode>
)