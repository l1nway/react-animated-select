import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {libInjectCss} from 'vite-plugin-lib-inject-css'

export default defineConfig({
    plugins: [
        react(),
        libInjectCss()
    ],
    build: {
        lib: {
            entry: 'src/index.js',
            name: 'ReactAnimatedSelect',
            formats: ['es', 'cjs'],
            fileName: (format) => `index.${format}.js`,
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'react-transition-group'],
            output: {
                exports: 'named',
                globals: {
                    react: 'React', 'react-dom': 'ReactDOM' ,'react-transition-group': 'ReactTransitionGroup'
                },
            },
        },
    },
})