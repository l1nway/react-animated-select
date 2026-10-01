import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {libInjectCss} from 'vite-plugin-lib-inject-css'
import {readFileSync} from 'node:fs'

// [DOC: package-build]
const cjsOutput = {
    name: 'cjs-output',
    enforce: 'post',
    generateBundle(options, bundle) {
        if (options.format !== 'cjs') return
        for (const chunk of Object.values(bundle)) if (chunk.type === 'chunk') chunk.code = chunk.code.replace(/require\(['"]\.\/[^'"]+\.css['"]\);?/g, '')
        this.emitFile({type: 'asset', fileName: 'index.d.cts', source: readFileSync('index.d.ts', 'utf8')})
    }
}

export default defineConfig({
    plugins: [
        react(),
        libInjectCss(),
        cjsOutput
    ],
    build: {
        cssCodeSplit: true,
        lib: {
            entry: 'src/index.js',
            name: 'ReactAnimatedSelect',
            formats: ['es', 'cjs'],
            fileName: (format) => format === 'cjs' ? 'index.cjs' : 'index.es.js'
        },
        rollupOptions: {
            external: [/^react($|\/)/, /^react-dom($|\/)/],
            output: {
                exports: 'named',
                banner: "'use client';",
                globals: {react: 'React', 'react-dom': 'ReactDOM'}
            }
        }
    }
})
