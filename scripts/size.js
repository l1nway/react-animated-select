import {build, version} from 'vite'
import {VERSION as rollup} from 'rollup'
import webpack from 'webpack'
import CssExtract from 'mini-css-extract-plugin'
import {gzipSync} from 'node:zlib'
import {createRequire} from 'node:module'
import {mkdtempSync, writeFileSync, readdirSync, readFileSync, rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

// [DOC: bundle-size]
const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('..', import.meta.url))
const ID = '\0size-entry'
const CORE = ['Select', 'Option', 'OptGroup']
const ENTRIES = {core: CORE, chips: [...CORE, 'chips'], paging: [...CORE, 'paging'], all: [...CORE, 'defineOption', 'chips', 'paging']}
const BUDGETS = {
  core: [40479, 15982, 6589, 1861],
  chips: [56589, 21761, 8982, 2337],
  paging: [41964, 16545, 6589, 1861],
  all: [58207, 22386, 8982, 2337]
}
const MARKERS = {chips: 'rac-chip-slot', paging: 'special-load-more-id'}
const BASE_CSS = ['--rac-duration-fast', '--rac-tint-1']
const COLUMNS = ['JS min', 'JS gzip', 'CSS min', 'CSS gzip']
const EXTERNAL = [/^react($|\/)/, /^react-dom($|\/)/]

const sizes = text => [Buffer.byteLength(text), gzipSync(text, {level: 9}).length]
const source = names => `export {${names}} from 'react-animated-select'`
const result = (names, js, css) => ({names, js, css, bytes: [...sizes(js), ...sizes(css)]})

const vite = async names => {
  const entry = {name: 'size-entry', resolveId: id => id === ID ? id : null, load: id => id === ID ? source(names) : null}
  const [{output}] = [await build({
    root, configFile: false, logLevel: 'silent', publicDir: false, plugins: [entry],
    build: {write: false, minify: true, rollupOptions: {input: ID, external: EXTERNAL, preserveEntrySignatures: 'strict'}}
  })].flat()
  const js = output.filter(file => file.type === 'chunk').map(file => file.code).join('')
  const css = output.filter(file => file.fileName.endsWith('.css')).map(file => String(file.source)).join('')
  return result(names, js, css)
}

const pack = async names => {
  const dir = mkdtempSync(join(tmpdir(), 'rac-size-'))
  const out = join(dir, 'out')
  writeFileSync(join(dir, 'entry.js'), source(names))
  try {
    const stats = await new Promise((resolve, reject) => webpack({
      mode: 'production', context: root, entry: join(dir, 'entry.js'), devtool: false,
      output: {path: out, library: {type: 'module'}}, experiments: {outputModule: true},
      externalsType: 'module', externals: EXTERNAL,
      resolve: {modules: ['node_modules', join(root, 'node_modules')]},
      module: {rules: [{test: /\.css$/, use: [CssExtract.loader, require.resolve('css-loader')]}]},
      plugins: [new CssExtract()]
    }, (error, stats) => error ? reject(error) : resolve(stats)))
    if (stats.hasErrors()) throw new Error(stats.toString('errors-only'))
    const read = ext => readdirSync(out).filter(file => ext.test(file)).sort().map(file => readFileSync(join(out, file), 'utf8')).join('')
    return result(names, read(/\.m?js$/), read(/\.css$/))
  } finally {
    rmSync(dir, {recursive: true, force: true})
  }
}

const BUNDLERS = [
  ['vite', `vite ${version}, rollup ${rollup}, minify esbuild`, vite, BUDGETS],
  ['webpack', `webpack ${webpack.version}, terser ${require('terser/package.json').version}, CSS as dist ships it, informational`, pack]
]

const checks = ({names, js, css}) => [
  ...Object.entries(MARKERS).flatMap(([plugin, marker]) => names.includes(plugin)
    ? [!js.includes(marker) && `${plugin} imported, but "${marker}" is missing from JS`]
    : [js.includes(marker) && `"${marker}" in JS without ${plugin}`, css.includes(marker) && `"${marker}" in CSS without ${plugin}`]),
  ...BASE_CSS.map(marker => !css.includes(marker) && `core CSS "${marker}" is missing`)
].filter(Boolean)

const kb = bytes => (bytes / 1024).toFixed(1)
const pad = (value, width = 18) => String(value).padStart(width)

const errors = []
for (const [tool, title, measure, budgets] of BUNDLERS) {
  console.log(`${title}, gzip -9; bytes (KB)`)
  console.log('entry'.padEnd(8) + COLUMNS.map(name => pad(name)).join(''))
  for (const [name, names] of Object.entries(ENTRIES)) {
    const {bytes, ...rest} = await measure(names)
    console.log(name.padEnd(8) + bytes.map(value => pad(`${value} (${kb(value)})`)).join(''))
    budgets && bytes.forEach((value, i) => value > budgets[name][i] && errors.push(`${tool} ${name} ${COLUMNS[i]} ${value} B > budget ${budgets[name][i]} B`))
    errors.push(...checks(rest).map(error => `${tool} ${name}: ${error}`))
  }
  console.log()
}
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log('size ok: vite within budgets; tree-shaking markers and core CSS checked in vite and webpack')
