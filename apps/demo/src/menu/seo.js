// share preview data
export const NAME = 'react-animated-select'
export const SITE = 'https://l1nway.github.io/react-animated-select/'

export const DESCRIPTION = 'Lightweight, high-performance, and fully customizable Select component for React. Featuring smooth CSS animations, accessible keyboard navigation, and flexible option rendering.'

export const SEO = {
    start: DESCRIPTION,
    usage: 'Install react-animated-select and render your first Select: pass options as an array, or write Option and OptGroup children with any JSX inside.',
    question: 'Ask a question about using react-animated-select and get a quick answer on the topic, without digging through the documentation.',
    features: 'What react-animated-select does out of the box: ARIA combobox, native forms, safe data handling, states, groups, a portal panel and fast rendering.',
    a11y: 'An accessible React Select: the WAI-ARIA combobox pattern, full keyboard navigation and screen reader support, with a live demo.',
    forms: 'react-animated-select works inside native HTML forms: with name it submits its value in FormData, and required blocks the submit like a native select.',
    safety: 'A React Select that never crashes on bad data: duplicates, NaN, null, dates, class instances and circular objects all render as separate options.',
    states: 'Default, selected, disabled, loading, error and empty states of react-animated-select, all keeping one stable size.',
    grouping: 'Group options with OptGroup or nested data in react-animated-select: disabled, styled and collapsible groups.',
    layout: 'The react-animated-select panel opens in a portal: never clipped by overflow hidden, flips upward near the edge and works inside modals.',
    performance: 'Hundreds of options or many Selects on one page stay fast: react-animated-select re-renders only the rows that change.',
    plugins: 'Opt-in plugins of react-animated-select: chips for multiple selection and infinite loading today, search and virtualization planned. What you do not import is not bundled.',
    bundle: 'Bundle size of react-animated-select: the core and each plugin, min and gzip. A plugin you do not import is tree-shaken away.',
    multiple: 'Multiple selection in react-animated-select: animated chips, inline delete buttons and a touch delete mode.',
    loading: 'Infinite loading in react-animated-select: loadMore fetches the next page of options as the list is scrolled or navigated with the keyboard.',
    search: 'Search in react-animated-select: a planned plugin that filters large option lists as you type.',
    virtual: 'Virtualization in react-animated-select: a planned plugin that mounts only the rows in view, for lists of 10 000 options.',
    custom: 'Customize react-animated-select with plain CSS: cascade layers, rac- classes, state attributes, CSS variables, custom options, icons and animations.',
    styling: 'Style react-animated-select with plain CSS: styles in a cascade layer, short rac- classes, ARIA and data state attributes and --rac- variables.',
    content: 'Custom option rows in react-animated-select: any JSX inside Option, renderOption for array data and reusable defineOption components.',
    icons: 'Replace every icon of react-animated-select: arrow, clear, remove, check and checkbox accept a URL, an element or a component.',
    animations: 'Smooth CSS animations in react-animated-select with zero animation dependencies: panel, chips, title and option groups.',
    dev: 'Developer tools for react-animated-select: a debug log, server rendering notes and a live playground to try every prop.',
    debug: 'Control react-animated-select from outside or leave it alone: value and open work controlled and uncontrolled, with a live event log.',
    ssr: 'react-animated-select renders on the server in Next.js, Remix or renderToString and hydrates without a mismatch.',
    playground: 'Try react-animated-select live: edit the code and every prop in the playground and see the Select update instantly.',
    author: 'Who builds react-animated-select, and where to follow the project.'
}

export const pathOf = id => id === 'start' ? '' : `${id}/`

export const titleOf = item => item.id === 'start' ? `${NAME} — animated, accessible Select for React` : `${item.text} — ${NAME}`
