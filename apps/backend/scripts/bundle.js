const fs = require('fs')
const path = require('path')

const PKG = path.join(__dirname, '../../../packages/react-animated-select')
const ROOT = path.join(PKG, '../..')
const SRC = path.join(PKG, 'src')
const OUTPUT = path.join(__dirname, '../src/data/bundle.json')

// public contract first, then design notes, then code
const DOCS = [
    ['index.d.ts', path.join(PKG, 'index.d.ts')],
    ['README.md', path.join(ROOT, 'README.md')],
    ['FEATURES.md', path.join(PKG, 'FEATURES.md')],
    ['STYLES.md', path.join(PKG, 'STYLES.md')],
    ['src/README.md', path.join(SRC, 'README.md')]
]
const CODE = ['.js', '.jsx', '.css']

const read = file => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')

// unreleased plans and local sandbox notes
const cleanDoc = (name, text) => (name === 'FEATURES.md' ? text.replace(/\n## Planned\n[\s\S]*?(?=\n## Props\n)/, '\n') : text)
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n').filter(line => !/^\s*- \*\*Demo( idea)?:\*\*/.test(line)).join('\n')
    .replace(/\n{3,}/g, '\n\n').trim()

const cleanCode = text => text
    .replace(/\/\*(?!\s*@__PURE__)[\s\S]*?\*\//g, '')
    .split('\n').map(line => line.trim()).filter(line => line && !/^\/\/(?!\s*\[DOC)/.test(line)).join('\n')

const version = JSON.parse(read(path.join(PKG, 'package.json'))).version
const files = [
    ...DOCS.map(([name, file]) => ({name, content: cleanDoc(name, read(file))})),
    ...fs.readdirSync(SRC).filter(item => CODE.includes(path.extname(item))).sort()
        .map(item => ({name: `src/${item}`, content: cleanCode(read(path.join(SRC, item)))}))
]

fs.mkdirSync(path.dirname(OUTPUT), {recursive: true})
fs.writeFileSync(OUTPUT, JSON.stringify({version, timestamp: new Date().toISOString(), files}))
const size = files.reduce((sum, f) => sum + f.content.length, 0)
console.log(`Bundle created: react-animated-select@${version}, ${files.length} files, ~${Math.round(size / 4000)}k tokens`)
