import SelectedItem from './SelectedItem'
import {memo, Fragment} from 'react'
import Animated from '../animated'

const RenderedItem = memo(({element, index, setEntering, leaving, setLeaving, selectRef, setVisibility, setActiveHoverId, delSpacer, swiped, swipedId, onSwipe, activeHoverId, deleteInline, spacer, duration, normalizedOptions, setDeleting, renderIcon, deleting, DelIcon, remove, registerItemWidth, setSpacer, showDelete, ...props}) => {

    return (
        <Fragment>
            <Animated
                className='rac-multiple-option'
                onEnter={props.onEnter}
                setLeaving={setLeaving}
                setSpacer={setSpacer}
                onExit={props.onExit}
                duration={duration}
                id={element.id}
                in={props.in}
                widthMode
            >
                <SelectedItem
                    onRender={(width) => registerItemWidth(element.id, width)}
                    normalizedOptions={normalizedOptions}
                    setActiveHoverId={setActiveHoverId}
                    activeHoverId={activeHoverId}
                    setVisibility={setVisibility}
                    deleteInline={deleteInline}
                    key={element.id ?? index}
                    setDeleting={setDeleting}
                    setEntering={setEntering}
                    setLeaving={setLeaving}
                    renderIcon={renderIcon}
                    showDelete={showDelete}
                    setSpacer={setSpacer}
                    selectRef={selectRef}
                    delSpacer={delSpacer}
                    duration={duration}
                    deleting={deleting}
                    swipedId={swipedId}
                    onSwipe={onSwipe}
                    element={element}
                    DelIcon={DelIcon}
                    leaving={leaving}
                    swiped={swiped}
                    remove={remove}
                    spacer={spacer}
                    index={index}
                />
            </Animated>
            {(spacer.state && spacer.id === element.id) &&
                <div
                    style={{width: spacer.width-2}}
                    className='rac-spacer'
                />
            }
        </Fragment>
    )
})

export default RenderedItem