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
        for (const chunk of Object.values(bundle)) if (chunk.type === 'chunk') chunk.code = chunk.code.replace(/require\(['"][^'"]+\.css['"]\);?/g, '')
        this.emitFile({type: 'asset', fileName: 'index.d.cts', source: readFileSync('index.d.ts', 'utf8')})
    }
}

// one file for `react-animated-select/style.css`: the layer order line, then base, theme, chip
const styleOrder = ['base', 'theme', 'chip']
const styleCss = {
    name: 'style-css',
    enforce: 'post',
    generateBundle(options, bundle) {
        if (options.format !== 'es') return
        const rank = file => {
            const index = styleOrder.findIndex(name => file.fileName.split('/').pop().startsWith(name))
            return index < 0 ? styleOrder.length : index
        }
        const parts = Object.values(bundle)
            .filter(file => file.type === 'asset' && file.fileName.endsWith('.css'))
            .sort((a, b) => rank(a) - rank(b))
            .map(file => String(file.source).trim())
        this.emitFile({type: 'asset', fileName: 'style.css', source: ['@layer rac.base, rac.theme;', ...parts].join('\n') + '\n'})
    }
}

export default defineConfig({
    plugins: [
        react(),
        libInjectCss(),
        cjsOutput,
        styleCss
    ],
    build: {
        cssCodeSplit: true,
        lib: {
            entry: 'src/index.js',
            name: 'ReactAnimatedSelect',
            formats: ['es', 'cjs'],
            fileName: (format, name) => name + (format === 'cjs' ? '.cjs' : '.js')
        },
        rollupOptions: {
            external: [/^react($|\/)/, /^react-dom($|\/)/],
            output: {
                exports: 'named',
                banner: "'use client';",
                globals: {react: 'React', 'react-dom': 'ReactDOM'},
                preserveModules: true,
                preserveModulesRoot: 'src'
            }
        }
    }
})
