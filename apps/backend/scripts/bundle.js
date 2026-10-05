const fs = require('fs')
const path = require('path')

const CONFIG = {
    srcPath: path.join(__dirname, '../../../packages/react-animated-select/src'),
    outputPath: path.join(__dirname, '../src/data/bundle.json'),
    allowedExtensions: ['.js', '.jsx', '.css', '.md'],
    ignoredFiles: ['setupTests.ts', 'reportWebVitals.ts']
}

function collect() {
    const bundle = {
        timestamp: new Date().toISOString(),
        files: []
    }

    function scan(dir) {
        const items = fs.readdirSync(dir)
        items.forEach(item => {
            const fullPath = path.join(dir, item)
            const stats = fs.statSync(fullPath)

            if (stats.isDirectory() && item !== 'node_modules') {
                scan(fullPath)
            } else if (stats.isFile()) {
                const ext = path.extname(item)
                if (CONFIG.allowedExtensions.includes(ext) && !CONFIG.ignoredFiles.includes(item)) {
                    let content = fs.readFileSync(fullPath, 'utf-8')

                    content = content.replace(/^\s*[\r\n]/gm, '').trim()
                    content = content.replace(/^(?!\s*https?:\/\/)\s*\/\/.*$/gm, '')
                    content = content.split('\n').map(line => line.trim()).join('\n')
                    content = content.replace(/^\s*[\r\n]/gm, '').trim()

                    bundle.files.push({
                        name: path.relative(CONFIG.srcPath, fullPath),
                        content: content
                    })
                }
            }
        })
    }

    scan(CONFIG.srcPath)
    
    const dir = path.dirname(CONFIG.outputPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})

    fs.writeFileSync(CONFIG.outputPath, JSON.stringify(bundle, null, 2))
    console.log(`Bundle created. Total files: ${bundle.files.length}`)
}

collect()