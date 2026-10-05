# react-animated-select — features

The reasons to pick this Select, and how each one is built. It is the source for the demo page: every entry says what the user gets, how it works (files in `src/` and `src/README.md` doc-keys), its limits, and how to show it.

Keep it true: an entry changes in the same edit as the code it describes.

## Server rendering (SSR)

- **What you get:** the Select renders to HTML in Next.js, Remix or `renderToString`, and hydrates without a mismatch. The server HTML already shows the right title, chips and enabled state, for array options and for `<Option/>` children alike.
- **How:** every `useSyncExternalStore` has a server snapshot equal to the store's initial state. The portal waits for a client flag (`useSyncExternalStore`, not a mount effect, so client-only apps pay nothing). JSX options are read from `children` during render, not registered in effects. DOM ids are deterministic (`useId`, option paths, escaped by `optionDomId`). `window` and `document` are touched only in effects and handlers.
- **Where:** `dropdown.jsx`, `select.jsx`, `utils.jsx`; doc-keys `server-render`, `jsx-options`, `store`, `dom-ids`.
- **Limits:** the options panel is never part of the server HTML, even with `open` starting `true`; it mounts right after hydration, without the open animation. Every output file (ES and CommonJS) starts with `'use client'`, so a Next.js App Router server component can import and render the Select (function props such as `onChange` still come from a client component). `defineOption` components must be declared in a client module.
- **Demo idea:** show the `renderToString` output of a Select with a value, next to the live one.

## Options panel in a portal

- **What you get:** the list is never clipped by `overflow: hidden` parents or hidden under other stacking contexts, whether in modals, tables or scroll containers. It flips upward when there is no room below, and the trigger arrow already points the right way before the list opens. Inside a modal or a focus trap, `container` puts the panel into the modal's own element, so a click in the list is not an "outside click"; a `transform` on that element (a centered dialog) is compensated, and the panel still sits at the trigger.
- **How:** a `position: absolute` portal into `document.body` (or `container`) in document coordinates, so page scrolling moves it together with the trigger on the compositor (no lag on phones). It is placed before its open height is measured; while open, a frame loop started by scroll, resize, `ResizeObserver`, `MutationObserver` and a layout-shift `IntersectionObserver` keeps it at the trigger when the layout around it changes. After placing, it checks where it really landed and corrects for a transformed containing block. While closed, two `IntersectionObserver`s flip the up/down direction exactly where it changes, with no layout reads and no React render: `data-placement` is written straight onto the trigger and the panel. Inside a scroll container the panel attaches to the visible edge of the trigger and fades in step with how much of it is visible (`--rac-visible`); a trigger clipped away completely hides its panel (`data-offscreen`, a fade over `duration`); the side is kept while the trigger is clipped. An open panel keeps its side while the list fits there; a real change of side plays as a close on the old side and an open on the new one, together one `duration`. The custom properties (`--*` keys) of the Select's `style` are copied onto the panel, so one place themes both. The panel carries the same `data-placement` as the trigger.
- **Where:** `dropdown.jsx`, `dropdownPosition.js`; doc-keys `options-panel`, `dropdown-position`, `dropdown-flip`.
- **Limits:** a scaled container (`scale`, `zoom`) is not compensated. Inside a nested scroll container the panel follows from the main thread, so fast touch scrolls there can still trail by a frame. Only vertical clipping is followed (a trigger clipped sideways keeps a full-width panel); clipping containers are found by `overflow-y` once per open. In an app shell (the page scrolls inside a full-height element) the panel fades when the trigger scrolls out of that element instead of scrolling away with it.
- **Demo:** the playground's `container: transformed` (Стили) portals into a fixed box with a `transform`; the panel still opens right under the trigger. Idea: a Select inside a small `overflow: hidden` box and one at the bottom edge of the viewport.

## Accessibility (ARIA combobox)

- **What you get:** screen readers see a real combobox with a listbox of options, not a pile of divs.
- **How:** the trigger is `role='combobox'` with `aria-expanded`, `aria-controls`, `aria-haspopup='listbox'`, `aria-disabled` and `aria-activedescendant` (the highlighted option while open). The list is `role='listbox'` (`aria-multiselectable` in multiple mode). Items are `role='option'` with `aria-selected` / `aria-disabled`; each group's options sit in a `role='group'` labelled by its header. Option and header DOM ids come from one collision-free helper, so `aria-activedescendant` always matches exactly one element. The root also reports `aria-busy` while loading and `aria-required` with `required`. The accessible name is your `aria-label` / `aria-labelledby` (any `aria-*` and `data-*` prop is forwarded to the combobox), otherwise the placeholder. The clear and chip delete controls are real `<button>`s with translatable labels (`texts.clear`, `texts.remove`); icons and the arrow are `aria-hidden`. A visually hidden `aria-live='polite'` region per Select (client only, so SSR markup stays the same) announces what a reader would not say on its own: a removed chip (button, Backspace, touch delete mode), a cleared value, "`n` selected" for a multiple pick while the list stays open, "`n` more options loaded" for a `loadMore` page, and the error text. A burst of changes reads as one message (250 ms debounce), only changes made while focus is in the Select are announced, and the texts are `texts.removed` / `cleared` / `selected` / `loaded` (templates or functions for plural forms). While `error` is on, the combobox is `aria-describedby` the error text (joined with your own `aria-describedby`). A Select used only to show and prune chips (`popup={false}`) is a `role='group'` instead, with no popup ARIA, no arrow and nothing to open, so a reader never hears a combobox that cannot open.
- **Keyboard:** focus (click or Tab) opens the list. Enter / Space select, ArrowUp / ArrowDown move (skipping disabled options and collapsed groups), PageUp / PageDown jump by ten, Home / End go to the ends, typing letters jumps to the next option that starts with them (typeahead, like a native select). Group headers are on the path: Enter / Space open and close a group, so options of a closed group are reachable. Escape leaves touch delete mode or closes the list (and stops there, so a surrounding modal stays open); Tab closes and moves on; Delete clears; Backspace removes the last chip (or clears a single value). The highlighted option scrolls into view. Your `onKeyDown` runs first, and `preventDefault()` in it makes the Select skip that key, so any key can be turned off or remapped. The clear and chip delete buttons are out of the Tab order; when a screen reader focuses one, it keeps its own Enter / Space, the list does not open, and focus returns to the combobox after the press (doc-key `nested-controls`).
- **Where:** `trigger.jsx`, `dropdown.jsx`, `optionList.jsx`, `useSelectBehavior.js`, `liveRegion.jsx`, `select.jsx` (`ATTR`); doc-keys `trigger`, `highlight`, `typeahead`, `select-behavior`, `dom-ids`, `option-list`, `live-region`, `popup`, `public-api`.
- **Limits:** a group header is announced as an option ("Engineering, collapsed"), so a screen reader also says "not selected" for it: the price of keeping it on the `aria-activedescendant` path. The state is in the name, because ARIA has no expandable child of a listbox; the name does not include the number of options in the group. A mouse click on a chip delete button does not move focus, so it is announced only when focus already was in the Select; a change from outside (async `value`, `form.reset()` from a button) is never announced. A `<label htmlFor>` cannot name the combobox (a `div` is not labelable); use `aria-labelledby`. A modal that listens for Escape in the capture phase (Radix) still sees it first.
- **Demo:** the playground's Форма и доступность section (`id`, `aria-label`); `data: groups` with `groupsClosed` operated by the keyboard only. The `#stress` tab, cards C5: live region (a visible log mirrors the announcements, one Select with Russian function texts for plural forms), and `popup={false}` + `onKeyDown` (a tag list with an ARIA readout; a Select whose Enter / Space are cancelled). The playground's Открытие section has `popup` and `onKeyDown` (block opening).

