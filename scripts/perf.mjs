// usage: npm run perf [-- --log "why it changed"]
import {spawn, execSync} from 'node:child_process'
import {existsSync, readFileSync, appendFileSync, mkdtempSync, rmSync} from 'node:fs'
import {gzipSync} from 'node:zlib'
import {tmpdir} from 'node:os'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const JOURNAL = join(ROOT, 'PERF.md')
const PORT = 4199
const RUNS = +(process.env.RUNS || 3)
const LOG = process.argv.indexOf('--log')
const NOTE = LOG > 0 ? process.argv.slice(LOG + 1).join(' ').replace(process.platform === 'win32' ? /\^/g : /$^/, '').trim() : null

// browser candidates
const BROWSERS = [
    process.env.BROWSER,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/microsoft-edge'
]

const PROFILES = {
    mobile: {metrics: {width: 390, height: 844, deviceScaleFactor: 3, mobile: true}, touch: true, cpu: 4, wait: 5000, net: {offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8}},
    desktop: {metrics: {width: 1440, height: 900, deviceScaleFactor: 1, mobile: false}, cpu: 1, wait: 3000}
}

// journal columns with budgets
const COLUMNS = [
    ['M FCP', r => r.mobile.fcp, 1600],
    ['M LCP', r => r.mobile.lcp, 1600],
    ['M TBT', r => r.mobile.tbt, 450],
    ['M long', r => r.mobile.long, 300],
    ['D FCP', r => r.desktop.fcp, 200],
    ['D TBT', r => r.desktop.tbt, 50],
    ['CLS', r => Math.max(r.mobile.cls, r.desktop.cls), 0.01],
    ['Idle', r => Math.max(r.mobile.idle.ms, r.desktop.idle.ms), 50],
    ['Entry KB', r => r.entry, 120]
]

const INJECT = `window.__perf = {lcp: 0, cls: 0, long: []}
const po = (type, fn) => {try {new PerformanceObserver(l => l.getEntries().forEach(fn)).observe({type, buffered: true})} catch {}}
const menu = s => (s.node?.nodeType === 3 ? s.node.parentElement : s.node)?.closest?.('.rac-menu')
po('largest-contentful-paint', e => {__perf.lcp = e.startTime})
po('layout-shift', e => {if (!e.hadRecentInput && !(e.sources.length && e.sources.every(menu))) __perf.cls += e.value})
po('longtask', e => __perf.long.push(e.duration))`

const sleep = ms => new Promise(r => setTimeout(r, ms))
const median = list => list.slice().sort((a, b) => a - b)[list.length >> 1]
const until = async (fn, ms = 30000) => {
    for (const end = Date.now() + ms; Date.now() < end; await sleep(100)) {
        const value = await fn().catch(() => null)
        if (value) return value
    }
    throw new Error('timeout')
}
const fail = message => {console.error(message); process.exit(2)}

async function open(port) {
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {method: 'PUT'})).json()
    const ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {ws.onopen = resolve; ws.onerror = reject})
    const pending = new Map(), events = []
    let seq = 0
    ws.onmessage = e => {const m = JSON.parse(e.data); m.id ? pending.get(m.id)?.(m) : events.push(m.method)}
    const send = (method, params = {}) => new Promise((resolve, reject) => {
        const id = ++seq
        pending.set(id, m => m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result))
        ws.send(JSON.stringify({id, method, params}))
    })
    const ev = async expression => {
        const r = await send('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true})
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
        return r.result.value
    }
    const close = () => {ws.close(); return fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(() => {})}
    return {send, ev, events, close}
}

async function measure(port, url, name) {
    const {metrics, touch, cpu, wait, net} = PROFILES[name]
    const loads = []
    let page, errors = 0
    for (let run = 0; run < RUNS; run++) {
        await page?.close()
        page = await open(port)
        const {send, ev, events} = page
        for (const domain of ['Page', 'Runtime', 'Performance', 'Network']) await send(`${domain}.enable`)
        await send('Page.addScriptToEvaluateOnNewDocument', {source: INJECT})
        await send('Emulation.setDeviceMetricsOverride', metrics)
        touch && await send('Emulation.setTouchEmulationEnabled', {enabled: true, maxTouchPoints: 5})
        await send('Emulation.setCPUThrottlingRate', {rate: cpu})
        net && await send('Network.emulateNetworkConditions', net)
        await send('Network.setCacheDisabled', {cacheDisabled: true})
        await send('Page.navigate', {url})
        await until(async () => events.includes('Page.loadEventFired'))
        await sleep(wait)
        loads.push(await ev(`({fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0, lcp: __perf.lcp, cls: __perf.cls, tbt: __perf.long.reduce((s, d) => s + Math.max(0, d - 50), 0), long: Math.max(0, ...__perf.long), nodes: document.getElementsByTagName('*').length})`))
        errors += events.filter(method => method === 'Runtime.exceptionThrown').length
    }

    // idle after the intro
    const {send, ev, events} = page
    const metric = async () => Object.fromEntries((await send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]))
    await sleep(2000)
    const a = await metric()
    await sleep(5000)
    const b = await metric()
    const idle = {ms: Math.round((b.TaskDuration - a.TaskDuration) * 1000), work: b.RecalcStyleCount - a.RecalcStyleCount + b.LayoutCount - a.LayoutCount}

    // wheel scroll to the end
    await ev(`scrollTo(0, 0); __perf.cls = 0; 1`)
    await sleep(500)
    await ev(`window.__frames = []; (function f(t) {__frames.push(t); __frames.length < 1e5 && requestAnimationFrame(f)})(performance.now()); 1`)
    const total = await ev('document.documentElement.scrollHeight - innerHeight')
    for (let y = 0; y < total; y += 120) {
        await send('Input.dispatchMouseEvent', {type: 'mouseWheel', x: 200, y: 400, deltaX: 0, deltaY: 120})
        await sleep(50)
    }
    await sleep(1500)
    const scroll = await ev(`(() => {const d = __frames.slice(1).map((t, i) => t - __frames[i]); __frames.length = 1e5; return {cls: __perf.cls, slow: d.filter(x => x > 33.4).length, frames: d.length}})()`)
    errors += events.filter(method => method === 'Runtime.exceptionThrown').length
    await page.close()

    const pick = key => Math.round(median(loads.map(load => load[key])))
    return {fcp: pick('fcp'), lcp: pick('lcp'), tbt: pick('tbt'), long: pick('long'), nodes: pick('nodes'), cls: Math.max(...loads.map(load => load.cls), scroll.cls), idle, scroll, errors}
}

