const fs = require('fs')
const path = require('path')

function readCode() {
    const bundlePath = path.join(__dirname, 'data/bundle.json')
    if (!fs.existsSync(bundlePath)) return {version: 'unknown', text: 'no context'}

    const data = JSON.parse(fs.readFileSync(bundlePath, 'utf-8'))

    return {version: data.version, text: data.files.map(f => `FILE: ${f.name}\n${f.content}`).join('\n\n---\n\n')}
}

module.exports = {readCode}
