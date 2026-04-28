import {useCallback, useReducer, useRef, useMemo} from 'react'
import {shake, clearShake} from './components'
import axios from 'axios'
import gsap from 'gsap'

function useLLM() {
    const [state, dispatch] = useReducer((prev, next) => ({...prev, ...next}), {
        recording: false,
        loading: false,
        answer: '',
        value: '',
        height: 0
    })
        
    const {value, height} = state
    
    const refs = {
        mediaRecorder: useRef(null),
        audioChunks: useRef(null),
        textarea: useRef(null),
        answer: useRef(null),
        height: useRef(null),
        lottie: useRef(null)
    }

    const animText = useMemo(() => ({
        initial: {
            backgroundColor: 'transparent',
            marginBottom: 0,
            marginRight: 0,
            marginLeft: 0,
            marginTop: 0,
            opacity: 0,
            padding: 0,
            height: 0,
        },
        animate: {
            backgroundColor: '#1a1a24',
            marginBottom: '1.5em',
            marginRight: 0,
            height: height,
            padding: '1em',
            marginLeft: 0,
            marginTop: 0,
            opacity: 1,
        },
        exit: {
            backgroundColor: 'transparent',
            marginBottom: 0,
            height: height,
            opacity: 0,
            padding: 0,
        },
        transition: {
            ease: [0, 0.55, 0.45, 1], 
            duration: 0.6,
        },
    }), [height])

    const askLLM = useCallback(async (e, audioBlob = null) => {
        clearShake(refs.textarea.current)
        e?.preventDefault()
        
        if (!value.trim() && !audioBlob) return
        try {
            dispatch({loading: true, height: refs?.height?.current?.scrollHeight || 0, answer: ''})

            const formData = new FormData()
            if (audioBlob) formData.append('audio', audioBlob, 'record.webm')
            else formData.append('prompt', value.trim())
            
            const res = await axios.post('https://react-animated-select-backend.online/ask', formData)
            dispatch({value: '', answer: res.data.answer})

            requestAnimationFrame(() => {
                if (refs.height.current) {
                    dispatch({height: refs.height.current.scrollHeight})
                    animateText(res.data.answer)
                }
            })
        } catch (error) {
            shake(refs.textarea.current)
            console.error(error)
        } finally {
            dispatch({loading: false})
        }
    }, [value])

    const animateText = useCallback((text) => {
        const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/'
        const obj = {val: 0}
        
        gsap.killTweensOf(obj)

        gsap.to(obj, {
            val: text.length,
            duration: 1.5,
            ease: 'none',
            onUpdate: () => {
                const progress = Math.floor(obj.val)
                const scrambled = text.substring(0, progress) + 
                    (progress < text.length 
                        ? chars[Math.floor(Math.random() * chars.length)] 
                        : '')
                
                if (refs.answer.current) refs.answer.current.innerText = scrambled
            },
            onComplete: () => dispatch({height: 'auto'})
        })
    }, [])

    const onChange = useCallback((e) => {
        clearShake(e.target)
        dispatch({value: e.target.value})
        e.target.setCustomValidity('')
    }, [])

    const startRecording = useCallback(async () => {
        try {
            clearShake(refs.textarea.current)
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : 'audio/webm'

            const stream = await navigator.mediaDevices.getUserMedia({audio: true})

            refs.mediaRecorder.current = new MediaRecorder(stream, {mimeType})
            refs.audioChunks.current = []

            refs.mediaRecorder.current.ondataavailable = (e) => (e.data.size > 0) && refs.audioChunks.current.push(e.data)

            refs.mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(refs.audioChunks.current, {type: mimeType})
                await askLLM(null, audioBlob)
                stream.getTracks().forEach(track => track.stop())
            }

            refs.mediaRecorder.current.start(1000)
            dispatch({recording: true})
        } catch (err) {
            console.error(err)
            dispatch({recording: false})
            shake(refs.textarea.current)
        }
    }, [])

    const stopRecording = useCallback(() => {
        if (refs.mediaRecorder.current && state.recording) {
            refs.mediaRecorder.current.stop()
            dispatch({recording: false})
        }
    }, [state.recording])

    return ({state, refs, animText, askLLM, onChange, startRecording, stopRecording})
}

export default useLLM 