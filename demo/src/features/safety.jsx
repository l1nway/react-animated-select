import {vscDarkPlus} from 'react-syntax-highlighter/dist/esm/styles/prism'
import {ShieldCogCorner, Plus, Trash, X, ChevronDown} from 'lucide-react'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import {m, AnimatePresence} from 'framer-motion'
import {clearShake} from '../start/components'
import {Select} from 'react-animated-select'
import {useSafety, parse} from './useSafety'

function Safety() {
    const {state, dispatch, containerAnim, itemAnim, addOption, removeOption, itemsRef, contentRef, inputRef} = useSafety()
    const {options, option, height, value} = state
    return (
        <section
            className='rac-multiple'
            id='safety'
        >
            <div className='rac-code-title-container'>
                <div className='rac-code-icon'>
                    <ShieldCogCorner/>
                </div>
                <h3 className='rac-code-title'>
                    Safety
                </h3>
            </div>
            <p className='rac-safety-desc'>
                This developer-first component is engineered for seamless integration and maximum runtime resilience, ensuring the application remains stable even when encountering malformed data. It features a robust error-handling layer that prevents crashes by gracefully processing invalid inputs; whether passed as numbers, strings, booleans, or objects missing standard name/label or id/value keys, the Select will attempt to parse and render them. Even in extreme cases where unsupported types like functions are provided as options, the component catches the exception and displays a safe "Invalid Option" fallback rather than breaking the render cycle.
            </p>
            <AnimatePresence initial={false}>
                {options.length > 0 &&
                    <m.div
                        className='rac-safety'
                        {...containerAnim}
                        layout
                    >
                        <div
                            className='rac-safety-options'
                            ref={contentRef}
                        >
                            <AnimatePresence initial={false}>
                                {options.map((option, index) =>
                                    <m.div
                                        ref={el => itemsRef.current[parse(option)] = el}
                                        className='rac-safety-container'
                                        {...itemAnim(parse(option))}
                                        key={parse(option)}
                                        layout
                                    >
                                        <SyntaxHighlighter
                                            customStyle={{backgroundColor: 'transparent'}}
                                            className='rac-safety-code'
                                            style={vscDarkPlus}
                                            language='jsx'
                                        >
                                            {parse(option)}
                                        </SyntaxHighlighter>
                                        <Trash
                                            onClick={() => removeOption(index)}
                                            className='rac-safety-delete'
                                        />
                                    </m.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <X
                            onClick={() => dispatch({options: []})}
                            className='rac-safety-x'
                            style={{height}}
                        />
                    </m.div>
                }
            </AnimatePresence>
            <form
                className='rac-safety-interactive'
                onSubmit={addOption}
            >
                <h4 className='rac-safety-title'>
                    Try by you own!
                </h4>
                <div
                    className='rac-safety-add'
                    data-value={option}
                >
                    <input
                        onChange={e => {
                            [Object.values(itemsRef.current), inputRef.current].flat().forEach(clearShake)
                            dispatch({option: e.target.value})
                        }}
                        className='rac-safety-input'
                        ref={inputRef}
                        value={option}
                        type='text'
                    />
                    <Plus
                        className='rac-safety-plus'
                        onClick={addOption}
                    />
                </div>
            </form>
            <Select
                optionsClassName='rac-basic-options'
                onChange={v => dispatch({value: v})}
                className='rac-basic-select'
                OpenIcon={<ChevronDown/>}
                options={options}
                value={value}
            />
        </section>
    )
}

export default Safety