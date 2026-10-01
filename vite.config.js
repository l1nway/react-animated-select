import {tokenize} from './src/components/tokens.js'
import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

const BASE = '/react-animated-select-docs/'

// long-lived vendor chunks
const VENDOR = {
  react: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
  select: /node_modules[\\/]react-animated-select[\\/]/,
  prism: /node_modules[\\/]prism-react-renderer[\\/]/
}

// static code highlight
const SNIPPET = /\bsnippet(?:\.(\w+))?`((?:\\[\s\S]|[^\\`])*)`/g
const snippets = {
  name: 'snippets',
  enforce: 'pre',
  async transform(src, id) {
    if (!/\/src\/.+\.jsx?$/.test(id) || !src.includes('snippet')) return null
    const lib = await import('prism-react-renderer')
    const code = src.replace(SNIPPET, (_, language = 'jsx', raw) => {
      if (raw.includes('${')) this.error(`snippet must be a static template (${id})`)
      return JSON.stringify(tokenize(lib, new Function(`return \`${raw}\``)(), language))
    })
    return code === src ? null : {code, map: null}
  }
}

export default defineConfig({
  base: BASE,
  assetsInclude: ['**/*.lottie'],
  server: {host: true},
  plugins: [snippets, react()],
  resolve: {alias: [{find: /^lottie-web$/, replacement: 'lottie-web/build/player/lottie_light.js'}]},
  build: {rollupOptions: {output: {manualChunks: id => Object.keys(VENDOR).find(name => VENDOR[name].test(id))}}}
})
