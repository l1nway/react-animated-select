import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

export default defineConfig({
  base: '/react-animated-select-docs/',
  assetsInclude: ['**/*.lottie'],
  server: {host: true},
  plugins: [react()],
})