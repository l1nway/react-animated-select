require('dotenv').config()

const {rateLimit, upload, MAX_PROMPT} = require('./limits')
const {answer, transcribe} = require('./llm')
const express = require('express')
const cors = require('cors')

const proxy = process.env.TRUST_PROXY || '2'
const DEADLINE = 40000
const ORIGINS = [/^https:\/\/l1nway\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/]

const app = express()
app.set('trust proxy', /^\d+$/.test(proxy) ? Number(proxy) : proxy)
app.use(cors({origin: ORIGINS}))

app.get('/', (req, res) => res.status(200).json('success'))

app.post('/ask', rateLimit, express.json({limit: '16kb'}), upload, async (req, res) => {
    const ctrl = new AbortController()
    const signal = AbortSignal.any([ctrl.signal, AbortSignal.timeout(DEADLINE)])
    res.on('close', () => res.writableEnded || ctrl.abort())
    try {
        let {prompt} = req.body || {}
        if (req.file) prompt = await transcribe(req.file, signal)

        prompt = typeof prompt === 'string' ? prompt.trim() : ''
        if (!prompt) return res.status(400).json({error: 'Question was not asked'})
        if (prompt.length > MAX_PROMPT) return res.status(413).json({error: 'The question is too long'})

        res.json({answer: await answer(prompt, signal)})
    } catch (error) {
        if (ctrl.signal.aborted) return
        if (error.audio) return res.status(400).json({error: 'The recording could not be read'})
        console.error(`LLM Error:`, error)
        res.status(500).json({error: 'Internal Server Error'})
    }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
