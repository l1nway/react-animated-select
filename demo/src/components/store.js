import {configureStore, createSlice} from '@reduxjs/toolkit'

const catSlice = createSlice({
    name: 'cat-eyes',
    initialState: {
        status: 'idle',
        lastProgress: 0,
        scrollTo: null
    },
    reducers: {
        showEyes: (state) => {
            state.status = 'show'
        },
        eyesWatching: (state) => {
            state.status = 'pointer'
        },
        hideEyes: (state) => {
            state.status = 'exit'
        },
        hiddenEyes: (state) => {
            state.status = 'idle'
            state.lastProgress = 0
        },
        setScrollTarget: (state, action) => {
            state.scrollTo = action.payload
        },
        clearScrollTarget: (state) => {
            state.scrollTo = null
        }
    }
})

export const {showEyes, eyesWatching, hideEyes, hiddenEyes, setScrollTarget, clearScrollTarget} = catSlice.actions
export const store = configureStore({reducer: {cat: catSlice.reducer}})