## Native form fields

- **What you get:** give the Select a `name` and it submits with its `<form>` (or the one named by `form='id'`) like a native select (one field per value in multiple mode, `FormData.getAll`); `required` blocks the submit of an empty Select with the browser's own bubble, pointing at the Select. `form.reset()` (a reset button, React 19 `<form action>`, `requestFormReset()`) brings it back to `defaultValue` or empty, through `onChange` in both modes, with or without `name`, like a native field; a cancelled reset changes nothing. Inside `<fieldset disabled>` it is disabled like the `disabled` prop (not sent, cannot open), except in the fieldset's first `<legend>`, as native fields. After a failed submit an empty `required` Select gets `data-invalid` and `aria-invalid` (red border in the theme) until a pick or a reset; `texts.required` sets its bubble text. The hidden fields are `autoComplete='off'`, so autofill never submits a value the Select does not show.
- **How:** invisible real inputs inside the trigger, one per value, that hand focus to the combobox (the list stays closed); objects are sent as JSON. `disabled` disables them.
- **Where:** `trigger.jsx` (`FormField`), `useSelectModel.js` (`reset`), `useSelect.js` (fieldset), `base.css` (`.rac-input`); doc-keys `form-field`, `fieldset-disabled`.
- **Limits:** the Select resets one task after the native fields, so `FormData` read synchronously after `form.reset()` still holds its old value. Inside `<fieldset disabled>` the SSR markup shows the Select enabled until hydration.
- **Demo:** the playground's `name` / `form` / `required` with the «Отправить форму» and «Отправить side-form» buttons; the log shows the `FormData`. The `#stress` tab, cards C4 (reset, React 19 action, `<fieldset disabled>`, `form='id'`).

## Zero-dependency animations

- **What you get:** smooth open/close, group collapse, chip enter/exit and title cross-fades with no animation library. Animations reverse mid-way without a jump and respect `prefers-reduced-motion`.
- **How:** one primitive, `Collapse`, on the Web Animations API (measure in a layout effect, animate the whole box on one axis, optional fade, `reverse()` when interrupted, clipping only while animating, no inline styles or classes left behind). `Presence` keeps leaving children mounted until their exit finishes, replacing `react-transition-group`. The trigger's height follows the number of chip rows, a rich title and a row height changed by the consumer's styles (`--rac-row`, a theme switch) through the same API; the root's own padding and border still change at once. `duration`, `easing` and `animateOpacity` are props; `duration` and `easing` drive every animation, the WAAPI ones through the config and the CSS transitions through `--rac-duration` / `--rac-ease`. Reduced motion shortens them too and stops the looping indicators.
- **Where:** `motion.jsx`, `useChipLayout.js`, `chipGeometry.js`, `chipMotion.js`, `utils.jsx` (`followHeight`); doc-keys `collapse`, `presence`, `value-height`.
- **Demo:** the playground's Анимация section (`duration`, `easing`, `animateOpacity`, `keepMounted`); toggle the list rapidly (it reverses in place).

## Fine-grained re-renders

- **What you get:** hundreds of options or many Selects on one page stay fast; hovering an option re-renders two rows, not the list.
- **How:** contexts are split by change rate (config, stable actions, state). Very frequent values (highlight, chip hover and swipe, panel direction) live in small external stores read through selectors. Rows and chips are `memo` with stable props. Inline consumer literals (`options={[...]}`, `style={{...}}`, JSX children) are stabilized by value, not by identity.
- **Where:** `state.js`, `select.jsx`, `useSelectModel.js`, `optionList.jsx`, `chip.jsx`; doc-keys `contexts`, `store`, `stable-hooks`, `public-api`.
- **Demo idea:** the performance demo with a large list and a render counter.

## Options as JSX or data

- **What you get:** pass `options` as primitives, objects, groups or a dictionary, or write `<Option/>` / `<OptGroup/>` children with any JSX inside, or both at once (`childrenFirst` decides the order). Groups can be disabled, styled and collapsed; all groups start open (or all closed with `groupsClosed`), however they were declared.
- **Custom rows, two ways:** `renderOption={(item, {selected, disabled}) => …}` draws rows for array data (like MUI `renderOption` or react-select `formatOptionLabel`). `defineOption(props => <Option …/>)` makes a reusable option component (`countries.map(c => <CountryOption c={c}/>)`) that still renders on the server.
- **How:** both sources are normalized into one flat list during render (`normalizeOptions`). JSX children are read as data (`collectOptions`), so their order is the tree order and they work on the server. Wrong children (HTML tags, text, ordinary wrappers) are ignored with one clear dev warning each, never a silent drop or console spam.
- **Where:** `model.js`, `select.jsx`, `useSelectModel.js`, `optionList.jsx`, `utils.jsx`; doc-keys `option-model`, `jsx-options`, `define-option`, `dev-warnings`, `option-list`.
- **Value shape:** `onChange` reports an array item as given (a primitive as itself, an object as the whole object, `{value: 'pro', label: 'Pro'}`), and an `<Option/>` (also through `defineOption`) as its `value`, or its text without one. A controlled `value` must have the shape of its source: a value taken from one source does not select the same option written in the other (it shows as a virtual entry, with no selected row). Groups with the same name merge across sources: `<Option group='X'>`, `<OptGroup name='X'>` and an array `{group: 'X', options}` share one header.
- **Limits:** an `<Option/>` inside an ordinary wrapper component is ignored (use `defineOption`). A `defineOption` render function cannot use hooks; put them in the option's content. `renderOption` affects list rows, and the title and chips only with `valueAsOption`. Per-option `className` / `style` exist only on `<Option/>` (per group only on `<OptGroup/>`); the same fields on array items and array groups are ignored. A dictionary's keys are ignored (its values are the options), and a dictionary with a key named `name`, `label`, `id`, `value`, `options` or `group` is read as one option or a group instead.
- **Demo idea:** the same list written as an array and as JSX, side by side.

