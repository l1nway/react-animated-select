import SelectedItem from './SelectedItem'
import {memo, Fragment} from 'react'
import Animated from '../animated'

const RenderedItem = memo(({element, index, spacer, duration, setState, ...rest}) => {
    return (
        <Fragment>
            <Animated
                setEntering={(bool) => setState({entering: bool})}
                setLeaving={(bool) => setState({leaving: bool})}
                setSpacer={(val) => setState({spacer: val})}
                className='rac-multiple-option'
                onEnter={rest.onEnter}
                onExit={rest.onExit}
                duration={duration}
                id={element.id}
                in={rest.in}
                widthMode
            >
                <SelectedItem
                    onRender={(width) => rest.registerItemWidth(element.id, width)}
                    setState={setState}
                    duration={duration}
                    element={element}
                    spacer={spacer}
                    index={index}
                    {...rest}
                />
            </Animated>
            {(spacer.state && spacer.id === element.id) &&
                <div
                    style={{width: spacer.width}}
                    className='rac-spacer'
                />
            }
        </Fragment>
    )
})

export default RenderedItem