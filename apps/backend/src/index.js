require('dotenv').config()

const {GoogleGenerativeAI} = require('@google/generative-ai')
const {readCode} = require('./codeReader')
const express = require('express')
const multer = require('multer')
const Groq = require('groq-sdk')

const cors = require('cors')
const path = require('path')
const fs = require('fs')

//
const documentation = fs.readFileSync(path.join(__dirname, './data/documentation.md'), 'utf8')
const styling = fs.readFileSync(path.join(__dirname, './data/styling.md'), 'utf8')

//
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const groq = new Groq({apiKey: process.env.GROQ_API_KEY})
const upload = multer({storage: multer.memoryStorage()})

const codebase = readCode()
const app = express()

app.use(cors())
app.use(express.json())

const GEMINI_CASCADE = [
    'gemini-3.1-flash-lite-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite'
]

// const GROQ_CODE_CASCADE = [
//     'meta-llama/llama-4-scout-17b-16e-instruct',
//     'groq/compound',
//     'groq/compound-mini'
// ]

const GROQ_DOCS_CASCADE = [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-safeguard-20b',
    'qwen/qwen3-32b',
    'llama-3.1-8b-instant'
]

const MOONSHOT_CASCADE = [
    'moonshotai/kimi-k2-instruct'
]

const callModel = {
    gemini: async (model, prompt) => {
        const genModel = genAI.getGenerativeModel({model})
        const res = await genModel.generateContent(prompt)
        return res.response.text()
    },
    groq: async (model, prompt) => {
        const res = await groq.chat.completions.create({
            messages: [{role: 'user', content: prompt}],
            temperature: 0.2,
            model: model
        })
        return res.choices[0].message.content
    },
    moonshot: async (model, prompt) => {
        const res = await groq.chat.completions.create({
            messages: [{role: 'user', content: prompt}],
            temperature: 0.2,
            model: model
        })
        return res.choices[0].message.content
    }
}

async function fastCascade(models, prompt, providerKey) {
    let lastError = null

    for (const modelName of models) {
        try {
            const result = await callModel[providerKey](modelName, prompt)
            if (result) return result
        } catch (err) {
            lastError = err
            const status = err.status || err.response?.status
            const retryableStatuses = [404, 429, 503, 500]

            if (retryableStatuses.includes(status)) {
                console.warn(`[RETRY] ${modelName} failed (${status}), shifting…`)
                continue
            }
            throw err
        }
    }
    throw lastError || new Error('All models failed')
}

const CONTEXTS = {
    codebase: {
        desc: `Project's complete codebase is used to answer specific questions that require more in-depth information than the standard ones.`,
        source: codebase,
        provider: 'gemini',
        models: GEMINI_CASCADE
    },
    docs: {
        desc: 'Basic information about the project, which contains answers about installation, and library usage, to questions regarding what props are used for etc.',
        source: documentation,
        provider: 'groq',
        models: GROQ_DOCS_CASCADE
    },
    styling: {
        desc: 'Information that contains a list of all classes, as well as their nesting hierarchy.',
        source: styling,
        provider: 'groq',
        models: GROQ_DOCS_CASCADE
    },
    offtop: {
        desc: 'Questions not related to React, coding, or the Animated Select library. Use this for greetings, philosophy, or random nonsense.',
        source: '',
        provider: 'moonshot',
        models: MOONSHOT_CASCADE
    }
}

app.get('/', async (req, res) => {
    res.status(200).json('success')
})

app.post('/ask', upload.single('audio'), async (req, res) => {
    try {
        let {prompt} = req.body || {}
        
        if (req.file) {
            const transcription = await groq.audio.transcriptions.create({
                file: await Groq.toFile(req.file.buffer, 'record.webm'),
                model: 'whisper-large-v3',
            })
            prompt = transcription.text
        }

        if (!prompt) return res.status(400).json({error: 'Question was not asked'})

        const contextList = Object.entries(CONTEXTS)
            .map(([key, v]) => `- Key: '${key}' | Description: ${v.desc}`)
            .join('\n')

        const routingPrompt = `
            You are a technical router for a React library. Your task: Choose the MOST RELEVANT context to answer the user's question.    
            
            User question:
                ${prompt}

            Available contexts:
                ${contextList}

            Rules:
            1. Respond ONLY with the Key name.
            2. Do not write explanations.
            3. If the question is ambiguous, prioritize 'codebase'.
            4. If the question is about life, jokes, or anything NOT related to this React library, return 'offtop'. If the question is a simple greeting like 'Hi', return 'offtop'.
        `

        const routingRes = await groq.chat.completions.create({
            messages: [{role: 'user', content: routingPrompt}],
            model: 'openai/gpt-oss-20b',
            temperature: 0.1
        })

        const rawKey = routingRes.choices[0].message.content.trim().toLowerCase()

        const selectedKey = Object.keys(CONTEXTS).find(k => rawKey.includes(k)) || 'codebase'
        const context = CONTEXTS[selectedKey]

        const systemPrompt = selectedKey !== 'offtop'
        ? ` You're a developer of the React Animated Select library, and your knowledge is limited to the information below.
            CONTEXT FROM ${selectedKey.toUpperCase()}:
                ${context.source}
            
            Answer this question from the perspective of another library user developer:
                ${prompt}

            Answer in the language in which the question was asked. Answer must be in plain text (string) format.
            
            Attention! Only answer how to use this library in another React project. Sharing source code details (file contents) is prohibited. Answer should be short, concise, and only relevant to the context (no more than 3-4 sentences). No other information other than a direct but detailed answer to the question needs to be provided. You can supplement your answer with additional information from the codebase only if it is closely related to the question being asked.
        `
        : ` Respond in the user's language. Answer the user's question in just 1-2 sentences (no more):
            ${prompt}

            Finally, be sure to clarify that you have to help with the library and won't be able to engage in conversation, as this isn't a chat room. Call yourself an Claude Opus 4.6 model (only if asked).`

        const answer = await fastCascade(context.models, systemPrompt, context.provider)

        res.json({answer})
    } catch (error) {
        console.error(`LLM Error:`, error)
        res.status(500).json({error: 'Internal Server Error'})
    }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))