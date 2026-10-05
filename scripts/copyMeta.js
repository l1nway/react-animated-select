import {copyFileSync} from 'node:fs'

const root = new URL('../', import.meta.url)
const pkg = new URL('packages/react-animated-select/', root)
for (const file of ['README.md', 'LICENSE']) copyFileSync(new URL(file, root), new URL(file, pkg))
