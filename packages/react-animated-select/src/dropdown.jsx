import {memo, useCallback, useContext, useRef, useState, useSyncExternalStore} from 'react'
import {SelectConfigContext, SelectActionsContext, SelectStateContext} from './state'
import {dots, flag, withClass} from './utils'
import {createPortal} from 'react-dom'
import {Collapse} from './motion'
import OptionList from './optionList'
import useDropdownPosition from './dropdownPosition'

// [DOC: options-panel]
const toVars = (style = {}) => Object.fromEntries(Object.entries(style).filter(([key]) => key.startsWith('--')))

// [DOC: options-panel]
const portalTarget = (container) => (typeof container === 'function' ? container() : container) || document.body

const noSubscribe = () => () => {}

// [DOC: state-semantics]
export function StatusRow({more, ref}) {
    const {texts} = useContext(SelectConfigContext)
    const {loading, error} = useContext(SelectStateContext)
    if (!error && !loading && !more) return null
    // one node for every status
    return (
        <div ref={ref} className='rac-option' data-error={flag(error)} data-loading={flag(!error)}>
            <span className='rac-option-text'>{error ? texts.error : loading ? texts.loading : texts.loadingMore}</span>
            {!error && dots}
        </div>
    )
}

// [DOC: options-panel]
const Dropdown = /* @__PURE__ */ memo(function Dropdown() {
    const {selectRef, selectId, multiple, offset, duration, easing, animateOpacity, keepMounted, optionsClassName, style, container, texts, popup, ext} = useContext(SelectConfigContext)
    const {visibility, normalizedOptions} = useContext(SelectStateContext)
    const {setListReady} = useContext(SelectActionsContext)
    const open = visibility && normalizedOptions.length > 0

    // [DOC: server-render]
    const client = useSyncExternalStore(noSubscribe, () => true, () => false)

    // [DOC: dropdown-position]
    const [following, setFollowing] = useState(false)
    if (open && client && !following) setFollowing(true)
    // [DOC: dropdown-flip]
    const [flip, setFlip] = useState(null)
    const onFlip = useCallback(() => setFlip(phase => phase || 'out'), [])

    const panelRef = useRef(null)
    const [listRef, replace] = useDropdownPosition({selectRef, panelRef, open: following, frozen: !open || flip === 'out', offset, onFlip})

    const onExited = () => {
        if (flip === 'out' && open) {
            replace(panelRef.current)
            setFlip('in')
            return
        }
        setFlip(null)
        setFollowing(false)
    }
    const onEntered = () => {
        setFlip(null)
        setListReady(true)
    }

    // [DOC: popup]
    if (!client || !popup) return null

    return createPortal(
        <Collapse
            axis='y'
            fade={animateOpacity}
            in={open && flip !== 'out'}
            duration={flip ? duration / 2 : undefined}
            nodeRef={panelRef}
            unmountOnExit={!keepMounted && !(flip && open)}
            onEntered={onEntered}
            onExited={onExited}
            onMouseDown={(e) => e.preventDefault()}
            className={withClass('rac-options', optionsClassName)}
            style={{...toVars(style), '--rac-duration': `${duration}ms`, '--rac-ease': easing, pointerEvents: open ? 'auto' : 'none', position: 'absolute'}}
        >
            <div
                className='rac-list'
                aria-multiselectable={multiple}
                id={`${selectId}-listbox`}
                aria-label={texts.list}
                role='listbox'
                tabIndex='-1'
                ref={listRef}
            >
                <OptionList/>
                {/* [DOC: plugins] */}
                {ext.Footer ? <ext.Footer/> : <StatusRow/>}
            </div>
        </Collapse>,
        portalTarget(container)
    )
})

export default Dropdown
