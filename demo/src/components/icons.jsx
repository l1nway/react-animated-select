export const GitHub = ({size = 24, color = 'currentColor', ...props}) => 
    <svg
        strokeLinejoin='round'
        strokeLinecap='round'
        viewBox='0 0 24 24'
        strokeWidth='2'
        stroke={color}
        height={size}
        width={size}
        fill='none'
        {...props}
    >
        <path d='M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4' />
        <path d='M9 18c-4.51 2-5-2-7-2'/>
    </svg>

export const NPM = ({size = 24, color = 'currentColor', ...props}) => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        strokeLinejoin='round'
        strokeLinecap='round'
        viewBox='0 0 24 24'
        strokeWidth='2'
        stroke={color}
        height={size}
        width={size}
        fill='none'
        {...props}
    >
        <rect width='18' height='18' x='3' y='3' rx='2'/>
        <path d='M8 8v8'/>
        <path d='M12 8v8'/>
        <path d='M16 8v8'/>
        <path d='M11 12h1'/>
        <path d='M15 12h1'/>
  </svg>
)

export const XMarkIcon = ({className = '', ...props}) => (
  <svg
    className={className}
    role='button'
    aria-label='Clear selection'
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 320 512'
    width='1em'
    height='1em'
    fill='currentColor'
    {...props}
  >
    <path d='M310.6 361.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L160 301.3 54.6 406.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L114.7 256 9.4 150.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 210.7 265.4 105.4c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3L205.3 256l105.3 105.4z'/>
  </svg>
)

export const ArrowUpIcon = ({className = '', ...props}) => (
    <svg
      className={className}
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 448 512'
      width='1em'
      height='1em'
      fill='currentColor'
      {...props}
    >
      <path d='M34.9 289.5l175.9-175.8c9.4-9.4 24.6-9.4 33.9 0L420.1 289.5c15.1 15.1 4.4 41-17 41H51.9c-21.4 0-32.1-25.9-17-41z'/>
    </svg>
)

export const CheckmarkIcon = ({className = '', ...props}) => (
  <svg
    className={className}
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    width='1em'
    height='1em'
    fill='currentColor'
    {...props}
  >
    <path d='M20.285 6.708a1 1 0 0 0-1.414-1.416l-9.192 9.192-4.243-4.244a1 1 0 1 0-1.414 1.416l5 5a1 1 0 0 0 1.414 0l9.849-9.948z'/>
  </svg>
)

export const TypeScript = ({className = '', size = 24, color = 'currentColor', ...props}) =>
  <svg
    xmlns='http://www.w3.org/2000/svg'
    strokeLinejoin='round'
    className={className}
    strokeLinecap='round'
    viewBox='0 0 24 24'
    strokeWidth='2'
    stroke={color}
    height={size}
    width={size}
    fill='none'
    {...props}
  >
  <rect width='18' height='18' x='3' y='3' rx='2' />
  
  <path d='M7 8h4' />
  <path d='M9 8v8' />
  
  <path d='M17 8h-2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2' />
</svg>