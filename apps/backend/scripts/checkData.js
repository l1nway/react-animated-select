const fs = require('fs')
const path = require('path')

const PKG = path.join(__dirname, '../../../packages/react-animated-select')
const DATA = path.join(__dirname, '../src/data')
const BUDGET = 18000 // chars of documentation.md / styling.md: Groq free tier is 8k tokens per minute per model

const read = file => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
const unique = list => [...new Set(list)]
const all = (text, re) => unique([...text.matchAll(re)].map(m => m[1]))
const has = (text, name) => new RegExp(`(?<![\\w-])${name.replace(/[$.]/g, '\\$&')}(?![\\w-])`).test(text)
const before = (text, heading) => text.split(heading)[0]

const dts = read(path.join(PKG, 'index.d.ts'))
const css = fs.readdirSync(path.join(PKG, 'src')).filter(f => f.endsWith('.css')).map(f => read(path.join(PKG, 'src', f))).join('\n')
const js = fs.readdirSync(path.join(PKG, 'src')).filter(f => /\.jsx?$/.test(f)).map(f => read(path.join(PKG, 'src', f))).join('\n')
const version = JSON.parse(read(path.join(PKG, 'package.json'))).version
const docs = read(path.join(DATA, 'documentation.md'))
const styling = read(path.join(DATA, 'styling.md'))
const prompt = file => read(path.join(DATA, 'prompts', file))

const block = name => new RegExp(`interface ${name}[^{]*\\{([\\s\\S]*?)\\n\\}`).exec(dts)?.[1] || ''
const members = body => {
    const current = [], removed = []
    let deprecated = false
    for (const line of body.split('\n')) {
        if (line.includes('@deprecated')) deprecated = true
        const name = /^\s{4}(\w+)\??:/.exec(line)?.[1]
        if (!name) continue
        ;(deprecated ? removed : current).push(name)
        deprecated = false
    }
    return {current, removed}
}

const warnings = []
const warn = (file, text) => warnings.push(`${file}: ${text}`)

// version stamps
for (const [file, text] of [['documentation.md', docs], ['styling.md', styling]]) {
    const stamp = /synced: react-animated-select@([\w.-]+)/.exec(text)?.[1]
    if (stamp !== version) warn(file, `written for ${stamp || 'no version'}, the library is ${version}`)
    if (text.length > BUDGET) warn(file, `${text.length} chars, over the ${BUDGET} budget`)
}

// public API in documentation.md
const props = ['SelectProps', 'OptionProps', 'OptGroupProps'].map(name => members(block(name)))
const current = unique([...props.flatMap(p => p.current), ...members(block('SelectTexts')).current, ...members(block('SelectIcons')).current,
    ...all(dts, /export (?:const|function) (\w+)/g)])
const removed = unique(props.flatMap(p => p.removed)).filter(name => !current.includes(name))
for (const name of current) if (!has(docs, `\`${name}`) && !has(docs, name)) warn('documentation.md', `missing \`${name}\``)
for (const name of removed) {
    if (has(before(docs, '## Removed props'), `\`${name}\``)) warn('documentation.md', `removed prop \`${name}\` described as current`)
    if (!has(docs, name)) warn('documentation.md', `removed prop \`${name}\` missing from "Removed props"`)
}

// styling hooks in styling.md
const animationIds = all(js, /const [A-Z_]+ = '(rac-[a-z0-9-]+)'/g)
const classes = unique([...all(css, /\.(rac-[a-z0-9-]+)/g), ...all(js, /['" ](rac-[a-z0-9-]+)(?=['" ])/g).filter(name => !animationIds.includes(name))])
const keyframes = all(css, /@keyframes (rac-[a-z0-9-]+)/g)
const variables = unique([...all(css, /(--rac-[a-z0-9-]+)/g), ...all(js, /'(--rac-[a-z0-9-]+)'/g)])
for (const name of [...classes, ...keyframes, ...variables]) if (!has(styling, name)) warn('styling.md', `missing ${name}`)
const live = before(styling, '## Renamed')
for (const name of all(live, /(?<![\w-])(rac-[a-z0-9-]+)/g)) if (![...classes, ...keyframes].includes(name)) warn('styling.md', `unknown class ${name} (renamed or removed?)`)
for (const name of all(live, /(--rac-[a-z0-9-]+)/g)) if (!variables.includes(name)) warn('styling.md', `unknown variable ${name}`)

// prompt placeholders
const need = {'answer.md': ['{{context}}', '{{name}}', 'ESCALATE'], 'codebase.md': ['{{context}}', '{{version}}'], 'router.md': ['docs', 'styling', 'codebase', 'offtop'], 'offtop.md': []}
for (const [file, tokens] of Object.entries(need)) for (const token of tokens) if (!prompt(file).includes(token)) warn(`prompts/${file}`, `missing ${token}`)

console.log(warnings.length
    ? `Knowledge base check: ${warnings.length} warning(s). Queue them in apps/backend/BUGS.md (Knowledge queue).\n${warnings.map(w => `  - ${w}`).join('\n')}`
    : `Knowledge base check: OK (react-animated-select@${version})`)
if (warnings.length && process.argv.includes('--strict')) process.exit(1)
