import Customization from './customization/customization'
import Features from './features/features'
import CatEyes from './animations/catEyes'
import {GitHub} from './components/icons'
import Header from './header/header'
import Start from './start/start'
import Menu from './menu/menu'
import Dev from './dev/dev'

function App() {
  return (
    <div className='rac-main'>
      <Header/>
      <div className='rac-sections-container'>
        <Menu/>
        <main className='rac-sections'>
          <Start/>
          <Features/>
          <Customization/>
          <Dev/>
        </main>
      </div>
      <footer className='rac-footer'>
          <span className='text-[#c3abff]'>Developed by l1nway</span>
          <a href='https://github.com/l1nway'>
            <GitHub className='rac-footer-icon'/>
          </a>
      </footer>
      <CatEyes/>
    </div>
  )
}

export default App