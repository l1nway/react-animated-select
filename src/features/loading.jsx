import {Pencil, CircleCheck, CircleX, Check, Scan, ChevronUp} from 'lucide-react'
import {AnimatePresence, m} from 'framer-motion'
import SlideDown from '../components/slideDown'
import {Spinner} from '../components/icons'
import {useReducer, useCallback, useRef, useEffect} from 'react'
import {Select} from 'react-animated-select'

const props = [
  {prop: 'hasMore', value: 'boolean', default: 'false', text: 'More pages exist: shows the loading footer, or the “Load more” row with loadButton.', selectable: true},
  {prop: 'loadMore', value: 'function', default: '() => {}', text: 'Loads the next page. A returned Promise unlocks the next load when it settles, success or failure.'},
  {prop: 'texts.loadingMore', value: 'string', default: 'Loading', text: 'Text of the loading footer and of the load button while loading.', editable: true},
  {prop: 'loadOffset', value: 'number', default: '100', text: 'Scroll distance (in pixels) from the end of the list that triggers loadMore.', editable: true},
  {prop: 'loadAhead', value: 'number', default: '3', text: 'Keyboard highlight distance (in options) from the end of the list that triggers loadMore.', editable: true},
  {prop: 'loadButton', value: 'boolean', default: 'false', text: 'A “Load more” row in the list instead of loading on scroll.', selectable: true},
  {prop: 'texts.loadMore', value: 'string', default: 'Load more', text: 'Text of the “Load more” row.', editable: true}
]

const colors = {
  function: 'rgb(220, 220, 170)',
  string: 'rgb(206, 145, 120)',
  number: 'rgb(181, 206, 168)',
  boolean: 'rgb(86, 156, 214)'
}

const options = ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5', 'Option 6', 'Option 7', 'Option 8', 'Option 9', 'Option 10', 'Option 11', 'Option 12', 'Option 13', 'Option 14']

const loadedOptions = [...options, 'Loaded option 1', 'Loaded option 2', 'Loaded option 3', 'Loaded option 4', 'Loaded option 5']

const animation = {
    initial: {x: -25, opacity: 0},
    animate: {x: 0, opacity: 1},
    exit: {x: -25, opacity: 0},
    transition: {
        transform: {duration: 0.3, ease: [0.34, 1.5, 0.64, 1]},
        opacity: {duration: 0.2, ease: 'linear'}
    }
}

const appearAnim = {
    initial: {scale: 0.5, opacity: 0},
    animate: {scale: 1, opacity: 1},
    exit: {scale: 0.5, opacity: 0},
    transition: {
        transform: {duration: 0.2, ease: [0.34, 1.8, 0.64, 1]},
        opacity: {duration: 0.2, ease: 'linear'}
    }
}

