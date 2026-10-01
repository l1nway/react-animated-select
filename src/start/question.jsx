import {BadgeQuestionMark, ChevronUp, Lock, Mic, SendHorizontal, ServerCrash, X} from 'lucide-react'
import {Suspense, memo, useEffect, useRef} from 'react'
import useRecorder, {HINT, LIMIT, WARN} from './useRecorder'
import {LoadingLottie} from '../animations/catEyes'
import {AnimatePresence, m} from 'framer-motion'
import {Motion} from '../components/motion'
import {animIcon, submit} from './components'
import useLLM, {MAX} from './useLLM'
import gsap from 'gsap'

const CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/'
const reveal = {initial: {height: 0, opacity: 0}, animate: {height: 'auto', opacity: 1}, exit: {height: 0, opacity: 0}, transition: {ease: [0, 0.55, 0.45, 1], duration: 0.6}}
const fade = {initial: {opacity: 0}, animate: {opacity: 1}, exit: {opacity: 0}, transition: {duration: 0.2}}
const grow = {initial: {width: 0, height: 0, opacity: 0}, animate: {width: '1.5em', height: '1.5em', opacity: 1}, exit: {width: 0, height: 0, opacity: 0}, transition: {duration: 0.3}}
const clock = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

const Answer = memo(function Answer({text}) {
    const boxRef = useRef(null)
    const scrambleRef = useRef(null)

    useEffect(() => {
        const done = () => {boxRef.current.dataset.done = ''}
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return done()
        const obj = {val: 0}
        const tween = gsap.to(obj, {
            val: text.length,
            duration: 1.5,
            ease: 'none',
            onUpdate: () => {
                const progress = Math.floor(obj.val)
                scrambleRef.current.textContent = text.slice(0, progress) + (progress < text.length ? CHARS[Math.floor(Math.random() * CHARS.length)] : '')
            },
            onComplete: done
        })
        return () => tween.kill()
    }, [text])

    return (
        <m.div className='rac-llm-reveal' {...reveal}>
            <div className='rac-llm-answer' ref={boxRef}>
                <p className='rac-llm-text'>{text}</p>
                <p className='rac-llm-scramble' ref={scrambleRef} aria-hidden/>
            </div>
        </m.div>
    )
})

function Question() {
    const {state, textareaRef, ask, notify, onChange, onInvalid, onSubmit} = useLLM()
    const {rec, mic, micRef, pillRef, cancel} = useRecorder(ask, notify)
    const {answer, loading, value, status} = state
    const {mode, seconds, keys} = rec
    const crash = mode ? null : state.crash
    const left = LIMIT - seconds
    const hint = left <= WARN ? `${left} s left` : mode === 'lock' ? 'Recording' : `${keys ? 'Arrow Up' : 'Slide up'} to lock`

    useEffect(() => {LoadingLottie.preload()}, [])

    return (
        <section
            className='rac-multiple'
            id='question'
        >
            <form className='rac-llm-form' onSubmit={onSubmit} aria-busy={loading}>
                <div className='rac-llm-head'>
                    <div className='rac-code-icon'>
                        <BadgeQuestionMark/>
                    </div>
                    <h3 className='rac-code-title' id='question-title'>
                        Ask a question
                    </h3>
                </div>
                <p className='rac-llm-desc' id='question-desc'>
                    If you are too lazy to dig through the documentation, you can ask a question about using the library directly and get a quick answer on the topic.
                </p>
                <div aria-live='polite'>
                    <AnimatePresence>
                        {answer && <Answer key='answer' text={answer}/>}
                    </AnimatePresence>
                </div>
                <div className='rac-llm-field' data-crash={crash ?? undefined}>
                    <textarea
                        aria-labelledby='question-title'
                        aria-describedby='question-desc'
                        readOnly={loading || !!mode}
                        placeholder='Ask a question…'
                        className='rac-llm-input'
                        onInvalid={onInvalid}
                        onChange={onChange}
                        enterKeyHint='send'
                        ref={textareaRef}
                        onKeyDown={submit}
                        maxLength={MAX}
                        value={value}
                        required
                        rows={1}
                    />
                    <AnimatePresence>
                        {mode &&
                            <m.div className='rac-llm-rec' data-warn={left <= WARN || undefined} {...fade} key='rec'>
                                <i className='rac-llm-dot'/>
                                <span className='rac-llm-clock'>{clock(seconds)}</span>
                                <span className='rac-llm-hint'>{hint}</span>
                                {mode === 'lock' &&
                                    <button className='rac-llm-cancel' onClick={cancel} type='button'>
                                        <X aria-hidden/> Cancel
                                    </button>
                                }
                            </m.div>
                        }
                    </AnimatePresence>
                    <AnimatePresence mode='popLayout'>
                        {loading ?
                            <m.div
                                className='rac-llm-container'
                                {...animIcon.container}
                                key='container'
                            >
                                <m.div
                                    className='rac-llm-thinking'
                                    {...animIcon.blur}
                                    key='text'
                                >
                                    <span className='rac-llm-loadholder'>AI is thinking</span>
                                    <div className='rac-loading-inline' aria-hidden>
                                        <i/><i/><i/>
                                    </div>
                                </m.div>
                                <m.div
                                    className='rac-llm-loading'
                                    {...animIcon.twist}
                                    key='loader'
                                    aria-hidden
                                >
                                    <Suspense fallback={null}>
                                        <LoadingLottie
                                            className='rac-cat-loading'
                                            loop={true}
                                        />
                                    </Suspense>
                                </m.div>
                            </m.div>
                        : value.trim()
                            ? <m.button
                                aria-label='Send question'
                                className='rac-send-icon'
                                {...animIcon.base}
                                type='submit'
                                key='send'
                            >
                                <SendHorizontal aria-hidden/>
                            </m.button>
                            : <m.button
                                aria-label={mode === 'lock' ? 'Send voice question' : 'Record a voice question, hold to talk'}
                                title={mode ? undefined : HINT}
                                data-mode={mode ?? undefined}
                                className='rac-mic-icon'
                                {...animIcon.base}
                                ref={micRef}
                                type='button'
                                key='mic'
                                {...mic}
                            >
                                {mode === 'lock' ? <SendHorizontal aria-hidden/> : <Mic aria-hidden/>}
                            </m.button>
                        }
                    </AnimatePresence>
                    <AnimatePresence>
                        {crash &&
                            <m.span className='rac-llm-crash' {...grow} key='crash' aria-hidden>
                                <ServerCrash/>
                            </m.span>
                        }
                    </AnimatePresence>
                    {mode === 'hold' &&
                        <div className='rac-llm-lock' ref={pillRef} aria-hidden>
                            <Lock/>
                            <ChevronUp/>
                        </div>
                    }
                </div>
                <div className='rac-llm-foot'>
                    <p className='rac-llm-status' data-error={status?.error || undefined} role='status'>{status?.text}</p>
                    {value.length >= MAX * 0.8 &&
                        <span className='rac-llm-count' data-full={value.length >= MAX || undefined}>{value.length} / {MAX}</span>
                    }
                </div>
            </form>
        </section>
    )
}

export default function MotionQuestion() {
    return <Motion><Question/></Motion>
}
