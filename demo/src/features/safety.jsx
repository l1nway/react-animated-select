import {vscDarkPlus} from 'react-syntax-highlighter/dist/esm/styles/prism'
import {ShieldCogCorner, Plus, Trash, X, ChevronDown} from 'lucide-react'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import {Select} from 'react-animated-select'
import {useCallback, useState} from 'react'

const parse = (option) => {
    if (typeof option === 'string') return `'${option}'`
  
    if (option === undefined) return 'undefined'
    if (option === null) return 'null'
    
    if (typeof option === 'function') return 'function () {[native code]}'
    
    if (typeof option === 'object') return JSON.stringify(option)

    return String(option)
}

function Safety() {

    const [value, setValue] = useState()
    const [options, setOptions] = useState(['Option 1', true, false, undefined, null, console.log, {name: 'Option 7', disabled: true}, {name: 'Option 8'}, {random: 'Option 9'}, {name: 'Option 10', id: 2}, {id: 'Option 11'}])

    const [option, setOption] = useState('')

    const addOption = useCallback(() => {
        if (!option.trim()) return

        let parsedValue
        try {
            if (option.startsWith('{') || option.startsWith('[')) {
                parsedValue = new Function(`return ${option}`)()
            } 
            
            else if (option.includes('=>') || option.includes('function')) {
                parsedValue = new Function(`return ${option}`)()
            }
            
            else if (!isNaN(option) && option.trim() !== '') {
                parsedValue = Number(option)
            }
            
            else if (option === 'true') parsedValue = true
            else if (option === 'false') parsedValue = false
            else if (option === 'undefined') parsedValue = undefined
            else if (option === 'null') parsedValue = null

            else {parsedValue = option}

            setOptions(prev => [...prev, parsedValue])
            setOption('')
        } catch (e) {
            setOptions(prev => [...prev, option])
            setOption('')
        }
    }, [option])

    const removeOption = useCallback((removing) => {
        setOptions(prev => prev.filter((_, index) => index !== removing))
    }, [])

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
            {options.length > 0 &&
                <div className='rac-safety'>
                    <div className='rac-safety-options'>
                        {options.map((option, index) =>
                            <div
                                className='rac-safety-container'
                                key={parse(option)}
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
                            </div>
                        )}
                    </div>
                    <X onClick={() => setOptions([])} className='rac-safety-x'/>
            </div>}
            <div className='rac-safety-interactive'>
                <h4 className='rac-safety-title'>
                    Try by you own!
                </h4>
                <div
                    className='rac-safety-add'
                    data-value={option}
                >
                    <input
                        onChange={e => setOption(e.target.value)}
                        className='rac-safety-input'
                        value={option}
                        type='text'
                    />
                    <Plus
                        className='rac-safety-plus'
                        onClick={addOption}
                    />
                </div>
            </div>
            <Select
                optionsClassName='rac-basic-options'
                className='rac-basic-select'
                OpenIcon={<ChevronDown/>}
                onChange={setValue}
                options={options}
                value={value}
            />
        </section>
    )
}

export default Safety