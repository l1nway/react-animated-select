import {execSync} from 'node:child_process'
import './copyMeta.js'

const [pack] = JSON.parse(execSync('npm pack --dry-run --json --ignore-scripts -w packages/react-animated-select', {encoding: 'utf8'}))
const paths = pack.files.map(file => file.path)
const allowed = /^(package\.json|README\.md|LICENSE|index\.d\.ts|dist\/.+)$/
const required = ['package.json', 'README.md', 'LICENSE', 'index.d.ts', 'dist/index.js', 'dist/index.cjs', 'dist/index.d.cts', 'dist/style.css']
const extra = paths.filter(path => !allowed.test(path))
const missing = required.filter(path => !paths.includes(path))
if (extra.length || missing.length) {
    console.error('pack check failed', {extra, missing})
    process.exit(1)
}
console.log(`pack ok: ${paths.length} files, ${pack.size} bytes`)
