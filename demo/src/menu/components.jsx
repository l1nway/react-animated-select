export const containerVariants = {
    hidden: { 
        height: 0, 
        opacity: 0,
        transition: {
            height: {duration: 0.3, ease: [0.4, 0, 0.2, 1]},
            opacity: {duration: 0.2}
        }
    },
    visible: { 
        height: 'auto', 
        opacity: 1,
        transition: {
            height: { 
                type: 'spring', 
                stiffness: 100, 
                damping: 15, 
                restDelta: 0.01 
            },
            opacity: {duration: 0.2},
            staggerChildren: 0.08,
            delayChildren: 0.1
        }
    }
}

export const itemVariants = {
    hidden: { 
        y: -15, 
        opacity: 0, 
        scale: 0.9 
    },
    visible: { 
        y: 0, 
        opacity: 1, 
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 260,
            damping: 20
        }
    }
}