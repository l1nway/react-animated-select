// if user does not provide a unique identifier, a unique ID is generated based on value, filtering out unwanted characters
export const makeId = (str, fallback = 'invalid-option', seed = '') => {
    const safeSeed = seed ? seed.replace(/:/g, '') : ''
    
    if (typeof str !== 'string' || !str.trim()) {
        return safeSeed ? `${fallback}-${safeSeed}` : `${fallback}-${Math.random().toString(36).slice(2, 8)}`
    }

    const cleaned = str
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\p{L}\p{N}-]+/gu, '')
        .toLowerCase()

    if (!cleaned) {
        return safeSeed ? `${fallback}-${safeSeed}` : `${fallback}-${Math.random().toString(36).slice(2, 8)}`
    }

    return cleaned || `${fallback}-${Math.random().toString(36).slice(2, 8)}`
}