## Any data, never broken

- **What you get:** whatever shape the options come in, each one stays its own option. Duplicates (`1, 1, 1`, `true, true`, equal strings, equal objects), `NaN`, `null` / `undefined` / `''` placeholders, functions, circular objects, dictionaries, `Date`s and class instances, `<Option value={0}/>`, two `<Option/>` with the same `id`: the click selects exactly the row you clicked, unchecking removes exactly that row and its chip, and nothing throws. A value whose options vanish (or arrive later) stays on screen, and its chips stay in place without replaying their animation.
- **How:** every normalized option gets a unique internal id (positional for arrays, suffixed for repeated JSX ids). Besides the `value`, the Select remembers the ids the user picked and uses them to choose between equal candidates when it maps `value` back onto the options. Matching is by identity (with `NaN` equal to itself), then by JSON for objects, with a stringify that never throws. A value without an option becomes a virtual entry; chips are keyed apart from ids, so a chip whose id changes with the catalog keeps its key.
- **Where:** `model.js` (`normalizeOptions`, `resolveSelection`), `useSelectModel.js`, `useSelect.js`, `useChipLayout.js` (`useChipKeys`); doc-keys `option-model`, `selection-identity`, `jsx-options`, `chip-keys`.
- **Limits:** `value` and the `onChange` ids cannot tell equal duplicates apart; a value set from outside that differs from the last commit takes the first free duplicates in list order. Give duplicates distinct `id`s when the consumer needs to know which one was picked. After the list itself changes (an item inserted or removed before them) with an unchanged value, equal primitives (`1`, strings, `true`, `NaN`, repeated JSX ids) are matched by position, so the selection can move to another of the equal rows; consumers who add or remove items give duplicates distinct `id`s.
- **Demo:** `data: stress` in the playground (`apps/sandbox/src/App.jsx`): `1, 1, 1`, `true ×3`, equal strings, `NaN, NaN`, equal objects, two `<Option id='дубль id'>` and two `<Option>` with the same text. Toggle `noOptions`: the chips stay put.

## Selected options in the value area

- **What you get:** a rich option (icon + text, a card) stays light where space is tight. By default the trigger shows only the option's text, in the title and in the chips, so a heavy row never breaks the trigger height or the chip rows. One prop, `valueAsOption`, renders the option's own content in the trigger instead, so a chip looks like its row.
- **Text mode (default):** the text comes from the model's label chain (`label` / `name` / `id` / `value`) and, for a JSX option without any of them, from the strings and numbers inside its JSX (a walk over the element tree). An option with no text at all (an image only) has no honest text form: give it a `label`, otherwise it shows the `texts.emptyOption` text and warns once in development.
- **Rich mode (`valueAsOption`):** the chip and the single-value title render the same content as the row: the `<Option/>` JSX, or `renderOption(item, {selected: true, disabled})` for array data. The per-option `className` and `style` of the `<Option/>` move onto the chip (and the title), and the content sits in the same `rac-option-jsx` wrapper, so one rule styles both. The checkbox, the loading dots and the row states (hover, highlight, selected tint) are not carried over; the chip keeps its own `.rac-chip` look and its delete button. Turning the mode on or off animates every chip from its old size to its new one (width and height).
- **Styling:** chips are plain `.rac-chip` elements, so they are restyled with CSS in both modes. Shared rules are written once: `.rac-option-jsx, .rac-chip {…}`.
- **Limits:** the chip cannot show different JSX from the row; it is the same content or the text. Interactive elements inside rich content (buttons, links) fight the chip's own clicks, swipe and long press: keep the content decorative. Rich content is rendered once per chip and once in the list, so very heavy blocks cost more in a large multiple selection. State texts (error, loading, disabled, `selectedText`) are never turned into option content.
- **Where:** `utils.jsx` (`optionContent`), `select.jsx` (`getText`, `DEFAULT_PROPS`), `model.js`, `useSelectModel.js` (`valueOption`), `trigger.jsx`, `chip.jsx`, `optionList.jsx`; doc-keys `option-content`, `option-model`, `chip`, `option-list`.
- **Demo:** `data: rich` in the playground (`apps/sandbox/src/App.jsx`): rich options (icon + text with `className` / `style`, an image with a `label`, a heavy block, an array option for `renderOption`) with the `valueAsOption` and `renderOption` toggles.

## Controlled or uncontrolled

- **What you get:** `value` / `defaultValue` and `open` work like native inputs: pass them to control the Select from outside, or leave them out. `onOpenChange(next)` reports every open and close in both modes (never on mount); `open` without `onOpenChange` hands the open state entirely to the consumer. An outside `value` without a matching option is still shown. Clearing reports `null` in single mode and `[]` in multiple mode; picking the already selected option of a single Select just closes the list, with no `onChange`, like a native select. `onFocus` / `onBlur` report focus entering and leaving the Select as a whole (list included).
- **How:** controlled values are derived on every render; internal state is used only in uncontrolled mode. `commit` is the single exit for a new value, `setVisibility` the single exit for the open state (it skips no-op requests).
- **Limits:** like a React input, pick one mode per Select: `undefined` means uncontrolled, so a controlled `value` set back to `undefined` shows the last internally stored value (or `defaultValue`), not empty. Clear a controlled Select with `null` (single) or `[]` (multiple). Switching `value` or `open` between defined and `undefined` after mount warns once in development.
- **Where:** `useSelect.js`, `useSelectModel.js`; doc-keys `select-store`, `option-model`, `dev-warnings`.
- **Demo:** the playground's `valueMode` and `openMode` (`controlled`, `manual`) with the `open = …`, `value = undefined` and `value извне` buttons; the log shows every `onChange` / `onOpenChange`.

## Multiple selection with chips

