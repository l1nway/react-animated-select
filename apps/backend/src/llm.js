const {readCode} = require('./codeReader')
const Groq = require('groq-sdk')
const path = require('path')
const fs = require('fs')

const read = file => fs.readFileSync(path.join(__dirname, 'data', file), 'utf8').replace(/<!--[\s\S]*?-->\s*/g, '').trim()
const fill = (text, vars) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key])

const groq = new Groq({apiKey: process.env.GROQ_API_KEY, timeout: 30000, maxRetries: 0})
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

const gemini = async ({id, config}, system, user, signal) => {
    const res = await fetch(`${GEMINI_URL}/${id}:generateContent`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY},
        body: JSON.stringify({systemInstruction: {parts: [{text: system}]}, contents: [{role: 'user', parts: [{text: user}]}], generationConfig: config}),
        signal
    })
    const json = await res.json()
    if (!res.ok) throw Object.assign(new Error(json.error?.message || res.statusText), {status: res.status, headers: res.headers})
    return json.candidates?.[0]?.content?.parts?.filter(part => !part.thought).map(part => part.text).join('')
}

const call = {
    groq: ({id, config}, system, user, signal) => groq.chat.completions
        .create({model: id, messages: [{role: 'system', content: system}, {role: 'user', content: user}], ...config}, {signal})
        .then(res => res.choices[0].message.content),
    gemini
}

// models, see CLAUDE.md "Models"
const groqModel = (id, config) => ({provider: 'groq', id, config})
const geminiModel = (id, thinkingLevel, maxOutputTokens = 2048) => ({provider: 'gemini', id, config: {maxOutputTokens, ...(thinkingLevel && {thinkingConfig: {thinkingLevel}})}})

const OSS_20 = groqModel('openai/gpt-oss-20b', {reasoning_effort: 'low', max_completion_tokens: 1024})
const OSS_120 = groqModel('openai/gpt-oss-120b', {reasoning_effort: 'low', max_completion_tokens: 2048})
const QWEN = groqModel('qwen/qwen3.8-27b', {reasoning_effort: 'none', max_completion_tokens: 1024})
const FLASH_LITE = geminiModel('gemini-3.5-flash-lite', 'minimal')
const FLASH_LITE_OLD = geminiModel('gemini-3.1-flash-lite')

const ROLES = {
    router: {timeout: 6000, models: [OSS_20, QWEN, FLASH_LITE, FLASH_LITE_OLD]},
    docs: {timeout: 15000, spread: 2, models: [OSS_120, QWEN, geminiModel('gemini-3.5-flash-lite', 'low'), OSS_20, FLASH_LITE_OLD]},
    codebase: {timeout: 25000, spread: 2, models: [
        geminiModel('gemini-3.8-flash', 'low'), geminiModel('gemini-3.6-flash', 'low'),
        geminiModel('gemini-3.7-flash', 'low'), geminiModel('gemini-3.5-flash', 'low'),
        geminiModel('gemini-3.5-flash-lite', 'high'), FLASH_LITE_OLD
    ]},
    offtop: {timeout: 8000, models: [QWEN, FLASH_LITE, OSS_20]}
}

// cooldown after 429 / 404 / failures
const until = new Map()
const COOL = {429: 60000, 404: 3600000}
const cool = (model, err) => {
    const retry = err.headers?.get?.('retry-after') ?? err.headers?.['retry-after'] ?? /retry in ([\d.]+)s/i.exec(err.message)?.[1]
    until.set(model.id, Date.now() + (Number(retry) * 1000 || COOL[err.status] || 15000))
}

const order = role => {
    const spread = role.spread || 1
    const turn = role.turn = ((role.turn ?? -1) + 1) % spread
    const list = [...role.models.slice(turn, spread), ...role.models.slice(0, turn), ...role.models.slice(spread)]
    const ready = list.filter(model => (until.get(model.id) ?? 0) <= Date.now())
    return ready.length ? ready : list
}

async function run(name, system, user, signal) {
    const role = ROLES[name]
    let lastError = null
    for (const model of order(role)) {
        const started = Date.now()
        try {
            const text = (await call[model.provider](model, system, user, AbortSignal.any([signal, AbortSignal.timeout(role.timeout)])))?.trim()
            if (text) {
                console.log(`[${name}] ${model.id} ${Date.now() - started}ms`)
                return text
            }
            lastError = new Error(`${model.id} returned no text`)
        } catch (err) {
            if (signal.aborted) throw err
            lastError = err
            cool(model, err)
            console.warn(`[${name}] ${model.id} failed (${err.status || err.name}): ${String(err.message).slice(0, 120)}`)
        }
    }
    throw lastError || new Error(`No model for ${name}`)
}

const code = readCode()
const SYSTEM = {
    router: read('prompts/router.md'),
    docs: fill(read('prompts/answer.md'), {name: 'usage', context: read('documentation.md')}),
    styling: fill(read('prompts/answer.md'), {name: 'styling', context: read('styling.md')}),
    codebase: fill(read('prompts/codebase.md'), {version: code.version, context: code.text}),
    offtop: read('prompts/offtop.md')
}
const KEYS = ['docs', 'styling', 'codebase', 'offtop']

async function route(question, signal) {
    try {
        const raw = (await run('router', SYSTEM.router, question, signal)).toLowerCase()
        return KEYS.find(key => raw.includes(key)) || 'docs'
    } catch (err) {
        if (signal.aborted) throw err
        return 'docs'
    }
}

// the site shows plain text
const plain = text => text
    .replace(/^\s*```.*\n?/gm, '')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

async function reply(question, signal) {
    const key = await route(question, signal)
    if (key === 'offtop') return run('offtop', SYSTEM.offtop, question, signal)
    if (key !== 'codebase') {
        const text = await run('docs', SYSTEM[key], question, signal)
        if (!/^\W*ESCALATE\b/.test(text)) return text
        console.log(`[${key}] escalated to codebase`)
    }
    return run('codebase', SYSTEM.codebase, question, signal)
}

const answer = async (question, signal) => plain(await reply(question, signal))

const WHISPER = ['whisper-large-v3', 'whisper-large-v3-turbo']
const VOCABULARY = 'React Animated Select, Select, Option, OptGroup, props, chips, paging, onChange, optionsClassName, CSS.'

async function transcribe(file, signal) {
    const name = `record${/\.(webm|mp4|m4a|ogg|wav|mp3|mpeg|flac)$/i.exec(file.originalname || '')?.[0] || '.webm'}`
    let lastError = null
    for (const model of WHISPER) {
        try {
            return (await groq.audio.transcriptions.create({file: await Groq.toFile(file.buffer, name), model, prompt: VOCABULARY}, {signal})).text
        } catch (err) {
            if (signal.aborted) throw err
            if (err.status === 400) throw Object.assign(err, {audio: true})
            lastError = err
            console.warn(`[transcribe] ${model} failed (${err.status || err.name})`)
        }
    }
    throw lastError
}

module.exports = {answer, transcribe}
