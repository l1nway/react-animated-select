const multer = require('multer')

const env = (key, fallback) => Number(process.env[key]) || fallback

const MAX_PROMPT = 2048
const MAX_AUDIO = 1024 * 1024
const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE

const LIMITS = [
    {window: MINUTE, max: env('LIMIT_PER_MINUTE', 5)},
    {window: DAY, max: env('LIMIT_PER_DAY', 50)}
]
const GLOBAL_PER_DAY = env('LIMIT_GLOBAL_PER_DAY', 2000)

const clients = new Map()
const global = []
const busy = new Set()

const prune = (hits, now, window) => {
    while (hits.length && now - hits[0] >= window) hits.shift()
}

// stale entries cleanup
setInterval(() => {
    const now = Date.now()
    for (const [ip, hits] of clients) {
        prune(hits, now, DAY)
        if (!hits.length) clients.delete(ip)
    }
}, 10 * MINUTE).unref()

const tooMany = (res, ms) => {
    res.set('Retry-After', String(Math.ceil(ms / 1000)))
    res.status(429).json({error: 'Too many questions, try again later'})
}

function rateLimit(req, res, next) {
    const now = Date.now()
    const {ip} = req
    if (busy.has(ip)) return tooMany(res, 5000)

    const hits = clients.get(ip) ?? []
    for (const {window, max} of LIMITS) {
        const recent = hits.filter(t => now - t < window)
        if (recent.length >= max) return tooMany(res, window - (now - recent[0]))
    }
    prune(global, now, DAY)
    if (global.length >= GLOBAL_PER_DAY) return tooMany(res, DAY - (now - global[0]))

    prune(hits, now, DAY)
    hits.push(now)
    global.push(now)
    clients.set(ip, hits)
    busy.add(ip)
    res.on('close', () => busy.delete(ip))
    next()
}

const parse = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: MAX_AUDIO, files: 1, fields: 2, parts: 3, fieldSize: MAX_PROMPT * 4},
    fileFilter: (req, file, cb) => cb(null, file.mimetype.split(';')[0].startsWith('audio/'))
}).single('audio')

const TOO_LARGE = ['LIMIT_FILE_SIZE', 'LIMIT_FIELD_VALUE']

function upload(req, res, next) {
    parse(req, res, err => {
        if (!err) return next()
        if (err instanceof multer.MulterError) {
            const large = TOO_LARGE.includes(err.code)
            return res.status(large ? 413 : 400).json({error: large ? 'Request is too large' : 'Malformed request'})
        }
        next(err)
    })
}

module.exports = {rateLimit, upload, MAX_PROMPT}
