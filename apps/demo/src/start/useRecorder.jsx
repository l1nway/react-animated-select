import {useCallback, useEffect, useMemo, useReducer, useRef} from 'react'
import {merge} from '../components/helpers'

export const LIMIT = 60
export const WARN = 15
export const HINT = 'Hold the mic to record, slide up to lock'
const READY = 'Microphone is ready. Hold the mic to record.'
const TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
const BITRATE = 24000
const KEYS = [' ', 'Enter']
const LOCK = 60
const MIN = 500
const FAILS = {
    NotAllowedError: 'Microphone access is blocked. Allow it in the browser settings.',
    NotFoundError: 'No microphone found.',
    NotReadableError: 'The microphone is busy with another app.'
}

const stopTracks = stream => stream?.getTracks().forEach(track => track.stop())
const permission = () => navigator.permissions?.query({name: 'microphone'}).then(p => p.state, () => null)

function useRecorder(ask, notify) {
    const [rec, dispatch] = useReducer(merge, {mode: null, seconds: 0, keys: false})
    const session = useRef({})
    const gesture = useRef({pointer: null, y: 0, up: -Infinity})
    const warm = useRef(false)
    const micRef = useRef(null)
    const pillRef = useRef(null)

    const finish = useCallback((send) => {
        const s = session.current
        if (!s.mode) return
        clearInterval(s.tick)
        const ok = send && s.recorder && Date.now() - s.start >= MIN
        if (s.recorder) {
            s.recorder.onstop = ok ? () => {
                const blob = new Blob(s.chunks, {type: s.recorder.mimeType || s.chunks[0]?.type || 'audio/webm'})
                if (!blob.size) return notify('Nothing was recorded. Check the microphone.', true)
                const body = new FormData()
                body.append('audio', blob, `record.${blob.type.split(/[/;]/)[1]}`)
                ask(body, micRef)
            } : null
            if (s.recorder.state !== 'inactive') s.recorder.stop()
        }
        stopTracks(s.stream)
        session.current = {}
        dispatch({mode: null, seconds: 0})
        if (send && !ok) notify(HINT)
    }, [ask, notify])

    const press = useCallback(async (keys, mode = 'hold') => {
        if (session.current.mode) return
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return notify('Voice input is not supported in this browser.', true)
        const s = session.current = {mode}
        const begin = Date.now()
        notify(null)
        dispatch({mode, seconds: 0, keys})
        try {
            const state = await permission()
            const stream = await navigator.mediaDevices.getUserMedia({audio: true})
            const waited = Date.now() - begin
            const prompted = !warm.current && (state === 'prompt' ? waited > 300 : !state && waited > 1000)
            warm.current = true
            if (session.current !== s || (prompted && s.mode === 'hold')) {
                stopTracks(stream)
                if (session.current === s) finish(false)
                if (prompted) notify(READY)
                return
            }
            s.stream = stream
            const type = TYPES.find(item => MediaRecorder.isTypeSupported(item))
            const recorder = new MediaRecorder(stream, {mimeType: type, audioBitsPerSecond: BITRATE})
            const chunks = []
            recorder.ondataavailable = e => e.data.size && chunks.push(e.data)
            recorder.start()
            const start = Date.now()
            const tick = setInterval(() => {
                const seconds = Math.floor((Date.now() - start) / 1000)
                if (seconds >= LIMIT) finish(true)
                else dispatch({seconds})
            }, 250)
            Object.assign(s, {recorder, chunks, start, tick})
        } catch (err) {
            if (session.current !== s) return
            finish(false)
            notify(FAILS[err?.name] ?? 'Could not start the microphone.', true)
        }
    }, [finish, notify])

    const lock = useCallback(() => {
        session.current.mode = 'lock'
        dispatch({mode: 'lock'})
    }, [])

    const cancel = useCallback(() => {
        finish(false)
        micRef.current?.focus({preventScroll: true})
    }, [finish])

    // gesture handlers
    const mic = useMemo(() => {
        const release = (e, send) => {
            const g = gesture.current
            g.pointer = null
            g.up = e.timeStamp
            if (session.current.mode === 'hold') finish(send)
        }
        return {
            onPointerDown: e => {
                if (e.button || session.current.mode) return
                e.currentTarget.setPointerCapture(e.pointerId)
                gesture.current = {pointer: e.pointerId, y: e.clientY, up: -Infinity}
                press(false)
            },
            onPointerMove: e => {
                const {pointer, y} = gesture.current
                if (session.current.mode !== 'hold' || e.pointerId !== pointer) return
                const progress = Math.min(Math.max((y - e.clientY) / LOCK, 0), 1)
                pillRef.current?.style.setProperty('--rac-lock', progress)
                if (progress === 1) lock()
            },
            onPointerUp: e => e.pointerId === gesture.current.pointer && release(e, true),
            onPointerCancel: e => e.pointerId === gesture.current.pointer && release(e, false),
            onKeyDown: e => {
                const {mode} = session.current
                const held = gesture.current.pointer === 'key'
                if (e.key === 'ArrowUp' && mode === 'hold' && held) {
                    e.preventDefault()
                    return lock()
                }
                if (!KEYS.includes(e.key) || (mode && !held && !e.repeat)) return
                e.preventDefault()
                if (e.repeat || mode) return
                gesture.current = {pointer: 'key', y: 0, up: -Infinity}
                press(true)
            },
            onKeyUp: e => {
                if (!KEYS.includes(e.key) || gesture.current.pointer !== 'key') return
                e.preventDefault()
                release(e, true)
            },
            onClick: e => {
                const {mode} = session.current
                if (e.timeStamp - gesture.current.up < 400) return
                if (mode === 'lock') finish(true)
                else if (!mode) press(false, 'lock')
            },
            onContextMenu: e => e.preventDefault()
        }
    }, [press, lock, finish])

    // escape and blur
    const active = rec.mode !== null
    useEffect(() => {
        if (!active) return
        const key = e => e.key === 'Escape' && finish(false)
        const blur = () => session.current.mode === 'hold' && finish(false)
        window.addEventListener('keydown', key)
        window.addEventListener('blur', blur)
        return () => {
            window.removeEventListener('keydown', key)
            window.removeEventListener('blur', blur)
        }
    }, [active, finish])

    useEffect(() => () => finish(false), [finish])

    return {rec, mic, micRef, pillRef, cancel}
}

export default useRecorder
