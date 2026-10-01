import {createContext, useInsertionEffect, useRef, useState} from 'react'

// [DOC: contexts]
export const SelectConfigContext = createContext(null)
export const SelectActionsContext = createContext(null)
export const SelectStateContext = createContext(null)

// [DOC: compact-reducer]
export const compactReducer = (state, next) => {
    const patch = typeof next === 'function' ? next(state) : next
    if (patch === state) return state
    const changed = Object.keys(patch).some(key => !Object.is(patch[key], state[key]))
    return changed ? {...state, ...patch} : state
}

// [DOC: store]
export const createStore = (initial) => {
    let state = initial
    const listeners = new Set()

    return {
        get: () => state,
        set: (patch) => {
            if (Object.keys(patch).every(key => Object.is(patch[key], state[key]))) return
            state = {...state, ...patch}
            listeners.forEach(listener => listener())
        },
        subscribe: (listener) => {
            listeners.add(listener)
            return () => listeners.delete(listener)
        }
    }
}

// [DOC: stable-hooks]
export const useStableActions = (handlers) => {
    const latest = useRef(handlers)
    useInsertionEffect(() => {latest.current = handlers})

    const [actions] = useState(() => Object.fromEntries(
        Object.keys(handlers).map(key => [key, (...args) => latest.current[key](...args)])
    ))
    return actions
}

// [DOC: stable-hooks]
const useStableByValue = (next, equal) => {
    const [stable, setStable] = useState(next)
    if (stable === next || equal(stable, next)) return stable
    setStable(next)
    return next
}

const shallowEqual = (a, b) => a === b || (!!a && !!b && Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => Object.is(a[key], b[key])))

// [DOC: stable-hooks]
export const deepEqual = (a, b, depth = 0) => {
    if (Object.is(a, b)) return true
    if (depth > 12 || typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
    if (Array.isArray(a) !== Array.isArray(b)) return false
    // react element
    if (a.$$typeof || b.$$typeof) return a.$$typeof === b.$$typeof && a.type === b.type && a.key === b.key && deepEqual(a.props, b.props, depth + 1)
    const keys = Object.keys(a)
    return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && deepEqual(a[key], b[key], depth + 1))
}

// objects one level deep
const NESTED = new Set(['style', 'texts', 'icons', 'attrs'])
const configEqual = (prev, next) => {
    const keys = Object.keys(next)
    return keys.length === Object.keys(prev).length && keys.every(key =>
        NESTED.has(key) ? shallowEqual(prev[key], next[key]) : Object.is(prev[key], next[key])
    )
}
export const useShallowStable = (next) => useStableByValue(next, configEqual)
export const useDeepStable = (next) => useStableByValue(next, deepEqual)
