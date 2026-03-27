import SelectedItem from './SelectedItem'
import {memo, Fragment} from 'react'
import Animated from '../animated'

const RenderedItem = memo(({element, index, leaving, setLeaving, selectRef, setVisibility, setActiveHoverId, delSpacer, swiped, swipedId, setSwipedId, onSwipe, activeHoverId, deleteInline, spacer, duration, normalizedOptions, setDeleting, renderIcon, deleting, DelIcon, remove, registerItemWidth, setSpacer, ...props}) => {

    return (
        <Fragment>
            <Animated
                className='rac-multiple-option'
                onEnter={props.onEnter}
                setLeaving={setLeaving}
                setSpacer={setSpacer}
                onExit={props.onExit}
                duration={duration}
                in={props.in}
                id={element.id}
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
                    setSwipedId={setSwipedId}
                    setLeaving={setLeaving}
                    renderIcon={renderIcon}
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