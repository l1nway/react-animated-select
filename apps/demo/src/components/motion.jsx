import {LazyMotion, domAnimation} from 'framer-motion'

export const Motion = ({children}) => <LazyMotion features={domAnimation}>{children}</LazyMotion>