// entry chunks from the build
if (!existsSync(join(DIST, 'index.html'))) fail('No dist/index.html: run npm run perf (it builds first).')
const browserPath = BROWSERS.find(path => path && existsSync(path)) ?? fail('No Chrome or Edge found: set BROWSER=<path>.')
const html = readFileSync(join(DIST, 'index.html'), 'utf8')
const chunks = [...html.matchAll(/<(?:script[^>]*type="module"[^>]*src|link[^>]*rel="modulepreload"[^>]*href)="([^"]+)"/g)].map(m => m[1])
const base = chunks[0].slice(0, chunks[0].indexOf('assets/'))
const entry = +(chunks.reduce((sum, file) => sum + gzipSync(readFileSync(join(DIST, file.slice(base.length)))).length, 0) / 1024).toFixed(1)

const dir = mkdtempSync(join(tmpdir(), 'rac-perf-'))
const browser = spawn(browserPath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', 'about:blank'], {stdio: 'ignore'})
const server = spawn(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort'], {cwd: ROOT, stdio: 'ignore'})
const stop = async () => {
    browser.kill()
    server.kill()
    await sleep(800)
    try {rmSync(dir, {recursive: true, force: true})} catch {/* browser still exiting */}
}

let result
try {
    const url = `http://localhost:${PORT}${base}`
    await until(async () => (await fetch(url)).ok)
    const port = await until(async () => readFileSync(join(dir, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim())
    result = {entry, mobile: await measure(port, url, 'mobile'), desktop: await measure(port, url, 'desktop')}
} catch (error) {
    await stop()
    fail(`perf failed: ${error.message}`)
}
await stop()

// compare with the last journal row
const journal = existsSync(JOURNAL) ? readFileSync(JOURNAL, 'utf8') : ''
const last = journal.split(/\r?\n/).filter(line => /^\| \d{4}-/.test(line)).at(-1)?.split('|').slice(4, 4 + COLUMNS.length).map(cell => parseFloat(cell))
const format = (value, name) => name === 'CLS' ? value.toFixed(3) : name === 'Entry KB' ? value.toFixed(1) : String(Math.round(value))
const values = COLUMNS.map(([, get]) => get(result))
const broken = COLUMNS.filter(([, , budget], i) => values[i] > budget).map(([name]) => name)
const idleWork = result.mobile.idle.work + result.desktop.idle.work
const errors = result.mobile.errors + result.desktop.errors
idleWork && broken.push('Idle (style/layout)')
errors && broken.push('Errors')

console.table(Object.fromEntries(COLUMNS.map(([name, , budget], i) => [name, {value: format(values[i], name), budget: `≤ ${budget}`, last: Number.isFinite(last?.[i]) ? format(last[i], name) : '—', ok: values[i] <= budget ? '✓' : '✗'}])))
for (const name of ['mobile', 'desktop']) {
    const {nodes, idle, scroll} = result[name]
    console.log(`${name}: ${nodes} DOM nodes, idle ${idle.ms} ms / ${idle.work} style+layout, scroll ${scroll.slow}/${scroll.frames} frames over 33 ms`)
}
console.log(errors ? `✗ ${errors} uncaught errors` : 'no uncaught errors')
console.log(broken.length ? `✗ over budget: ${broken.join(', ')}` : '✓ all budgets met')

if (LOG > 0) {
    if (!NOTE) fail('--log needs a note: npm run perf -- --log "why it changed"')
    const commit = execSync('git rev-parse --short HEAD', {cwd: ROOT}).toString().trim() + (execSync('git status --porcelain', {cwd: ROOT}).toString().trim() ? '+' : '')
    const lib = JSON.parse(readFileSync(join(ROOT, 'node_modules/react-animated-select/package.json'), 'utf8')).version
    const row = [new Date().toISOString().slice(0, 10), commit, lib, ...values.map((value, i) => format(value, COLUMNS[i][0])), NOTE.replace(/\|/g, '/')]
    appendFileSync(JOURNAL, `${journal.endsWith('\n') ? '' : '\n'}| ${row.join(' | ')} |\n`)
    console.log('logged to PERF.md')
}
process.exit(broken.length ? 1 : 0)
