import {useCallback, useEffect, useReducer, useRef} from 'react'
import {clearShake, merge, shake} from './components'

export const MAX = 2048
const API = 'https://react-animated-select-backend.online/ask'
const TIMEOUT = 45000
const SLOW = 3000
const BUSY = 'The server is busy, still waiting for an answer…'
const EMPTY = 'LLM technologies are not that advanced yet, unfortunately.'
const FAILED = 'Something went wrong on the server. Try again later.'
const ERRORS = {
    timeout: 'The server took too long to answer. Try again.',
    network: 'Could not reach the server. Check your connection.',
    empty: 'No answer came back. Try rephrasing the question.',
    413: 'The question is too long.',
    429: 'Too many questions in a row. Wait a minute and try again.'
}

function useLLM() {
    const [state, dispatch] = useReducer(merge, {loading: false, answer: '', value: '', status: null, crash: null})
    const textareaRef = useRef(null)
    const request = useRef(null)
    const refocus = useRef(null)
    const timer = useRef()

    useEffect(() => () => {
        request.current?.abort()
        clearTimeout(timer.current)
    }, [])

    // focus restore
    useEffect(() => {
        if (state.loading || !refocus.current) return
        if (!textareaRef.current?.form?.contains(document.activeElement)) refocus.current.current?.focus({preventScroll: true})
        refocus.current = null
    }, [state.loading])

    const notify = useCallback((text, error) => {
        clearTimeout(timer.current)
        dispatch({status: text ? {text, error} : null})
        if (error) shake(textareaRef.current)
        else clearShake(textareaRef.current)
        if (text && !error) timer.current = setTimeout(() => dispatch({status: null}), 4000)
    }, [])

    const ask = useCallback(async (body, back) => {
        request.current?.abort()
        const ctrl = request.current = new AbortController()
        const timeout = setTimeout(() => ctrl.abort('timeout'), TIMEOUT)
        const slow = setTimeout(() => dispatch({crash: 'slow', status: {text: BUSY}}), SLOW)
        refocus.current = textareaRef.current?.form?.contains(document.activeElement) ? back : null
        notify(null)
        dispatch({loading: true, answer: '', crash: null})
        try {
            const res = await fetch(API, {method: 'POST', body, signal: ctrl.signal}).catch(() => {throw new Error(navigator.onLine ? 'blocked' : 'network')})
            if (!res.ok) throw new Error(res.status)
            const {answer} = await res.json()
            if (typeof answer !== 'string' || !answer.trim()) throw new Error('empty')
            dispatch({answer, value: '', status: null, crash: null})
        } catch (err) {
            if (ctrl.signal.aborted && ctrl.signal.reason !== 'timeout') return
            if (!ctrl.signal.aborted) console.error(err)
            notify(ERRORS[ctrl.signal.aborted ? 'timeout' : err.message] ?? FAILED, true)
            dispatch({crash: 'error'})
        } finally {
            clearTimeout(timeout)
            clearTimeout(slow)
            if (request.current === ctrl) dispatch({loading: false})
        }
    }, [notify])

    const onChange = useCallback((e) => {
        e.target.setCustomValidity(e.target.value.trim() ? '' : EMPTY)
        clearShake(e.target)
        dispatch({value: e.target.value, status: null, crash: null})
    }, [])

    const onInvalid = useCallback((e) => {
        e.target.setCustomValidity(EMPTY)
        shake(e.target)
    }, [])

    const onSubmit = useCallback((e) => {
        e.preventDefault()
        const text = state.value.trim()
        if (state.loading || !text) return
        const body = new FormData()
        body.append('prompt', text)
        ask(body, textareaRef)
    }, [ask, state.value, state.loading])

    return {state, textareaRef, ask, notify, onChange, onInvalid, onSubmit}
}

export default useLLM