- **Needs the `chips` plugin** (`plugins={[chips]}`, since 0.8). Without it, a multiple Select shows the picked labels as comma-separated text (`.rac-pick`, one element per label) that wraps onto new rows, each label truncated with an ellipsis only when it alone is wider than the row; labels fade in, and leave by fading and closing their width so the next ones slide back, the placeholder and the labels swap out then in, and the trigger animates its height when rows change. A removed label keeps its place until it has faded, then the rest move at once (no width animation, no row hold: those are the plugin's). Its bundle has no chip code or chip CSS (see Tree-shakable plugins). Doc-key `picks`.
- **What you get:** selected values become chips that animate in and out while the rows stay still, with a delete button over the chip or inside it (`deleteInline`), shown on hover or always (`deleteAlways`). With `deleteInline` on hover, the hovered chip's delete button slides open inside it and only its row neighbours make room; however fast or chaotically the pointer moves, no chip changes rows, and there is no hover delay.
- **How:** chips are `Presence` children that animate their width. While any chip animates, the rows are held: an invisible clone of the chip area, where every chip has its full width, tells where each row ends, and a zero-height line break after each row end keeps every chip on its row until all animations finish. Then the rows reflow in one step, and every chip that moved slides there (FLIP). Replacing chips (a new `value` that drops some and adds others) runs out, then in: the old chips collapse first, then the new ones grow, each phase in half the `duration`, so the swap takes one `duration`; the trigger changes its height once, straight to the new one, over a full `duration` that starts when the old chips are gone. Moves that happen at once (a chip inserted in the middle, a re-added chip, a reordered `value`) slide the same way. The trigger animates its height when rows are added or removed. Toggling `valueAsOption` (or `renderOption` while it is on) animates every chip's width and height from the text to the rich content and back, with the rows held and one height animation of the trigger; a mere text change never animates. Changing `deleteAlways` / `deleteInline` and entering or leaving touch delete mode animate every chip's width the same way, with the rows held; the inline ↔ overlay switch slides the button between the end of the chip and the space inside it. For inline buttons on hover, every row is laid out as if the area were one delete button narrower, plus a quarter pixel for Firefox's sub-pixel rounding (the same breaks, kept at rest). The delete buttons run on one shared clock, so the open width in a row never exceeds one button, even mid-handover.
- **Where:** `chip.jsx` (`ChipsValue`), `useChipLayout.js`, `chipGeometry.js`, `chipMotion.js`, `chip.css`, `trigger.jsx` (`Title`), `motion.jsx`; doc-keys `plugins`, `value`, `value-height`, `chip`, `chip-layout`, `chip-hold`, `chip-resize`, `chip-geometry`, `delete-reserve`, `delete-mode`, `collapse-group`, `presence`.
- **Limits:** a chip re-added while it is still leaving moves to its new place (the end) and grows back there. In a commit that removes and adds chips, the new chips appear half a `duration` later (after the old ones are gone), and both phases run at half speed; a chip added while that runs waits too. With reduced motion or `duration: 0` the swap is instant, in one step. A look change (`valueAsOption`) that needs fewer rows keeps the old rows until the chips reach their new size, so the trigger grows, then shrinks when the rows merge; a chip that is entering or leaving at that moment, and a padding or border change from the option's `className` / `style`, change size at once. A `row-gap` on `.rac-value` adds one gap per break (during animations, and always with inline buttons on hover). A change to a narrower delete mode (or leaving touch delete mode) merges rows at the end, in a second height step; a hover that starts during that change can offset its button until the end. With inline buttons on hover, a row filled to within 0.25 px moves its last chip to the next row. A consumer border on `.rac-chip-del` may overflow that slack in Firefox, which snaps thin borders to device pixels.
- **Demo:** `data: stress` in the playground (nine chips over several rows) with `deleteInline` on to sweep the pointer over the chips; remove from the middle and re-add through the list. The stress page (`#stress`) card «Полная замена значения» swaps the whole value (15 ↔ 17 chips); «Размер чипа при смене valueAsOption» toggles the chip look; the C7 card «Переключение deleteAlways / deleteInline и режим удаления» toggles the delete modes. The scripted `ChipStress` bursts are no longer in `apps/sandbox/src/App.jsx`.

## Touch delete mode

- **Needs the `chips` plugin.**
- **What you get:** on touch devices, a long press on a chip enters delete mode (chips shake, a tap removes one, the device vibrates where the browser supports it: Android, not iOS Safari); a swipe left reveals one chip's delete icon. The page still scrolls vertically when the finger lands on a chip, and a slightly trembling finger still gets its long press.
- **Touch targets:** on coarse pointers the clear and chip delete buttons get an invisible hit area of at least 24×24 px (WCAG 2.2 SC 2.5.8) without changing the layout; doc-key `touch-target`.
- **Where:** `chip.jsx`, `useChipLayout.js`, `chip.css`, `base.css`; doc-keys `touch-delete`, `touch-target`, `delete-mode`.
- **Limits:** the area is 24 px, not the 44 pt / 48 dp of platform guides (larger areas would overlap the arrow and neighbouring chip rows); a consumer can widen it through `inset`.
- **Demo idea:** device emulation in DevTools.

## Async loading

- **Needs the `paging` plugin** (`plugins={[paging]}`, since 0.8). A consumer who never pages (or, later, uses the virtual list instead) does not bundle it.
- **What you get:** infinite lists: `loadMore` fires when the end of the list comes within `loadOffset` px of view (by scrolling, or at once when a page does not fill the list: a short list loads page after page by itself) or the keyboard highlight comes within `loadAhead` options of it, or on a "Load more" button (`loadButton`). Clicking the button (or Enter / Space on it) keeps the place: the row stays highlighted and the scroll position holds while the page loads, then the first new option is highlighted where the row was; a failed load leaves the highlight on the row for a retry. Bursts of scroll events trigger one load. When `loadMore` returns a Promise, a failed request unlocks the next attempt.
- **Where:** `paging.jsx` (`request`, `row`, `PagingFooter`), the seams in `useSelect.js`, `useSelectModel.js`, `model.js`, `dropdown.jsx` (`StatusRow`); doc-keys `paging`, `plugins`, `select-store`.
- **Core residue (honest):** the `loadPending` state, the lock and its release effects, the "Load more" branch of `selectOption`, the no-wrap rule of the arrows and the live region's "loaded" text stay in the core: small, generic, and not worth more seams.
- **How the scroll is watched:** an `IntersectionObserver` on the last row (no layout reads on scroll), re-armed after each page that added options, never after a failed one, so a failing `loadMore` is not called in a loop; scrolling near the end retries.
- **Limits:** without a Promise, the lock opens only when the option count, `hasMore` or `loadButton` changes, so a failed load blocks further loads. A `loadMore` that throws synchronously unlocks at once; the error is reported to the console, not thrown into the tree.
- **Demo:** `data: async` in the playground: a fake paginated API with `delay` and `failLoads`.

## States and layout stability

- **What you get:** placeholder, value, chips, loading, empty, disabled and error states, each with its own text (`placeholder`, `texts.empty`, `texts.loading`, …) and its own attribute on the root to style (`data-empty`, `aria-busy`, `data-error`, `aria-disabled`). Switching between them cross-fades the title.
- **A status never hides data:** `disabled` works like a native `<select disabled>` (the value stays visible, nothing opens or deletes). `loading` and `error` only report: with options the Select keeps working (open, select, clear, delete chips); only an empty list blocks it, as any empty list does. One `error` covers a failed first load and a failed load-more: a red border and an error row at the end of the list. Loading (the `loading` prop or a pending `loadMore`) draws a thin moving stripe at the bottom of the trigger, one CSS rule to restyle or drop.
- **Where:** `useSelectModel.js` (`active`, title), `trigger.jsx`, `dropdown.jsx` (status row), `base.css` (cursors), `theme.css` (stripe); doc-keys `state-semantics`, `value`, `state-attributes`.
- **Limits:** the title is keyed by its text, so any text change (typing a `placeholder`, `selectedText`, switching `texts`) replays the title animation; keying by the state is planned with the animation rework. The error is announced through the title (when there is no value), the error row and the live region (only while focus is in the Select); while `error` is on, the combobox is `aria-describedby` the error text, which is rendered on the client only (like the live region), so before hydration that reference has no target.
- **Demo:** the playground's Состояния section (`disabled`, `loading`, `error`, `noOptions`), combined with `data: async` and `failLoads`.

## Grows with its content, truncates at the limit

- **What you get:** the Select never breaks its container. Put it where the layout sizes it by content (a flex toolbar, an `auto` grid column, `width: fit-content`): it grows smoothly with the chosen title and with every added chip, and shrinks back, with the chip rows computed for the width it grows to, so chips never jump to a new row and back. Once there is no room left, a long title and any chip wider than the row are cut with an ellipsis, and the trigger keeps its height. With a fixed width it simply truncates.
- **How:** the root is `max-width: 100%` and `min-width: 0`; the title and the chip label use `text-overflow: ellipsis`. Animations lift the chip's width limit while they run, so the ellipsis never slides along with an enter or exit. The invisible clone that computes the chip rows is laid out in place of the real value area for one synchronous measurement, so it gets the width the Select will have, including the room for inline delete buttons. Two truncated titles cross-fading in one row run on one clock and cannot overflow it.
- **Where:** `base.css`, `chip.css`, `chipGeometry.js` (`ghostRows`), `trigger.jsx`, `chip.jsx`, `motion.jsx` (`LIMITS`); doc-keys `trigger-width`, `chip-hold`, `delete-reserve`, `collapse`.
- **Limits:** a wrapper that shrinks to fit without being a flex or grid parent (`inline-block`, a float, `fit-content` on the wrapper) overflows by its widest text unless it has `max-width: 100%`. Rich content (`valueAsOption`) is clipped, not ellipsized. The ellipsis appears when an animation ends, not during it. With inline delete buttons in a content-sized Select, hovering a chip widens the Select by one button.
- **Demo:** the playground's `frame` control (Стили): `fit` (a flex item that grows) and `narrow` (220px); `data: simple` has one very long option, in single and multiple mode, with and without `deleteInline`.

## Deep customization

- **What you get:** plain CSS always wins: the library styles sit in `@layer rac`, so `.rac-chip {border-radius: 1em}` works without `!important` or specificity games. Inside it, `rac.base` holds only what the Select needs to work and `rac.theme` a small neutral look, so the default look is easy to replace. A flat tree (the trigger is the root, one value area, the title, the clear button, the arrow) with short `rac-` classes, states as ARIA / `data-*` attributes instead of modifier classes, and a handful of `--rac-*` variables: set `--rac-fg` / `--rac-bg` and every hover, highlight, selection and chip tint follows; set `--rac-radius` and the trigger, the panel (with the list and its edge rows) and the chips (at half, their delete overlay included) round together. `className`, `optionsClassName` and `style` reach the trigger and the panel. Icons (`icons.arrow`, `clear`, `remove`, `check`, `checkbox`) accept a URL, an element or a component and need no class. Every text is in `texts` (see Props). The full reference is `STYLES.md`.
- **Where:** `base.css`, `theme.css`, `trigger.jsx`, `utils.jsx` (`renderIcon`, `flag`), `select.jsx` (`DEFAULT_PROPS`); doc-keys `styles-layer`, `state-attributes`, `corner-radius`.
- **Limits:** a consumer who uses cascade layers must declare `rac` first (`@layer rac, app;`). The panel border has no variable (one rule: `.rac-options {border: …}`, recipe in `STYLES.md`).
- **Demo:** the playground's Стили section (`className`, `optionsClassName`, `tokens` sets `--rac-fg` / `--rac-bg` / `--rac-radius` through `style`, `dark` switches the page color scheme), plus `icons` and `texts`. A full theme switcher is still an idea.

## Tree-shakable plugins

- **What you get:** pay only for what you use. Chips and async loading are plugins, imported from the package root and passed as values: `import {Select, chips, paging} from 'react-animated-select'`, `<Select multiple plugins={[chips]}/>`. A plugin you never import is not in your bundle, JS and CSS. A Select without plugins also runs less: no chip layout, no load checks. The plugin list may change at runtime, and in multiple mode turning `chips` off or on morphs the chips into the comma-separated labels and back (size, paddings, background, comma, rows and height animate together; the swap at the end is pixel-identical), so a settings toggle never makes the layout jump.
- **Measured** (2026-10-04, rolldown-vite consumer build of the source, React external, min / gzip): core `{Select}` 37.5 / 14.4 KB JS, 5.8 / 1.7 KB CSS; `+ chips` 47.0 / 17.6 KB JS, 7.8 / 2.1 KB CSS; `+ paging` 38.4 / 14.7 KB JS; all 48.1 / 18.1 KB JS. Before 0.8 every consumer got the whole library. Runtime, 220 Selects (100 single, 100 multiple with chips, 20 paged): 100 `ResizeObserver`s instead of 220, the mount render 233 ms instead of 260 ms (React dev build), the same commit counts on every interaction.
- **How:** a plugin is a plain object exported by its module and re-exported by `index.js` (pure, so bundlers drop it unused). The core reaches it only through component slots (`<ext.Value/>`, `<ext.Footer/>`) and pure functions (`ext.request`, `ext.row`), never a hook across the seam, so the plugin list may change at runtime. The core never imports a plugin file (ESLint guard). Module-level `memo` / `createContext` carry `/* @__PURE__ */`. A plugin's CSS is its own file imported by the plugin (`chip.css`); the core CSS is imported by `select.jsx`. An inline `plugins={[chips]}` is compared by value, so it costs no re-render.
- **Where:** `index.js`, `useSelect.js` (`usePlugins`), `trigger.jsx` (`Value`, `Title`), `dropdown.jsx` (`StatusRow`, the `Footer` slot), `chip.jsx`, `paging.jsx`, `eslint.config.js`; the runtime switch: `useChipLayout.js`, `chipMotion.js`; doc-keys `plugins`, `paging`, `value`, `styles-layer`, `plugin-morph`.
- **Limits:** esbuild keeps every CSS file reachable from JS (by design since 0.17.7), so an esbuild consumer without `chips` still gets `chip.css` (2 KB); Rollup, rolldown (Vite) and webpack drop it. The `paging` plugin moves about 1 KB; its small generic part (the pending flag, the lock, the "Load more" branch) stays in the core. Dev warning strings still ship in production builds (a later step). The plugin objects' fields are internal: only `plugins`, `chips` and `paging` are public. The `chips` switch: turning it off waits for the chips to shrink and their rows to merge (about 2 × `duration`) before the real labels take over; a consumer border on `.rac-chip` disappears at once.
- **Demo:** the playground's Плагины section (`plugins.chips`, `plugins.paging`; toggle `plugins.chips` with `multiple` and a few rows of value); the `#stress` card C8 (one value, with and without `chips`, plus a Select whose plugin is switched by a checkbox).

## Planned

Not implemented yet: the next library edits, recorded on 2026-10-01 so a later session can start from them. Since 2026-10-03 each of them is written as a plugin from its first line (see Tree-shakable plugins): the virtual list most likely through a list slot, search through a pure filter seam plus an input slot, sortable chips as an extension of `chips`. Suggested order: virtualization, search, the animation rework, chip reordering (each later step uses the earlier ones); the user may reorder. Each item is still analysed and shown to the user before code.

### Animation rework: a `motion` prop by role

- **Goal:** beautiful defaults, and deep customization without a pile of `animation='…'` props. The consumer tunes each animated role with a preset or a spec object; `duration` / `easing` stay the global defaults.
- **Accepted API sketch:** `motion={{panel: motion.drop, chip: {...motion.pop, duration: 180}, title: motion.ticker, move: {easing: 'cubic-bezier(.3, 1.4, .5, 1)'}, groupItems: ({index}) => ({...motion.fade, delay: index * 15}), clear: false}}`. Roles: `panel`, `groupItems`, `title`, `chip`, `chipDelete`, `clear`, `arrow`, `move` (FLIP), `height` (trigger height), `check`. A role is a preset, a spec (keyframes, duration, easing, delay), a function of `{placement, index, count, direction}`, or `false`. Presets are exported plain data. A `SelectDefaults` context sets them for every Select below it.
- **Two layers:** the library owns the layout layer (the real size of the box, monotonic easing, the invariants of the rows, the hold and the reserve); the consumer owns the visual layer (opacity, transform, blur, clip-path, overshoot allowed). A dev warning fires when an overshooting easing lands on the layout layer.
- **Decided:** the size animation stays a real `width` / `height` animation of the whole box. Replacing it with a negative margin, `clip-path` or `transform` was rejected: cheaper for the browser, but it looks cheap. Transforms stay for FLIP moves and the visual layer.
- **Also in this step:** the title keyed by its state, not its text (see States, Limits), with a width morph from the old title to the new one (removes the title clock and the 0.25 px slack); every trigger reviewed (animate on a change of option or state, never on a mere text change); reduced motion per role; stagger.

### Virtualized option list

- **Problem:** every option is mounted. At 500–1000 rows, opening the panel and every selection get slow (mount, one highlight subscription per row, rebuilding the whole node list), worse on phones and with rich JSX options. `loadMore` limits what is fetched, not what is mounted. Step 0 measures 1k / 5k / 10k rows in the playground before any code.
- **Plan (no dependency):** render only the rows in view plus an overscan, between two spacers, so the rows stay in normal flow and consumer CSS keeps working. Heights are variable (JSX, wrapped text, group headers): estimate, measure the mounted rows with a `ResizeObserver`, cache heights by option id, keep prefix sums, and correct `scrollTop` instantly when a row above the view changes size (scroll anchoring). A plugin (working name `virtual`: `plugins={[virtual]}`), turned on always or above a row count; below it, the list behaves as today. How the threshold is set is still open.
- **What changes:** the highlight is already an index, so keyboard moves become "scroll to index, then the row mounts". The highlighted row stays mounted even off-screen, so `aria-activedescendant` always points to a real element; rows get `aria-setsize` / `aria-posinset`. Opening scrolls to the selected option before paint. A group collapse animates only the part of the group that is in view. `loadMore` keeps working on the scroll distance. Opening the panel gets cheaper, since it measures a few rows.
- **Smooth scroll:** programmatic jumps (keyboard paging, scroll to the selected option, a search reset) scroll smoothly; anchoring corrections stay instant, because their job is to be invisible. Smooth scrolling hides jumps, not measurement errors: the jitter is fixed by measuring and anchoring.

### Search, on top of the virtual list

- **Plan:** a plugin (working name `search`: `plugins={[search]}`) puts an input in the value area (after the chips, or in place of the title), following the WAI-ARIA editable combobox pattern. Local filtering runs over the text the model already has (the label chain, including the text inside JSX options), case- and accent-insensitive, with keys precomputed once per option set, so a keystroke over 10k options stays around a millisecond. Groups with matches are forced open while searching; a `texts` entry names the "no matches" row. A custom `filter(option, query)`, or no local filter for server search, plus a controlled query (`searchValue` / `onSearchChange`), combines with `loadMore` and `loading` for server-side paging.
- **Motion:** the panel height follows the result count smoothly, the way the trigger follows chip rows. Only a few rows are mounted, so the rows that stay can FLIP to their new place and new ones fade in, interruptible on every keystroke.
- **Open questions:** input in the trigger or at the top of the panel; whether the query clears after a pick in multiple mode; Space types instead of selecting (Enter selects); the input as the last item of the chip rows (the ghost measurement and the hold must count it); the phone keyboard shrinks `visualViewport`, not `innerHeight`, so panel positioning must follow it. Typeahead (jump to an option by typing, like a native select) can ship without the input.

### Reordering chips (drag), with haptics

- **Goal:** in multiple mode, the user drags chips to change the order of `value` instead of reopening the list to pick in the right order. The list itself is never reordered.
- **What exists:** the chip order is the order of `value`, and a reordered `value` already slides every chip to its new place (FLIP). A reorder is a plain `onChange` with the same items in a new order.
- **Plug in an outside library, or build it in:** an outside library needs an extension point on every chip (a ref, listeners, a transform), which turns the chip's DOM into a public contract. SortableJS moves DOM nodes behind React's back and breaks `Presence`. Framer Motion's `Reorder` handles one axis only, not wrapped rows. dnd-kit fits (transforms, touch, keyboard, announcements), but its touch sensor would fight the long press (delete mode) and the swipe, which it knows nothing about. The hard parts (FLIP, rows, gesture arbitration with touch delete mode) stay ours either way. Built in, it is about 150 lines (a `useChipDrag.js` file on top of the chip store and `flip`) in an add-on plugin that works only together with `chips` (working name `sortable`: `plugins={[chips, sortable]}`), so it stays out of the bundle when unused. The final plugin names and what `sortable` does without `chips` are still to be decided. The extension point for outside libraries can come later.
- **Gestures:** mouse: drag past a few pixels. Touch: the long press already enters delete mode, where the chips shake; that mode also becomes the rearrange mode (the iOS home-screen model: drag to move, tap × to delete). While dragging, the chip follows the pointer, the target is the nearest slot across rows, the others move out of the way by FLIP, and the drop commits one `onChange`. A drag never opens the panel or triggers a click.
- **Keyboard parity (required):** chips are not focusable today. Reordering needs chip focus first (arrows move between chips, a modifier plus arrows moves the chip), with a polite live announcement from `texts`.
- **Haptics:** no prop; vibration is a built-in default through `navigator.vibrate` where it exists. Today one 50 ms pulse fires when a long press enters delete mode (`chip.jsx`); the swipe and the delete itself do not vibrate. With `sortable`, a short pulse is added on pick-up, on each slot crossed and on drop. Only Android browsers have `navigator.vibrate`; iOS Safari has no web vibration, so iOS users feel nothing. Routing to a host API (Capacitor, Telegram) waits for a real request.

## Props

The whole public API of `<Select/>`. `DEFAULT_PROPS` in `select.jsx` is the single declaration; this table follows it. A prop left `undefined` takes its default. Every prop can be changed live in the playground of the local sandbox, `apps/sandbox/src/App.jsx` (`apps/sandbox/src/playground.js` holds its schema; a new prop gets a control there).

### Data and value

| Prop | Type | Default | What it does |
|---|---|---|---|
| `options` | array or object | `[]` | Primitives, objects, groups (`{group, options}` or `{name, options}`), items with a `group` field, or a dictionary. Merged with the `<Option/>` / `<OptGroup/>` children. A dictionary is a plain object whose values are the options; its keys are ignored. An object with a key `name`, `label`, `id` or `value` is one option, one with `options` (or `group` without those keys) a group. Array items take no `className` / `style` (use `<Option/>`). |
| `children` | `<Option/>`, `<OptGroup/>`, `defineOption` components | — | JSX options, read as data. |
| `value` | any | — | Controlled value (an array in multiple mode): the consumer holds it and passes it back from `onChange`. Derived on every render. Without `onChange` the Select is read-only (a dev warning, like a React `<input value>`). `undefined` means "not controlled"; clearing commits `null` (single) or `[]` (multiple). Keep one mode: clear a controlled Select with `null` / `[]`, never `undefined` (a switch warns in development). |
| `defaultValue` | any | — | Initial value for uncontrolled mode: the Select holds the value itself, `onChange` only reports it. Read once on mount. |
| `onChange` | `(value, ids) => void` | — | Every commit: select, uncheck, chip delete, clear. `ids` are the options' `id`s (or values). `value` is an array item as given (an object stays the whole object) or an `<Option/>`'s `value`. Not called when a single Select's selected option is picked again. |
| `multiple` | boolean | `false` | Multiple choice with checkboxes. The value area shows chips with the `chips` plugin, otherwise the picked labels as wrapping comma-separated text. |
| `plugins` | array | `[]` | Since 0.8: the optional features, imported from the package root and passed as values: `plugins={[chips]}`. A plugin you never import is never bundled. An inline array is fine (compared by value). See Tree-shakable plugins. |
| `childrenFirst` | boolean | `false` | JSX options before the array options. |
| `groupsClosed` | boolean | `false` | Every group starts collapsed. Read on every render. |

### States

| Prop | Type | Default | What it does |
|---|---|---|---|
| `disabled` | boolean | `false` | Not interactive, like a native disabled select: closes the panel, hides the clear button and the arrow, locks the chips. The value stays visible; without a value the title is `texts.disabled`. `aria-disabled`. |
| `loading` | boolean | `false` | Reports only: the busy stripe (`aria-busy`), the loading footer in the open list, and without a value the title `texts.loading` with dots. The Select stays usable while it has options. |
| `error` | boolean | `false` | Reports only: `data-error` (red border), the error row `texts.error` at the end of the list, and without a value the title `texts.error`. The Select stays usable while it has options. |

An empty option list makes the Select inactive (closed, no clear button or arrow), whatever the status.

### Open state

| Prop | Type | Default | What it does |
|---|---|---|---|
| `open` | boolean | — | Controlled open state. Without `onOpenChange` only the consumer opens and closes the Select. An outside toggle button takes the focus, so the Select asks to close on blur before the button's click: give the button `onMouseDown={e => e.preventDefault()}`. |
| `onOpenChange` | `(open) => void` | — | Called on every open and every close the Select makes or asks for (click, focus, keys, selection in single mode, blur, becoming inactive), in both modes. Never on mount, never for a no-op. An inactive Select (disabled, no options) is never shown open, whatever `open` says. |
| `onFocus` | `(event) => void` | — | Focus entered the Select from outside. |
| `onBlur` | `(event) => void` | — | Focus left the Select and its list. |
| `onKeyDown` | `(event) => void` | — | Called before the Select handles a key; `event.preventDefault()` makes the Select skip that key (keep Tab untouched: it would cancel the focus move). Only while the Select is active. |
| `popup` | boolean | `true` | `false`: no panel, a tag list. The root is `role='group'` without the combobox ARIA, never opens (no `onOpenChange`, `open` ignored), no arrow, default cursor, no hover tint; chip deletion and clear keep working. Still needs `options`. |

### Form and accessibility

| Prop | Type | Default | What it does |
|---|---|---|---|
| `id` | string | — | `id` of the combobox element (for `aria-labelledby` elsewhere, tests, anchors). |
| `aria-*`, `data-*` | string | — | Forwarded to the combobox. `aria-label` / `aria-labelledby` replace the placeholder as its accessible name; `aria-describedby` is joined with the error text id while `error` is on; `aria-invalid` is kept when the Select has no invalid flag of its own. The Select's own state attributes cannot be overridden. |
| `name` | string | — | Form field name: hidden inputs submit the value with the `<form>` (one per value in multiple mode; objects as JSON). |
| `form` | string | — | Id of the owner `<form>`, like `<select form='id'>`: the Select submits and resets with that form even when placed outside it (or inside another one). |
| `required` | boolean | `false` | An empty Select blocks the form submit (native validation bubble) and gets `aria-required`. |

### Async loading

Every prop of this group needs the `paging` plugin (`plugins={[paging]}`, since 0.8); without it they do nothing and warn once in development.

| Prop | Type | Default | What it does |
|---|---|---|---|
| `hasMore` | boolean | `false` | More pages exist. Shows the loading footer (scroll mode) or the "Load more" row (`loadButton`). |
| `loadMore` | `() => void \| Promise` | — | Loads the next page. A returned Promise unlocks the next load when it settles, success or failure. `hasMore` without it warns once. |
| `loadButton` | boolean | `false` | A "Load more" row instead of loading on scroll. |
| `loadOffset` | number (px) | `100` | How close (px) the end of the list must come to view to load the next page; a short list loads until it fills. Negative values load later; a numeric string works, anything non-finite counts as `0`. |
| `loadAhead` | number | `3` | Keyboard highlight distance (in options) from the end that triggers a load. |

### Content and texts

| Prop | Type | Default | What it does |
|---|---|---|---|
| `placeholder` | string | `'Choose option'` | Title without a value; also the combobox `aria-label` unless `aria-label` or `aria-labelledby` is passed. |
| `selectedText` | string | — | With any value, replaces the title and the chips by this text. |
| `texts` | object | see below | Every other string of the Select. |
| `renderOption` | `(item, {selected, disabled}) => ReactNode` | — | Custom rows for array data. Keep it stable (`useCallback`) for large lists. |
| `valueAsOption` | boolean | `false` | The title and the chips render the option's content instead of its text. |

`texts` keys and defaults: `empty` `'No options'` (title without options), `disabled` `'Disabled'`, `loading` `'Loading'`, `error` `'Failed to load'`, `clear` `'Clear selection'` (clear button label), `remove` `'Remove'` (chip delete label prefix), `loadMore` `'Load more'` (the button row), `loadingMore` `'Loading'` (the button row while loading, and the scroll footer), `emptyOption` `'Empty option'` (`null`, `''`, an option without text), `invalidOption` `'Invalid option'` (a function in `options`), `disabledOption` `'Disabled option'` (a disabled object without a label), `emptyGroup` `'Empty group'` (a group without a name, array or `<OptGroup/>`), `list` `'Options'` (listbox label), `groupOpen` `'expanded'` / `groupClosed` `'collapsed'` (the state word in a group header's accessible name, `"<group>, <state>"`), `required` none (the validation bubble text of an empty `required` Select; without it the browser's own localized text). Live region messages (template with `{label}` / `{n}`, or a function `(value) => string` for plural forms): `removed` `'Removed {label}'` (chips removed; labels joined by `, `), `cleared` `'Selection cleared'`, `selected` `'{n} selected'` (multiple pick, `n` = total selected), `loaded` `'{n} more options loaded'` (`n` = options that arrived); the error is announced with `error`.

How to use `texts`:
- Pass only the keys to change: `texts={{empty: 'Ничего нет', loading: 'Загрузка'}}`. The rest keep their defaults; a key set to `undefined` keeps its default too.
- An inline object is fine: it is compared by its values, so it does not re-render the Select.
- For a whole locale, keep one object in a module and pass it to every Select.

### Icons and chips

| Prop | Type | Default | What it does |
|---|---|---|---|
| `icons` | object | see below | Every icon of the Select. |
| `deleteInline` | `boolean` | `false` | Where the chip's delete button sits: over the end of the chip (default) or inside it, the chip widening (on hover its row neighbours make room, no chip changes rows). |
| `deleteAlways` | `boolean` | `false` | When the delete button shows: on hover (default) or always. Swipe and touch delete mode show it either way. Combines freely with `deleteInline`; an always-shown overlay covers the end of the chip text. |

`icons` keys: `arrow` (the trigger arrow and the group arrows; it points up and CSS rotates it), `clear` (clear button), `remove` (chip delete button), `check` (checkmark in multiple mode), `checkbox` (custom checkbox frame; without it the built-in frame is drawn). Defaults are the built-in SVGs, and no `checkbox`.

How to use `icons`:
- Each value is a component (`icons={{arrow: ChevronUp}}`), an element (`<img src=…/>`), or a URL string (rendered as `img.rac-icon`, `1em` high).
- Pass only the keys to change; `undefined` keeps the default.
- `null` or `false` turns the control off: no `clear` means no clear button and no Delete key; no `remove` means no chip delete button, no Backspace and no long-press delete mode; no `arrow` hides the arrows. No `check` leaves the checkbox empty; no `checkbox` keeps the built-in frame.
- Keep the object stable or inline; it is compared by its values like `texts`. A new component identity on every render (an inline arrow function) re-renders the Select.

### Styling and motion

| Prop | Type | Default | What it does |
|---|---|---|---|
| `className` | string | `''` | Extra class on the trigger (`.rac-select`). |
| `optionsClassName` | string | `''` | Extra class on the panel (`.rac-options`). |
| `style` | object | `{}` | Inline style of the trigger; its `--*` keys are copied onto the panel too. |
| `container` | element or `() => element` | `document.body` | Where the panel is portaled (a modal's element inside a focus trap). A function is called on every render of the panel. |
| `duration` | number (ms) | `300` | Drives every animation and CSS transition. |
| `easing` | string | `'ease'` | Drives every animation and CSS transition. |
| `offset` | number (px) | `1` | Gap between the trigger and the panel. |
| `animateOpacity` | boolean | `true` | The panel fades while it opens and closes. |
| `keepMounted` | boolean | `false` | The closed panel stays in the DOM, collapsed. |
| `ref` | ref | — | The trigger element (`.rac-select`). |

### Removed props

Passing one of them to `<Select/>` warns once in development and has no effect. `<OptGroup emptyGroupText>` is ignored without a warning.

| Old | New |
|---|---|
| `visibility` / `setVisibility` / `onOpen` / `onClose` | `open` / `onOpenChange` |
| `ownBehavior` | `open` without `onOpenChange` |
| `emptyText`, `disabledText`, `loadingText`, `errorText`, `clearText`, `removeText` | `texts.empty`, `.disabled`, `.loading`, `.error`, `.clear`, `.remove` |
| `loadButtonText`, `loadMoreText` | `texts.loadMore`, `texts.loadingMore` |
| `emptyOption`, `invalidOption`, `disabledOption` | `texts.emptyOption`, `.invalidOption`, `.disabledOption` |
| `<OptGroup emptyGroupText>` | `texts.emptyGroup` |
| `OpenIcon`, `ClearIcon`, `DelIcon`, `Checkmark`, `Checkbox` | `icons.arrow`, `.clear`, `.remove`, `.check`, `.checkbox` |
| `showDelete` | `deleteAlways` |
| `unmount` | `keepMounted` (inverted) |

Not yet: `selectedText` as a function. Form reset is supported: `form.reset()` brings the Select back to `defaultValue` or empty (see Native form fields).
