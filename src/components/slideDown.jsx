import {AnimatePresence, m} from 'framer-motion'

const EASE = {'ease': [0.25, 0.1, 0.25, 1], 'ease-in': 'easeIn', 'ease-out': 'easeOut', 'ease-in-out': 'easeInOut'}

function SlideDown({visibility, children, duration = 300, className, easing = 'ease'}) {
    return (
        <AnimatePresence initial={false}>
            {visibility &&
                <m.div
                    transition={{duration: duration / 1000, ease: EASE[easing] ?? easing}}
                    initial={{height: 0}}
                    animate={{height: 'auto'}}
                    exit={{height: 0}}
                    style={{overflow: 'hidden'}}
                    className={className}
                    tabIndex={-1}
                >
                    {children}
                </m.div>
            }
        </AnimatePresence>
    )
}

export default SlideDown