function Loading() {
    const [state, dispatch] = useReducer((prev, next) => ({ ...prev, ...next }), {
        loaded: false,
        hovered: false,
        hasMore: true,
        'texts.loadingMore': 'Loading',
        loadOffset: 100,
        loadAhead: 3,
        loadButton: true,
        'texts.loadMore': 'Load more'
    })
    
    const timer = useRef()
    useEffect(() => () => clearTimeout(timer.current), [])

    const trigger = useCallback(() => new Promise(resolve => {
        clearTimeout(timer.current)
        timer.current = setTimeout(resolve, 2000)
    }).then(() => dispatch({loaded: true})), [])

    const handleChange = (prop, val) => dispatch({[prop]: val})

    return (
        <section
            className='rac-loading'
            id='loading'
        >
            <div className='rac-code-title-container'>
                <div className='rac-code-icon'>
                    <Spinner/>
                </div>
                <h3 className='rac-code-title'>
                    Infinite Loading
                </h3>
            </div>
            <p className='rac-loading-desc'>Load options page by page. loadMore fires when the list is scrolled close to its end, when the keyboard highlight comes close to it, or on a “Load more” row. Bursts of scroll events trigger one load, and a failed request returned as a Promise unlocks the next attempt. Edit the props below and open the Select to try it.</p>
            <div className='rac-loading-props'>
                {props.map(item =>
                    <label className='rac-props-container' key={item.prop}>
                        <h3 className='rac-loading-prop'>{item.prop}</h3>
                        <span
                            style={{color: colors[item.value]}}
                            className='rac-loading-value'
                        >
                            {item.value}
                        </span>
                        {item.editable ?
                            <div className='rac-loading-input-container'>
                                <input
                                    onChange={(e) => handleChange(item.prop, e.target.value)}
                                    style={{color: colors[item.value]}}
                                    className='rac-loading-input'
                                    value={state[item.prop]}
                                    type='text'
                                />
                                <Pencil className='rac-loading-input-edit'/>
                            </div>
                        :
                            <div className='rac-loading-input-container'>
                                <AnimatePresence mode='wait' initial={false}>
                                    <m.div
                                        style={{
                                            color: item.default === '() => {}' 
                                                ? 'rgb(220, 220, 170)' 
                                                : state[item.prop] 
                                                    ? '#3fb950' 
                                                    : 'rgb(244, 71, 71)'
                                        }}
                                        key={state[item.prop] ? String(state[item.prop]) : item.default}
                                        className='rac-loading-default'
                                        {...animation}
                                    >
                                        {state[item.prop] ? String(state[item.prop]) : item.default}
                                    </m.div>
                                </AnimatePresence>
                                {item.selectable &&
                                    <div className='rac-checkbox-container'>
                                        <input
                                            onChange={(e) => handleChange(item.prop, e.target.checked)}
                                            className='rac-demo-checkbox'
                                            checked={state[item.prop]}
                                            type='checkbox'
                                        />
                                        <Scan
                                            style={{left: '-2em', top: '0.55em'}}
                                            className='rac-check-box'/>
                                        <Check
                                            className={`rac-check-mark ${state[item.prop] ? '--checked' : ''}`}
                                            style={{top: '0.75em', left: '-1.90em'}}
                                        />
                                    </div>
                                }
                            </div>
                        }
                        <span className='rac-loading-text'>{item.text}</span>
                    </label>
                )}
            </div>
            <SlideDown
                visibility={state.loaded}
                className='rac-loaded'
                easing='ease-in'
                duration={300}
            >
                <button
                    onClick={() => dispatch({loaded: false})}
                    onMouseLeave={() => dispatch({hovered: false})}
                    onMouseEnter={() => dispatch({hovered: true})}
                    className='rac-loaded-succesfully'
                >
                    <div className='rac-loaded-button'>
                        <AnimatePresence mode='wait' initial={false}>
                            {state.hovered
                                ? <div className='rac-loaded-container'>
                                    <m.span
                                        style={{paddingLeft: '1em'}}
                                        {...animation}
                                        key='del-text'
                                    >
                                        Want delete?
                                    </m.span>
                                    <m.div
                                        className='rac-loaded-icon'
                                        {...appearAnim}
                                        key='del-icon'
                                    >
                                        <CircleX/>
                                    </m.div>
                                </div>
                                : <div
                                    className='rac-loaded-container'
                                    key='check'
                                >
                                    <m.span
                                        key='success-text'
                                        {...animation}
                                    >
                                        Successfully loaded!
                                    </m.span>
                                    <m.div
                                        className='rac-loaded-icon'
                                        key='success-icon'
                                        {...appearAnim}
                                    >
                                        <CircleCheck/>
                                    </m.div>
                                </div>
                            }
                        </AnimatePresence>
                    </div>
                </button>
            </SlideDown>
            <Select
                hasMore={!state.loaded && state.hasMore}
                texts={{loadMore: state['texts.loadMore'], loadingMore: state['texts.loadingMore']}}
                loadOffset={Number(state.loadOffset)}
                optionsClassName='rac-basic-options'
                loadAhead={Number(state.loadAhead)}
                loadButton={state.loadButton}
                className='rac-basic-select'
                icons={{arrow: ChevronUp}}
                options={state.loaded ? loadedOptions : options}
                loadMore={trigger}
            />
        </section>
    )
}

export default Loading