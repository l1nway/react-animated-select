import {eyesWatching, hideEyes, hiddenEyes} from '../components/store'
import {useSelector, useDispatch} from 'react-redux'
import {useRef, useLayoutEffect} from 'react'
import catEyes from './cat-eyes.json'
import Lottie from 'lottie-react'

function CatEyes() {
    const lottieRef = useRef(null)
    const dispatch = useDispatch()
    const status = useSelector((state) => state.cat.status)

    const showed = useRef(false)

    useLayoutEffect(() => {
        const player = lottieRef.current
        if (!player) return

        const minFrame = 35
        const maxFrame = 63

        if (status === 'show') {
            showed.current = true
            player.setDirection(1)
            player.play()
        }

        if (status === 'pointer') {
            const timer = setTimeout(() => dispatch(hideEyes()), 7000)
            
            const handleMove = (e) => {
                const clientX = e.touches ? e.touches[0].clientX : e.clientX
                const mouseProgress = clientX / window.innerWidth
                
                const targetFrame = Math.round(minFrame + (maxFrame - minFrame) * mouseProgress)

                if (player.lastFrame === targetFrame) return
                player.lastFrame = targetFrame

                player.goToAndStop(targetFrame, true)
            }
            
            window.addEventListener('mousemove', handleMove)
            window.addEventListener('touchmove', handleMove, {passive: true})
            
            return () => {
                window.removeEventListener('mousemove', handleMove)
                window.removeEventListener('touchmove', handleMove)
                clearTimeout(timer)
            }
        }

        if (status === 'exit') {
            player.setDirection(-1)
            player.play()
        }
    }, [status, dispatch])

    // if (status === 'idle') return null
    
    return (
        <div className='rac-cat-eyes-container'>
            <Lottie
                onDOMLoaded={() => lottieRef.current.goToAndStop(0, true)}
                onComplete={() => {
                    if (status === 'show') dispatch(eyesWatching())
                    if (status === 'exit') dispatch(hiddenEyes())
                }}
                className='rac-cat-eyes'
                animationData={catEyes}
                lottieRef={lottieRef}
                autoplay={false}
                loop={false}
            />
        </div>
    )
}

export default CatEyes