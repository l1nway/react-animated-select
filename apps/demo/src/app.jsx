import CatEyes from './animations/catEyes'
import {Part} from './components/deferred'
import {useStore} from './components/store'
import {GitHub} from './components/icons'
import Header from './header/header'
import Start from './start/start'
import Menu from './menu/menu'

function App() {
  const restoring = useStore(state => state.restoring)

  return (
    <div className='rac-main' data-restoring={restoring || undefined}>
      <Header/>
      <div className='rac-sections-container'>
        <Menu/>
        <main className='rac-sections'>
          <Part id='start'><Start/></Part>
          <Part id='features'/>
          <Part id='plugins'/>
          <Part id='customization'/>
          <Part id='dev'/>
        </main>
      </div>
      <footer className='rac-footer'>
          <span className='text-[#c3abff]'>Developed by l1nway</span>
          <a href='https://github.com/l1nway' aria-label='l1nway on GitHub'>
            <GitHub className='rac-footer-icon' aria-hidden='true'/>
          </a>
      </footer>
      <CatEyes/>
    </div>
  )
}

export default App