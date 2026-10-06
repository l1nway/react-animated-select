import {memo, useState, useEffect, useReducer, useMemo, useCallback} from 'react'
import {XMarkIcon, ArrowUpIcon, CheckmarkIcon} from '../components/icons'
import {merge, popSlow, arrowIcons, prevent, options} from '../components/helpers'
import {CHIPS} from '../components/chips'
import {Atom, ImageUp, ImageOff, Tag, FileText} from 'lucide-react'
import {Table, Text} from '../components/section'
import {AnimatePresence, m} from 'framer-motion'
import {Select} from 'react-animated-select'
import './icons.css'

// demo data
const items = [
    {name: 'arrow', icon: <ArrowUpIcon/>, desc: 'The chevron of the trigger and of the group headers. Draw it pointing up: the Select rotates it with CSS, so it points down while the menu is closed and flips up when the menu opens. false hides the arrows.'},
    {name: 'clear', icon: <XMarkIcon/>, desc: 'The clear button that resets the whole selection. false removes the button and the Delete key shortcut.'},
    {name: 'remove', icon: <XMarkIcon/>, desc: 'The delete button of each chip in multiple mode. false removes the button, the Backspace shortcut and the long-press delete mode.'},
    {name: 'check', icon: <CheckmarkIcon/>, desc: 'The tick inside the checkbox of a selected option in multiple mode. false leaves the checkbox empty.'},
    {name: 'checkbox', icon: false, desc: 'The checkbox frame of each option in multiple mode. Without it, the built-in 1em frame is drawn around the check icon.'}
]

const desc = <>The component ships with its own SVG icons, and every one of them is a key of the <code data-tone='prop'>icons</code> prop. A key takes a React component, an element such as an <code data-tone='tag'>{'<img>'}</code> or inline SVG, or an image URL; upload or drop a file on a card below to try it. Pass only the keys you change, and set a key to <code data-tone='off'>false</code> to turn that control off.</>

const columns = [[Tag, 'Key'], [FileText, 'Description']]
const selectStyle = {'--rac-row': '2.5em'}

const listen = (events, method) => Object.entries(events).forEach(([type, fn]) => window[method](type, fn))

const Row = memo(({item, file, onFile}) => {
    const {name, icon, desc} = item
    const [over, setOver] = useState(false)
    const Action = file ? ImageOff : ImageUp
    const leave = e => e.currentTarget.contains(e.relatedTarget) || setOver(false)
    const drop = e => {
        e.preventDefault()
        setOver(false)
        e.dataTransfer.files[0] && onFile(name, e.dataTransfer.files[0])
    }
    return (
        <tr className='rac-icons-container' onDragEnter={() => setOver(true)} onDragLeave={leave} onDragOver={prevent} onDrop={drop}>
            <th className='rac-icons-key' scope='row' data-over={over || undefined} data-fill>
                <label className='rac-icons-title-container'>
                    <AnimatePresence mode='wait' initial={false}>
                        {file ?
                            <m.img className='rac-icons-icon' alt={`User's ${name} icon`} src={file} key='custom' {...popSlow}/>
                        :
                            <m.div className='rac-icons-icon' key='def' aria-hidden {...popSlow}>{icon}</m.div>
                        }
                    </AnimatePresence>
                    <span className='rac-icons-title'>{name}</span>
                    <AnimatePresence mode='wait' initial={false}>
                        <m.div className='rac-file-icons' key={file ? 'delete' : 'upload'} {...popSlow}><Action className='rac-icons-upload' aria-hidden/></m.div>
                    </AnimatePresence>
                    {file ?
                        <button className='rac-icons-cover' onClick={() => onFile(name, null)} aria-label={`Remove custom ${name} icon`} type='button'/>
                    :
                        <input className='rac-icons-cover' onChange={e => e.target.files[0] && onFile(name, e.target.files[0])} aria-label={`Upload ${name} icon`} accept='image/*' type='file'/>
                    }
                </label>
            </th>
            <Text>{desc}</Text>
        </tr>
    )
})

// [DOC: icons-grid]
function Icons() {
    const [files, dispatch] = useReducer(merge, {})
    const [drag, setDrag] = useState(false)
    const [value, setValue] = useState(null)

    useEffect(() => {
        const events = {
            dragover: e => {e.preventDefault(); setDrag(true)},
            dragleave: e => (!e.relatedTarget || e.relatedTarget === document.documentElement) && setDrag(false),
            drop: e => {e.preventDefault(); setDrag(false)}
        }
        listen(events, 'addEventListener')
        return () => listen(events, 'removeEventListener')
    }, [])

    const setFile = useCallback((name, file) => dispatch({[name]: file && URL.createObjectURL(file)}), [])
    const icons = useMemo(() => ({...arrowIcons, ...Object.fromEntries(Object.entries(files).filter(([, url]) => url))}), [files])

    return (
        <section className='rac-states rac-icons' id='icons' aria-labelledby='icons-title'>
            <Table id='icons' icon={<Atom className='rac-icons-atom'/>} title='Icons' desc={desc} columns={columns} className='rac-icons-table' data-drag={drag || undefined}>
                {items.map(item => <Row key={item.name} item={item} file={files[item.name]} onFile={setFile}/>)}
            </Table>
            <Select onChange={setValue} style={selectStyle} options={options} icons={icons} value={value} plugins={CHIPS} multiple/>
        </section>
    )
}

export default Icons
