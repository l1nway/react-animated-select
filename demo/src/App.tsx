import {JSX, useEffect, useRef, useState} from 'react'
import {Select} from 'react-animated-select'
import SlideDown from './slideDown'
import {motion, useInView} from 'framer-motion'
import {shake, clearShake} from './shake'

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faTrashCan} from '@fortawesome/free-solid-svg-icons'

import './rac.css'
function App() {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false)
  const [disabled, setDisabled] = useState<boolean>(false)

  type Primitive = string | number | boolean | undefined

  type ObjectOption = {
      id?: string | number
      name?: string
      value?: string | number
      label?: string
      disabled?: boolean
  }

  type SelectOption = Primitive | ObjectOption

  const [options, setOptions] = useState<SelectOption[]>(['Option 1', true, false, undefined, console.log, {name: 'Option 6', disabled: true}, 'Option 7', {name: 'Option 8'}, {disabled: true}, {name: 'Option 10', id: 2}, 'Option 11', 'Option 12', 'Option 13', 'Option 14', 'Option 15'])

  const [value, setValue] = useState<Primitive>()

  const [placeholder, setPlaceholder] = useState<string>('Choose option')

  const [emptyText, setEmptyText] = useState<string>('No options')

  const [loadingText, setLoadingText] = useState<string>('Loading')

  const [errorText, setErrorText] = useState<string>('Failed to load')

  const [disabledText, setDisabledText] = useState<string>('Disabled')

  const [duration, setDuration] = useState<number>(300)

  const [easing, setEasing] = useState<string>('ease-out')

  const [offset, setOffset] = useState<number>(2)

  const [animateOpacity, setAnimateOpacity] = useState<boolean>(true)

  const [alwaysOpen, setAlwaysOpen] = useState<boolean>(false)

  type SettingItem = {
    label: string
    state: boolean
    setState: (value: boolean) => void
  }

  const settings: SettingItem[] = [
    {label: 'loading', state: loading, setState: setLoading},
    {label: 'disabled', state: disabled, setState: setDisabled},
    {label: 'error', state: error, setState: setError},
    {label: 'alwaysOpen', state: alwaysOpen, setState: setAlwaysOpen},
    {label: 'animateOpacity', state: animateOpacity, setState: setAnimateOpacity}
  ]

  const renderSettings: JSX.Element[] = settings.map((item) => (
    <label
      key={item.label}
      className='rac-checkbox-wrapper'
    >
      <input
        className='rac-demo-checkbox'
        type='checkbox'
        checked={item.state}
        onChange={(e) => item.setState(e.target.checked)}
      />
      {item.label}
    </label>
  ))

  type TextSettingItem = {
    label: string
    value: string | undefined
    setValue: (value: string) => void
  }

  const textSettings: TextSettingItem[] = [
    {label: 'placeholder', value: placeholder, setValue: setPlaceholder},
    {label: 'emptyText', value: emptyText, setValue: setEmptyText},
    {label: 'loadingText', value: loadingText, setValue: setLoadingText},
    {label: 'errorText', value: errorText, setValue: setErrorText},
    {label: 'disabledText', value: disabledText, setValue: setDisabledText},
  ]

  const renderTextSettings: JSX.Element[] = textSettings.map((item) => (
    <label
      key={item.label}
      className='rac-prop-label'
    >
      <span
        className='rac-prop-span'
      >
        {item.label}
      </span>
      <input
        className='rac-prop-value'
        placeholder={item.label}
        type='text'
        value={item.value}
        onChange={(e) => item.setValue(e.target.value)}
      />
    </label>
  ))

  const [inputValue, setInputValue] = useState('')
  const [disabledOption, setDisabledOption] = useState<boolean>(false)

  const buttonRef = useRef<HTMLInputElement>(null)

  const addOption = (disabled: boolean) => {
    !inputValue && shake(buttonRef.current)
    const newOption = inputValue
      ? {name: inputValue, disabled: disabled}
      : null

    setOptions((prev) => [newOption, ...prev])
    setInputValue('')
  }


  const removeOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  const renderOptionValue = (value: SelectOption): string => {
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (typeof value === 'function') return value.toString()
    if (value === undefined) return 'undefined'
    if (value === null) return 'null'

    if (typeof value === 'object') {
      if ('name' in value && typeof value.name === 'string') {
        return value.name
      }

      return JSON.stringify(value)
    }

    return String(value)
  }
  
  const ref = useRef(null)
  const visible = useInView(ref, {amount: 0.1, margin: '100px 0px 50px 0px'})

  const renderOptionList = options.map((element, index) =>
    <motion.div
      tabIndex={0}
      className='rac-option-demo'
      style={{ 
          willChange: 'transform, opacity, height',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)'
      }}
      ref={ref}
      layoutId={String(index)}
      layout={visible}
      viewport={{once: false, amount: 0.1, margin: '0px 0px 0px 0px'}}
      initial={{opacity: 0, scale: 0.9}}
      whileInView={{opacity: 1, scale: 1}}
      transition={{
          layout: { 
              type: 'spring', 
              stiffness: 300, 
              damping: 30
          },
          default: { 
              duration: 0.3, 
              ease: 'easeInOut'
          },
          opacity: {duration: 0.3}
      }}
      exit={{opacity: 0, scale: 0.8, transition: {duration: 0.3}}}
    >
      <span>
        {renderOptionValue(element)}
      </span>
      <button
        onClick={() => removeOption(index)}
        className='rac-delete-demo-option'
      >
        <FontAwesomeIcon
          icon={faTrashCan}
          className='rac-delete-button-icon'
        />
      </button>
    </motion.div>
  )

  const [demolist, setDemolist] = useState<boolean>(false)

  const [showAdded, setShowAdded] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  const handleAdd = () => {
    setShowAdded(true)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setShowAdded(false)
      timeoutRef.current = null
    }, 3000)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div
        className='rac-main'
    >
      <h1
        className='rac-lead-title'
      >
        react-animated-select demo
      </h1>
        <div
          className='rac-groups'
        >
          <div
            className='rac-props'
          >
            <h2
              className='rac-props-title'
            >
              Select states
            </h2>
            {renderSettings}
                <label
                  className='rac-range-label'
                >
                  <span
                    className='rac-prop-span'
                  >
                    duration: {duration ?? 300}ms
                  </span>
                  <input
                    className='rac-range-input'
                    type='range'
                    min={0}
                    max={1000}
                    step={50}
                    value={duration ?? 300}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  />
                </label>
                <label
                  className='rac-range-label'
                >
                  <span
                    className='rac-prop-span'
                  >
                    offset: {offset}px
                  </span>
                  <input
                    className='rac-range-input'
                    type='range'
                    min={0}
                    max={25}
                    step={1}
                    value={offset ?? 3}
                    onChange={(e) => setOffset(Number(e.target.value))}
                  />
                </label>
                
                <label
                  className='rac-prop-label'
                >
                  <span
                    className='rac-prop-span'
                  >
                    easing
                  </span>
                  <input
                    type='text'
                    className='rac-prop-value'
                    value={easing}
                    onChange={e => setEasing(e.target.value)}
                  />
                </label>
          </div>
          <div
            className='rac-visual'
          >
            <div
              className='rac-texts'
            >
              <h2
                className='rac-placeholders-title'
              >
                State placeholders
              </h2>
              <div
                className='rac-placeholders-list'
              >
                {renderTextSettings}
              </div>
            </div>
          </div>
          <div
            className='rac-select-wrapper'
          >
            <h3
              className='rac-select-overview-title'
            >
              react-animated-select overview
            </h3>
            <Select
              className='rac-demo-select'
              loading={loading}
              error={error}
              disabled={disabled}
              options={options}
              value={value}
              placeholder={placeholder}
              emptyText={emptyText}
              loadingText={loadingText}
              errorText={errorText}
              disabledText={disabledText}
              duration={duration}
              offset={offset}
              animateOpacity={animateOpacity}
              alwaysOpen={alwaysOpen}
              onChange={setValue}
            />
              <h3
                className='rac-option-title'
              >
                Add option
              </h3>
              <div
                className='rac-form-group'
              >
                <input
                  className='rac-add-option'
                  type='text'
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder='name'
                />
                <label
                  className='rac-checkbox-wrapper'
                >
                  <input
                    type='checkbox'
                    className='rac-demo-checkbox'
                    checked={disabledOption}
                    onChange={(e) => setDisabledOption(e.target.checked)}
                  />
                  <span
                    className='rac-disabled-title'
                  >
                    Disabled
                  </span>
                </label>
                <button
                  ref={buttonRef}
                  onClick={() => {
                    addOption(disabledOption)
                    handleAdd()
                  }}
                  className='rac-add-option-button'
                >
                  Add
                </button>
                <SlideDown
                  visibility={showAdded}
                >
                  <span
                    className='rac-added-option'
                    // style={{color: inputValue ? '#35bb61' : 'red'}}
                    style={{color: '#35bb61'}}
                  >
                    Added!
                    {/* {inputValue ? 'Added!' : 'You created an empty option'} */}
                  </span>
                </SlideDown>
              </div>
              <button
                onClick={() => setDemolist(!demolist)}
                className='rac-option-list-button'
              >
                <span
                  key={String(demolist)}
                  className='rac-fade-text'
                >
                  {demolist ? 'Hide options' : 'Show options'}
                </span>
              </button>
              <SlideDown
                visibility={demolist}
              >
                <div
                  className='rac-demo-option-list'
                >
                  {renderOptionList}
                </div>
              </SlideDown>
            </div>
          </div>
</div>
    )
}
export default App