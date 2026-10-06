import {tokenize} from './src/components/tokens.js'
import {SITE, SEO, DESCRIPTION, pathOf, titleOf} from './src/menu/seo.js'
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {defineConfig, runnerImport} from 'vite'
import react from '@vitejs/plugin-react'
import {dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const BASE = '/react-animated-select/'

// workspace library source, served by the dev server
const LIBRARY = fileURLToPath(new URL('../../packages/react-animated-select/src/index.js', import.meta.url))

// long-lived vendor chunks, first match wins
const VENDOR = {
  react: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
  chips: /packages[\\/]react-animated-select[\\/]dist[\\/](chip|useChip)/,
  paging: /packages[\\/]react-animated-select[\\/]dist[\\/]paging/,
  select: /packages[\\/]react-animated-select[\\/]/,
  prism: /node_modules[\\/]prism-react-renderer[\\/]/
}

// static code highlight
const SNIPPET = /\bsnippet(?:\.(\w+))?`((?:\\[\s\S]|[^\\`])*)`/g
const FILE = '\0snippet:'
const snippets = {
  name: 'snippets',
  enforce: 'pre',
  // source file as snippet
  async resolveId(source, importer) {
    if (!source.endsWith('?snippet')) return null
    const file = await this.resolve(source.slice(0, -8), importer)
    return file && `${FILE}${file.id}.js`
  },
  async load(id) {
    if (!id.startsWith(FILE)) return null
    const file = id.slice(FILE.length, -3)
    this.addWatchFile(file)
    const [lib, text] = await Promise.all([import('prism-react-renderer'), readFile(file, 'utf8')])
    return `export default ${JSON.stringify(tokenize(lib, text.replace(/\r/g, '').trim(), file.split('.').pop()))}`
  },
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

// per-section share pages
const escape = text => text.replace(/[&<>'"]/g, c => `&#${c.charCodeAt(0)};`)
const fill = (html, {title, description, url}) => html
  .replace(/<title>[^<]*/, `<title>${title}`)
  .replace(/((?:og:|twitter:)title' content=')[^']*/g, `$1${title}`)
  .replace(/((?:'|og:|twitter:)description' content=')[^']*/g, `$1${description}`)
  .replace(/((?:og:url' content|canonical' href)=')[^']*/g, `$1${url}`)
// first screen into index.html
const ROOT = /<div id=['"]root['"]><\/div>/
const CHARSET = /<meta charset[^>]*>/i
const HOISTED = /<style data-precedence[^>]*>[\s\S]*?<\/style>/g
const NO_CSS = '\0no-css'
const noCss = {name: 'no-css', enforce: 'pre', resolveId: source => /\.css$/.test(source) ? NO_CSS : null, load: id => id === NO_CSS ? '' : null}
const prerender = async html => {
  if (!ROOT.test(html) || !CHARSET.test(html)) throw new Error('prerender: index.html needs a charset meta and an empty #root')
  const {module: {render}} = await runnerImport(`${root}/src/prerender.jsx`, {
    root, base: BASE, configFile: false, logLevel: 'silent', plugins: [noCss, snippets],
    esbuild: {jsx: 'automatic', jsxDev: false}, resolve: {noExternal: ['react-animated-select']}
  })
  // hoisted styles first, as react inserts them
  const styles = []
  const app = render().replace(HOISTED, style => {styles.push(style); return ''})
  return html.replace(CHARSET, tag => `${tag}\n    ${styles.join('')}`).replace(ROOT, () => `<div id='root'>${app}</div>`)
}
// [DOC: inline-css]
const STYLESHEET = /<link rel=['"]stylesheet['"][^>]*?href=['"]([^'"]+\.css)['"][^>]*>/g
const inline = (html, bundle) => html.replace(STYLESHEET, (tag, href) => {
  const css = bundle[href.slice(BASE.length)]?.source
  if (typeof css !== 'string') throw new Error(`inline: ${href} not in the bundle`)
  return `<style>${css}</style>${tag.replace(/\s*\/?>$/, ' disabled>')}`
})
let root
const pages = {
  name: 'pages',
  apply: 'build',
  configResolved: config => {root = config.root},
  async writeBundle({dir}, bundle) {
    const {module: {ITEMS}} = await runnerImport(`${root}/src/menu/components.js`, {root, configFile: false, logLevel: 'silent'})
    const html = inline(await readFile(`${dir}/index.html`, 'utf8'), bundle)
    const write = async (path, text) => {
      await mkdir(dirname(`${dir}/${path}`), {recursive: true})
      await writeFile(`${dir}/${path}`, text)
    }
    await Promise.all(ITEMS.map(item => write(`${pathOf(item.id)}index.html`, fill(html, {
      title: escape(titleOf(item)),
      description: escape(SEO[item.id] ?? DESCRIPTION),
      url: SITE + pathOf(item.id)
    }))))
    await write('404.html', html.replace('<head>', `<head>\n    <meta name='robots' content='noindex'/>`))
    // [DOC: prerender]
    await write('index.html', await prerender(html))
    await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[null, ...ITEMS].map(item => `  <url><loc>${SITE}${pathOf(item?.id)}</loc></url>`).join('\n')}\n</urlset>\n`)
  }
}

export default defineConfig(({command}) => ({
  base: BASE,
  assetsInclude: ['**/*.lottie'],
  server: {host: true},
  plugins: [snippets, react(), pages],
  resolve: {
    alias: [
      {find: /^lottie-web$/, replacement: 'lottie-web/build/player/lottie_light.js'},
      ...command === 'serve' ? [{find: /^react-animated-select$/, replacement: LIBRARY}] : []
    ],
    dedupe: ['react', 'react-dom']
  },
  build: {rollupOptions: {output: {manualChunks: id => Object.keys(VENDOR).find(name => VENDOR[name].test(id))}}}
}))
