export const animIcon = {
    base: {
        transition: {
            type: 'spring',
            stiffness: 300,
            duration: 0.4,
            damping: 20,
        },
        initial: {
            opacity: 0,
            scale: 0.8
        },
        animate: {
            scale: [0.8, 1.1, 1],
            opacity: 1,
        },
        exit: {
            opacity: 0,
            scale: 0.8
        },
    },
    twist: {
        transition: {
            type: 'spring',
            stiffness: 200,
            damping: 15
        },
        initial: {
            opacity: 0,
            scale: 0.5,
            rotate: -120,
            x: -50
        },
        exit: {
            rotate: 120,
            opacity: 0,
            scale: 0.5,
            x: 50
        },
        animate: {
            scale: [0.5, 1.1, 1],
            opacity: 1,
            rotate: 0,
            x: 0
        },
    }, 
    blur: {
        initial: {
            filter: 'blur(1.5px)',
            scale: 0.95,
            opacity: 0,
        },
        animate: {
            filter: 'blur(0px)',
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.5,
                ease: 'easeInOut',
            },
        },
        exit: {
            filter: 'blur(1.5px)',
            opacity: 0,
            scale: 0.95,
            transition: {
                duration: 0.3,
            },
        },
    },
    container: {
        initial: { 
            opacity: 0, 
            x: -10,
            background: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 100%)',
        },
        animate: { 
            opacity: 1, 
            x: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)',
            transition: {
                duration: 0.4,
                ease: 'easeOut',
                background: {duration: 0.8} 
            }
        },
        exit: { 
            opacity: 0, 
            x: 10,
            background: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 100%)',
            transition: {
                duration: 0.3,
                ease: 'easeIn'
            }
        }
    }
}

export const shake = (el) => {
  el.classList.remove('--null')
  void el.offsetWidth
  el.classList.add('--null')
}

export const clearShake = (el) => el?.classList.remove('--null')

export const merge = (prev, next) => Object.keys(next).some(key => !Object.is(prev[key], next[key])) ? {...prev, ...next} : prev

export const submit = (e) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing || e.keyCode === 229) return
    e.preventDefault()
    e.currentTarget.form?.requestSubmit()
}
