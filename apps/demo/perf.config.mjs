import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'

// workspace dependencies are hoisted
const MODULES = new URL('../../node_modules/', import.meta.url)

export default {
  serve: port => [fileURLToPath(new URL('vite/bin/vite.js', MODULES)), 'preview', '--port', port, '--strictPort'],
  path: '/react-animated-select/',
  budgets: {'M long': 300, 'Entry KB': 120},
  ignoreShift: '.rac-menu',
  interactions: ['#usage .rac-select', '.rac-options .rac-option'],
  extra: {Lib: () => JSON.parse(readFileSync(new URL('react-animated-select/package.json', MODULES), 'utf8')).version}
}
