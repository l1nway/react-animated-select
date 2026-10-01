// shared by vite.config.js and runtime
export function tokenize({Prism, normalizeTokens, themes}, text, language = 'jsx') {
    const {plain, styles: theme} = themes.vsDark
    const dict = {plain: {color: plain.color}}
    for (const {types, style, languages} of theme) if (!languages || languages.includes(language)) for (const type of types) dict[type] = {...dict[type], ...style}

    const grammar = Prism.languages[language]
    const styles = [null], keys = ['null']
    const lines = normalizeTokens(grammar ? Prism.tokenize(text, grammar) : [text]).map(line => line.filter(token => !token.empty).map(({types, content}) => {
        const merged = types.length === 1 && types[0] === 'plain' ? null : Object.assign({}, ...types.map(type => dict[type]))
        const key = JSON.stringify(merged && Object.keys(merged).length ? merged : null)
        if (!keys.includes(key)) {
            keys.push(key)
            styles.push(JSON.parse(key))
        }
        return [content, keys.indexOf(key)]
    }))
    return {text, lines, styles}
}

export const plain = text => ({text, lines: text.split('\n').map(line => line ? [[line, 0]] : []), styles: [null]})

// build-time replaced
export const snippet = Object.assign(strings => plain(strings[0]), {bash: strings => plain(strings[0])})
