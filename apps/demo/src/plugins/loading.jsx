import {CircleCheck, CircleX} from 'lucide-react'
import {useReducer, useCallback, useRef, useEffect, useMemo, useState, memo} from 'react'
import {AnimatePresence, m} from 'framer-motion'
import {merge, slide, pop, arrowIcons, NONE, Warn, numbered} from '../components/helpers'
import {Table} from '../components/section'
import {Collapse} from '@l1nway/collapse'
import {Spinner} from '../components/icons'
import {Select, paging} from 'react-animated-select'
import './loading.css'

// demo data
const PAGING = [paging]
const desc = 'Load options page by page. loadMore fires when the list is scrolled close to its end, when the keyboard highlight comes close to it, or on a “Load more” row. Bursts of scroll events trigger one load, and a failed request returned as a Promise unlocks the next attempt. A first page shorter than the list loads the next ones at once, so the list fills itself and then loads as you scroll. Edit the props below and open the Select to try it.'
const needed = <>{desc}<Warn title='Without the plugin'>Import {'{paging}'} from the package and pass plugins={'{[paging]}'}. Without it hasMore, loadMore and loadButton do nothing, so none of the features below work.</Warn></>

const props = [
    {prop: 'plugins', type: 'object', default: '[]', show: on => on ? '{[paging]}' : '{[]}', text: 'Pass [paging]: without it hasMore, loadMore and loadButton do nothing.', kind: 'tick'},
    {prop: 'hasMore', type: 'boolean', default: 'false', text: 'More pages exist: shows the loading footer, or the “Load more” row with loadButton.', kind: 'tick'},
    {prop: 'loadMore', type: 'function', default: '() => {}', text: 'Loads the next page. A returned Promise unlocks the next load when it settles, success or failure.'},
    {prop: 'texts.loadingMore', type: 'string', default: 'Loading', text: 'Text of the loading footer and of the load button while loading.', kind: 'edit'},
    {prop: 'loadOffset', type: 'number', default: '100', text: 'Distance from the end of the list, in px, at which the next page loads.', kind: 'edit'},
    {prop: 'loadAhead', type: 'number', default: '3', text: 'Keyboard highlight distance (in options) from the end of the list that triggers loadMore.', kind: 'edit'},
    {prop: 'loadButton', type: 'boolean', default: 'false', text: 'A “Load more” row in the list instead of loading on scroll.', kind: 'tick'},
    {prop: 'texts.loadMore', type: 'string', default: 'Load more', text: 'Text of the “Load more” row.', kind: 'edit'}
]

const options = numbered(14)
const loadedOptions = [...options, ...numbered(5, 'Loaded option')]

const Loaded = memo(({onClose}) => {
    const [hovered, setHovered] = useState(false)
    const [text, Icon] = hovered ? ['Want delete?', CircleX] : ['Successfully loaded!', CircleCheck]
    return (
        <button className='rac-loaded-succesfully' onClick={onClose} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            <div className='rac-btn-bare rac-loaded-button'>
                <AnimatePresence mode='wait' initial={false}>
                    <div className='rac-loaded-container' data-del={hovered || undefined} key={text}>
                        <m.span {...slide}>{text}</m.span>
                        <m.div className='rac-loaded-icon' {...pop}><Icon/></m.div>
                    </div>
                </AnimatePresence>
            </div>
        </button>
    )
})

// [DOC: semantic-table]
function Loading() {
    const [state, dispatch] = useReducer(merge, {
        plugins: true,
        loaded: false,
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

    const handleChange = useCallback((prop, val) => dispatch({[prop]: val}), [])
    const close = useCallback(() => dispatch({loaded: false}), [])

    const loadMore = state['texts.loadMore']
    const loadingMore = state['texts.loadingMore']
    const texts = useMemo(() => ({loadMore, loadingMore}), [loadMore, loadingMore])

    return (
        <section className='rac-loading' id='loading'>
            <Table id='loading' icon={<Spinner/>} title='Infinite Loading' desc={needed} rows={props} state={state} onChange={handleChange}/>
            <Collapse in={state.loaded} className='rac-loaded' easing='ease-in' duration={300}>
                <Loaded onClose={close}/>
            </Collapse>
            <Select
                hasMore={!state.loaded && state.hasMore}
                options={state.loaded ? loadedOptions : options}
                loadOffset={Number(state.loadOffset)}
                loadAhead={Number(state.loadAhead)}
                loadButton={state.loadButton}
                loadMore={trigger}
                plugins={state.plugins ? PAGING : NONE}
                icons={arrowIcons}
                texts={texts}
            />
        </section>
    )
}

export default Loading
