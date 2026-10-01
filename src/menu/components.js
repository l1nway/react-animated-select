import {House, MousePointer2, Play, Sparkles, Group, Info, Eclipse, LineStyle, Atom, ListVideo, PersonStanding, Bug, FileStack, ShieldCogCorner, Cpu, PawPrint, BadgeQuestionMark} from 'lucide-react'
import {Spinner} from '../components/icons'

// menu data
export const MENU = [{
    text: 'Getting started',
    short: 'Start',
    icon: House,
    id: 'start',
    sub: [
        {id: 'usage', text: 'Usage', icon: MousePointer2},
        {id: 'question', text: 'Ask a question', icon: BadgeQuestionMark}
    ]
}, {
    text: 'Features',
    short: 'Features',
    icon: Sparkles,
    id: 'features',
    sub: [
        {id: 'a11y', text: 'Accessibility (A11y)', icon: PersonStanding},
        {id: 'safety', text: 'Safety', icon: ShieldCogCorner},
        {id: 'states', text: 'Component States', icon: Info},
        {id: 'multiple', text: 'Multiple Options', icon: FileStack},
        {id: 'grouping', text: 'Grouping Options', icon: Group},
        {id: 'loading', text: 'Infinite Loading', icon: Spinner}
    ]
}, {
    text: 'Customization',
    short: 'Customize',
    icon: Eclipse,
    id: 'custom',
    sub: [
        {id: 'styling', text: 'Styling & Variables', icon: LineStyle},
        {id: 'icons', text: 'Icons', icon: Atom},
        {id: 'animations', text: 'Animations', icon: ListVideo}
    ]
}, {
    text: 'Dev Hub',
    short: 'Dev Hub',
    icon: Cpu,
    id: 'dev',
    sub: [
        {id: 'debug', text: 'Debug', icon: Bug},
        {id: 'playground', text: 'Playground', icon: Play},
        {id: 'author', text: 'Author', icon: PawPrint}
    ]
}]

export const ITEMS = MENU.flatMap(group => [group, ...group.sub])

export const groupOf = id => MENU.find(group => group.id === id || group.sub.some(s => s.id === id))
