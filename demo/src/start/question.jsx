import {BadgeQuestionMark, Mic, SendHorizontal, ServerCrash} from 'lucide-react'
import catLoading from '../animations/cat-loading.json'
import {AnimatePresence, m} from 'framer-motion'
import {animIcon, submit} from './components'
import Lottie from 'lottie-react'
import useLLM from './useLLM'

function Question() {
    const {state, refs, animText, askLLM, onChange, startRecording, stopRecording} = useLLM()
    const {answer, loading, value} = state

    return (
        <section
            className='rac-multiple'
            id='question'
        >
            <form className='rac-llm-form' onSubmit={askLLM}>
                <fieldset className='rac-llm-head'>
                    <div className='rac-code-icon'>
                        <BadgeQuestionMark/>
                    </div>
                    <h3 className='rac-code-title'>
                        Ask a question
                    </h3>
                </fieldset>
                <legend className='rac-llm-desc'>
                    If you are too lazy to dig through the documentation, you can ask a question about using the library directly and get a quick answer on the topic.
                </legend>
                <AnimatePresence mode='wait'>
                    {answer &&
                        <m.div
                            key='answer-container'
                            exit={{height: 0}}
                        >
                            <m.div
                                id='rac-llm-answer'
                                ref={refs.answer}
                                {...animText}
                                key='answer'
                            />
                            <div
                                style={{marginBottom: animText.animate.marginBottom, padding: animText.animate.padding}}
                                className='rac-answer-height'
                                ref={refs.height}
                            >
                                {answer}
                            </div>
                        </m.div>
                    }
                </AnimatePresence>
                <label className='rac-llm-field'>
                    <textarea
                        onInvalid={(e) => e.target.setCustomValidity('LLM technologies are not that advanced yet, unfortunately.')}
                        placeholder='Ask a question…'
                        className='rac-llm-input'
                        onChange={onChange}
                        ref={refs.textarea}
                        onKeyDown={submit}
                        disabled={loading}
                        value={value}
                        required
                        rows={1}
                    />
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
                                    <div className='rac-loading-inline'>
                                        <i/><i/><i/>
                                    </div>
                                </m.div>
                                {/* <ServerCrash
                                    className='rac-server-busy'
                                /> */}
                                <m.div
                                    className='rac-llm-loading'
                                    {...animIcon.twist}
                                    key='loader'
                                >
                                    <Lottie
                                        className='rac-cat-loading'
                                        animationData={catLoading}
                                        lottieRef={refs.lottie}
                                        loop={true}
                                    />
                                </m.div>
                            </m.div>
                        : value.trim().length === 0 
                            ? <m.button
                                className={`${state.recording ? 'recording' : ''} rac-mic-icon`}
                                onMouseDown={startRecording}
                                onMouseLeave={stopRecording}
                                onMouseUp={stopRecording}
                                {...animIcon.base}
                                type='button'
                                key='mic'
                            >
                                <Mic/>
                            </m.button>
                            : <m.button
                                className='rac-send-icon'
                                {...animIcon.base}
                                type='submit'
                                key='send'
                            >
                                <SendHorizontal/>
                            </m.button>
                        }
                    </AnimatePresence>
                </label>
            </form>
        </section>
    )
}

export default Question