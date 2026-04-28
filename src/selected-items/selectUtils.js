export const getHorizontalMargin = (el) => {
    const style = window.getComputedStyle(el)
    return parseFloat(style.marginLeft) + parseFloat(style.marginRight)
}

// calculates total width for each row of elements
export const getRowWidths = (elements) => {
    return elements.reduce((acc, el) => {
        const rect = el.getBoundingClientRect()
        const top = rect.top
        const width = rect.width
        acc[top] = (acc[top] || 0) + width
        return acc
    }, {})
}

export const initialState = {
    bottomDirection: false,
    selectHeight: null,
    spacer: {
        state: false,
        id: null,
        width: 0
    },
    activeHoverId: null,
    hoverRowTop: null,
    spacerWidths: {},
    entering: false,
    swipedId: null,
    leaving: false,
    rowEndIds: [],
    delWidth: 0,
}

export function selectReducer(state, action) {
    switch (action.type) {
        case 'SET': return {...state, ...action.payload}
        case 'SET_SPACER_WIDTH': return {...state, spacerWidths: {...state.spacerWidths, [action.id]: action.width}}
        default: return state
    }
}