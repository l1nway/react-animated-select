import {Atom, ImageUp, ImageOff, ChevronDown} from 'lucide-react'
import {AnimatePresence, m} from 'framer-motion'
import {options} from '../components/options'
import {Select} from 'react-animated-select'
import useIcons from './useIcons'

function Icons() {
    const {state, value, setValue, containerRefs, animation, dispatch} = useIcons()

    return (
        <section
            style={{paddingTop: '1em'}}
            className='rac-states'
            id='icons'
        >
            <div className='rac-code-title-container'>
                <div className='rac-code-icon'>
                    <Atom style={{color: '#c084fc'}}/>
                </div>
                <h3 className='rac-code-title'>
                    Icons
                </h3>
            </div>
            <p className='rac-icons-desc'>While the component ships with a default set of optimized SVGs, it offers full support for custom overrides. You can upload your own assets or programmatically define icons using custom <span style={{color: 'rgb(86, 156, 214)'}}>{`<img>`}</span> tags, inline SVGs, or dedicated React components to perfectly align with your design system. You can also simply disable any of the icons by specifying the value <span style={{color: 'rgb(244, 71, 71)'}}>false</span> in the prop.</p>
            <div className='rac-icons-props'>
                {state.items.map((item, index) =>
                    <div
                        onDragLeave={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget)) {
                                dispatch({type: 'SET_OVER', name: item.name, payload: false})
                            }
                        }}
                        onDragEnter={() => dispatch({type: 'SET_OVER', name: item.name, payload: true})}
                        ref={el => containerRefs.current[index] = el}
                        onDragOver={(e) => e.preventDefault()}
                        className='rac-icons-container'
                        onDrop={(e) => {
                            e.preventDefault()
                            dispatch({type: 'SET_OVER', name: item.name, payload: false})
                            const file = e.dataTransfer.files[0]
                            file && dispatch({type: 'SET_ICON', name: item.name, payload: file})
                        }}
                        key={item.name}
                    >
                        <label
                            style={{
                                borderColor: item.hover 
                                    ? 'rgb(192, 132, 252)' 
                                    : state.drag 
                                        ? '#8b5cf64d' 
                                        : ''
                            }}
                            className='rac-icons-title-container'
                            onClick={(e) => {
                                if (item.file) {
                                    e.preventDefault()
                                    dispatch({type: 'SET_ICON', name: item.name, payload: null})
                                }
                            }}
                        >
                            <AnimatePresence mode='wait' initial={false}>
                                {!item.file
                                    ? <m.div
                                        style={{border: !item.icon ? '0.1px solid gray' : ''}}
                                        className='rac-icons-icon'
                                        {...animation}
                                        key='def'
                                    >
                                        {item.icon}
                                    </m.div>
                                    : <m.img
                                        alt={`User's ${item.name} icon`}
                                        className='rac-icons-icon'
                                        src={item.file}
                                        {...animation}
                                        key='custom'
                                    />}
                            </AnimatePresence>
                            <h4 key='stable' className='rac-icons-title'>{item.name}</h4>
                            <AnimatePresence mode='wait' initial={false}>
                                <m.div
                                    key={item.file ? 'delete' : 'upload'}
                                    className='rac-file-icons'
                                    {...animation}
                                >
                                    {item.file
                                        ? <ImageOff className='rac-icons-upload'/>
                                        : <ImageUp className='rac-icons-upload'/>
                                    }
                                </m.div>
                            </AnimatePresence>
                                {!item.file && <input
                                    onChange={(e) => e.target.files[0] && dispatch({
                                        type: 'SET_ICON', 
                                        name: item.name, 
                                        payload: e.target.files[0]
                                    })}
                                    className='rac-demo-checkbox'
                                    accept='image/*'
                                    type='file'
                                />}
                        </label>
                        <span className='rac-icon-desc'>
                            {item.desc}</span>
                    </div>
                )}
            </div>
            <Select
                CheckmarkIcon={
                    state.items.find(i => i.name === 'Checkmark')?.file
                    ? <img alt='Checkmark icon' src={state.items.find(i => i.name === 'Checkmark').file}/>
                    : undefined
                }
                OpenIcon={
                    state.items.find(i => i.name === 'OpenIcon')?.file
                    ? <img alt='Arrow icon' src={state.items.find(i => i.name === 'OpenIcon').file}/>
                    : <ChevronDown/>
                }
                ClearIcon={
                    state.items.find(i => i.name === 'ClearIcon')?.file
                    ? <img alt='Close icon' src={state.items.find(i => i.name === 'ClearIcon').file}/>
                    : undefined
                }
                Checkbox={state.items.find(i => i.name === 'Checkbox')?.file
                    ? <img alt='Checkbox icon' src={state.items.find(i => i.name === 'Checkbox').file}/>
                    : undefined
                }
                DelIcon={state.items.find(i => i.name === 'DelIcon')?.file
                    ? <img alt='Delete icon' src={state.items.find(i => i.name === 'DelIcon').file}/>
                    : undefined
                }
                style={{'--rac-select-min-height': '2.5em'}}
                optionsClassName='rac-basic-options'
                className='rac-basic-select'
                onChange={setValue}
                options={options}
                value={value}
                multiple
            />
        </section>
    )
}

export default Icons