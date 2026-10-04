# src — design notes

One `##` section per doc-key. A `// [DOC: some-key]` in code points to the `## Some Key` section here.

## Public API

`select.jsx` holds every public component: `Select`, `Option`, `OptGroup`. `index.js` re-exports them, plus `defineOption` from `model.js`.

- `DEFAULT_PROPS` is the single declaration of the Select's props. A prop the consumer leaves `undefined` falls back to its default (`withDefaults`).
- `texts` and `icons` are objects merged with their defaults key by key, the same way: `texts={{empty: 'Пусто'}}` changes one string and keeps the rest. A key set to `undefined` keeps its default; `null` or `false` is a real value (an icon turned off). `useShallowStable` compares both, like `style`, one level deep, so inline objects do not re-render the config readers.
- `RENAMED` maps every removed prop (the old `visibility`, `OpenIcon`, `emptyText`, …) to its replacement. A consumer passing one gets a single dev warning (see Dev Warnings) instead of a silent no-op. It is migration help for the major version and can be dropped one major later.
- The merge runs on every render of `Select` (a few dozen keys); nothing downstream depends on the identity of `props`. The old `useMemo` on `userProps` never hit, since a props object is new on every render.
- `aria-*` and `data-*` props (`ATTR`) are collected into `config.attrs` and spread onto the combobox before the Select's own attributes, so a consumer can add `aria-labelledby`, `aria-describedby` or `data-testid` but cannot break `aria-expanded` or `data-empty`. `attrs` is compared one level deep, like `style`.
- `MODEL_KEYS` never enter the config context. The store consumes them, and the status flags (`disabled`, `loading`, `error`) reach the UI through state. Keeping them out lets inline arrays, callbacks and status toggles change without re-rendering every UI component.
- Everything else goes into the config, which `useShallowStable` keeps stable while the values are equal.
- `ref` is a plain prop (React 19), not `forwardRef`. It is in `MODEL_KEYS`, and `useSelect` exposes the trigger element through `useImperativeHandle`.

## JSX Options

`select.jsx`, `Option`, `OptGroup` and `collectOptions`. The JSX options are data, not components: `Select` reads its `children` during render and never renders them. `Option` and `OptGroup` only return `null`.

- `collectOptions` walks `children` with `Children.toArray` and turns them into records in tree order. It descends into arrays, Fragments, `OptGroup` and `defineOption` components (see Define Option). Anything else (text, HTML tags, ordinary components) is skipped with a one-time dev warning (see Dev Warnings). An `<Option/>` inside an ordinary wrapper component is not seen, because the Select never renders its children.
- `Option` renders only when it is misused (outside a Select, or inside a component the Select cannot read), so its render emits a dev warning.
- Why during render: the options are known on the first render, on the server too (see Server Render), and no extra render is needed after mount. The display order is always the tree order, including options inserted later.
- Elements are recognised by the `racKind` tag on the component, not by identity. After a Fast Refresh edit of `select.jsx`, the consumer's elements still point to the old `Option` function, and the tag stays the same.
- The result is memoized on `children` and kept by `useDeepStable`: a parent re-render creates new elements, but equal records keep the previous array, so the model is not rebuilt. `deepEqual` compares the `jsx` elements structurally.
- Id: the `id` prop, otherwise the element's path (`o-2-kx1`: its React key per level, `k` marks a user key). The path is the same on the server and the client. A repeated `id` is made unique in the model (see Selection Identity). Gotcha: unkeyed dynamic options change their path when an option is inserted before them, like any unkeyed React list, so give them a `key` or an `id`.
- The label falls back through `label` → `name` → the text of `children` (`getText`) → `id`. The value falls back to the text of `children`. `userId` (the second `onChange` argument) is `id`, otherwise the value.
- The group comes from the `group` prop, otherwise from the enclosing `OptGroup`.
- `OptGroup` becomes a marker record (`isGroupMarker`) that carries the group's own settings (`disabled`, `className`, `style`). Its name falls back to `texts.emptyGroup`, like a nameless array group, so `collectOptions` takes that text as an argument.

## Define Option

`model.js`, `defineOption(render)`: the supported way to put a reusable option component into a Select.

```jsx
const CountryOption = defineOption(({c}) => <Option value={c.code}><CountryLabel c={c}/></Option>)
<Select>{countries.map(c => <CountryOption key={c.code} c={c}/>)}</Select>
```

- It returns a component tagged `racKind: 'define'` that holds `render`. `collectOptions` calls `render(props)` instead of rendering it and walks the result like children: one `Option`, several, a Fragment, an array, an `OptGroup`, or another defined component.
- Why: the Select learns the options during its own render, so it stays complete on the server (see Server Render). Rendering the wrapper would need a second pass or effects.
- Invariant: `render` is a pure function of props. No hooks and no context in it: it runs inside the Select's render (React's dev build complains about hooks there). Hooks belong in the content (`CountryLabel`), which renders normally inside the option row.
- Rendered on its own (outside a Select), a defined component renders `null`.
- It lives in `model.js`, not `select.jsx`: the Fast Refresh lint rule forbids exporting a non-component next to components.

## Dev Warnings

`utils.jsx`, `warnOnce(key, message)`.

- Each key warns once per page load (once per process on the server), never on every render. Keys name the problem (`text`, `child <div>`, `option outside`), so two different ignored components each warn once.
- Dev detection: `process.env.NODE_ENV !== 'production'`, inside `try`. Consumer bundlers (Vite, webpack, Next, esbuild) replace the expression, so production builds drop the warnings. Where nothing replaces it and `process` does not exist, the `catch` turns warnings off. `/* global process */` tells ESLint the name is intentional.
- Warnings are the only side effect allowed in a render path; they are idempotent thanks to the key set, so StrictMode double renders do not duplicate them.

## Contexts

`state.js`. The Select's contexts are split by how often they change, so a consumer subscribes only to what it needs:

- `SelectConfigContext`: the merged props plus static handles (`selectId`, `selectRef`, `highlightStore`). It changes only when the consumer re-renders the Select with props that are not equal.
- `SelectActionsContext`: stable callbacks. Their identity never changes.
- `SelectStateContext`: interaction state and the derived option model. It changes on user actions.

All contexts live in one leaf module that imports nothing from the library, so any component can import them without an import cycle. `PresenceContext` is private to `motion.jsx`.

## Compact Reducer

`state.js`, `compactReducer`. It accepts a partial state or an updater that returns one, and merges it. A patch that changes nothing returns the same state object, so React bails out of the re-render. Every `useReducer` in the library uses it; never declare a local merge reducer.

## Store

`state.js`, `createStore`. A minimal external store (`get`, `set(patch)`, `subscribe`) for values that change very often: the hover highlight, chip hover and swipe, the dropdown direction. Components read it through `useSyncExternalStore` with a selector, so only the subscribers whose selected value changed re-render. `set` with an unchanged patch notifies nobody.

- Every `useSyncExternalStore` call passes a third argument, `getServerSnapshot`, that returns what the store's initial value selects (no highlight, not hovered, not upward). Without it React throws on the server. See Server Render.

## Stable Hooks

`state.js`.

- `useStableActions(handlers)` returns an object of wrappers created once. Each wrapper calls the latest handler, which is written in `useInsertionEffect`. Consumers can hold the wrappers without re-rendering, and effects that use them need no dependency churn.
- `useShallowStable` / `useDeepStable` keep the previous value while the new one is equal to it. On a real change, they re-render once with the new value. They use the documented "adjust state during render" pattern, so no refs are read or written during render.
- `useShallowStable` compares the config: every key with `Object.is`, and `style`, `texts`, `icons` and `attrs` one level deeper.
- `deepEqual` compares plain data and React elements structurally: two elements with the same `$$typeof`, `type`, `key` and deep-equal props describe the same UI. Depth is capped at 12, so odd or cyclic input returns "not equal" instead of overflowing the stack.

## Select Store

`useSelect.js` is the single store of a Select. It owns the reducer (`initSelectState`), composes `useSelectModel` and `useSelectBehavior`, and returns `state` plus stable `actions` for the contexts.

- Reducer fields: `internalVisibility`, `deleting`, `loadPending`, `toggledGroups`, `internalValue`, `picked` (see Selection Identity). The JSX options are not state: `Select` collects them during render and passes them in (see JSX Options). `internalValue` and `internalVisibility` are used only while the consumer does not control `value` / `open`. Switching a Select between controlled and uncontrolled `open` is not supported (like a React input).
- Open state: `open` controls the *requested* state when defined, otherwise the reducer does. The shown state is `visibility = active && requested` (see State Semantics). Every open or close the Select wants goes through `setVisibility(next)`, which does nothing when `next` equals the requested state, updates the reducer in uncontrolled mode, and calls `onOpenChange(next)` in both modes. So `onOpenChange` reports exactly the real opens and closes in uncontrolled mode, and the requests in controlled mode; `open` without `onOpenChange` is a Select whose open state only the consumer changes (it replaces the old `ownBehavior`). Internally the state keeps the name `visibility`.
- The guard matters for the forced close below and for keys like Escape on a closed list: without it, `onOpenChange(false)` fired on mount of a loading Select and on every status change.
- The hover highlight changes on every pointer move, so it lives in `highlightStore` (see Highlight), not in the reducer.
- `loadLock` is a synchronous ref guard against bursts of scroll events. `loadPending` is the same flag for the UI. `loadPending` is released when the option count, `hasMore` or `loadButton` changes, or when the Promise returned by `loadMore` settles (resolved or rejected); `loadLock` follows `loadPending` in an effect, so the lock opens only after the render that shows the new options. Without a Promise, a load that brings no new options and leaves `hasMore` unchanged (a failed request) keeps the lock forever, which is why the Promise path exists.
- A `loadMore` that throws synchronously releases both at once: the lock directly (the `loadPending` true → false pair lands in one batch and never re-runs the effect) and `loadPending`. The error goes to `reportError` (console and `window.onerror`), not up the tree: `loadMoreOnce` also runs from a layout effect, where a throw would unmount the app.
- `hasMore` without `loadMore` warns once and loads nothing.
- An open list takes focus. A closed list forgets its explicit highlight and waits for the next open animation (`ready: false`).
- A Select that stops being `active` (disabled or no options) asks to close (see State Semantics).
- Status props (`disabled`, `loading`, `error`) travel with `state`, not with config. They flip at runtime, and only the root UI reacts to them.

## State Semantics

What `disabled`, `loading` and `error` do. One flag decides interaction: `active = !disabled && hasOptions` (model).

- An inactive Select is never shown open: `visibility = active && requested`, so `aria-expanded` and the panel follow `active` even while a controlled `open` stays `true`. It asks to close (`setVisibility(false)`, so `onOpenChange(false)`) only when `active` turns from true to false (`wasActive`). A Select that mounts inactive (loading, no options yet) with `open` true therefore reports nothing on mount and opens as soon as its options arrive; the old effect asked to close on mount.
- "Has a value" (`hasActualValue`): not `null` / `undefined`, not an empty array, not an empty *plain* object. A `Date` or a class instance counts as a value, although `Object.keys` of it is empty.
- `disabled` blocks, like a native `<select disabled>`: the list closes and cannot open, no handlers, no clear button or arrow, chips are locked (see Chip). The value stays visible (title or chips); only an empty Select shows `texts.disabled` in place of the placeholder.
- `loading` and `error` only report; they never block. With options, the Select opens, selects, clears, and chips delete as usual. Without options it is inactive for that reason alone, exactly like an empty list: no clear button, no arrow.
- Title priority: `selectedText` (with a value), the value, then `texts.error`, `texts.loading` (with dots), `texts.disabled`, the placeholder, `texts.empty`. A value always wins, so no data is hidden by a status.
- `error` covers a failed first load and a failed load-more alike: one state, `data-error` on the root (red border), and a status row `.rac-option[data-error]` with `texts.error` at the end of the list, in place of the loading footer. A consumer who retries clears `error` to get the loading footer back.
- `aria-busy` on the root means "something is loading": `loading`, or a pending `loadMore` (`loadPending`). The theme draws a thin moving stripe at the bottom of the trigger for it (`::after`, `rac-busy`); a static full line under reduced motion. The stripe is theme, one rule to replace or drop. While open, `loading` also shows the loading footer with `texts.loading`.
- Why: a status prop must not destroy the consumer's state. A load-more failure used to make the whole Select unusable although its options were fine.

## Option Model

`model.js` (pure) + `useSelectModel.js` (hook).

- `normalizeOptions` turns the raw `options` prop plus the collected JSX options (`jsxOptions`) into one flat list: plain options, group headers, grouped items, and the optional load-more row. The UI and the keyboard both walk this list by index.
- `options` accepts primitives, objects, groups (`{group, options}`), and a bare object without label keys, which is read as a dictionary of options.
- Only a *plain* object (`isPlain`: prototype `Object.prototype` or `null`) can be a group or a dictionary. A `Date`, a class instance or any other object is one option: its label comes from the label keys, otherwise from its own `toString` (`Date` gives its date text; the default `[object …]` is skipped), otherwise from its first filled field. The old check treated a `Date` as an empty dictionary and dropped it, and split a class instance into one option per field.
- A JSX option's name is its label, otherwise its `value` as text whenever the value is filled: `<Option value={0}/>` and `<Option value={false}/>` show `0` and `false`, like the array options `0` and `false`. They used to show `texts.emptyOption`.
- JSX options arrive in tree order, which is the display order. `childrenFirst` puts them before the array options.
- Group state: the reducer keeps only `toggledGroups`, the names the user toggled. `expandedGroups` is derived on every model change: a group header that is not disabled is expanded when `groupsClosed === toggledGroups.has(name)`, i.e. by default open, flipped by a toggle. So every group starts in the same state, whatever its source (`{group, options}`, an item's `group` field, `<OptGroup/>`, an `<Option group>`), including groups that arrive later through `loadMore`. A disabled group is always collapsed.
- Gotcha: `groupsClosed` is read on every render, so changing it at runtime flips every group the user has not toggled.
- The collapsed state of a group is not baked into the list. Toggling a group keeps every option object identical, so memoized rows do not re-render.
- `resolveSelection` maps the raw `value` onto the normalized options (see Selection Identity). A value without a matching option becomes a virtual entry (`virtual: true`), so an outside `value` is always shown. Its id is `virtual-<key>-<n>`, where `n` counts the earlier virtual values with the same key; it used to be the position in `value`, so removing one value re-keyed every virtual chip after it, and they all animated out and back in.
- In the hook, `options` and `value` are stabilized with `useDeepStable`, because consumers often pass inline literals. Selection is derived from `value` on every change, so an outside update is reflected at once.
- `commit` is the single exit for a new value: it stores the value only in uncontrolled mode, always stores `picked` (see Selection Identity), and always reports the value through `onChange`.
- Clearing commits the empty value of the mode: `null` in single mode, `[]` (with ids `[]`) in multiple mode, the same as removing the last chip. The old clear sent `null` in multiple mode, and `value.map` in the consumer threw.
- Picking the option that is already selected in single mode only closes the list, with no `onChange`, like a native `<select>`, Radix and MUI. Single mode has no "uncheck by click"; the clear button, Delete and Backspace are the way to empty it. Multiple mode toggles as before.

## Selection Identity

`model.js` (`resolveSelection`, `claim`) + `useSelectModel.js` (`picked`). The normalizer never rejects user data: duplicates, `NaN`, empty items, circular objects and colliding JSX ids all stay separate, selectable options.

- Invariant: every normalized option has a unique `id`, and the selection is a list of those ids. The value alone cannot say which of `1, 1, 1` (or `true, true`, two equal strings, two `{name: 'x'}`) was picked.
- `picked` (reducer, both modes) holds the ids of the options the user last committed. `resolveSelection` searches the hinted options first, then the whole list, and takes the first free option whose `original` matches the value item. So a hint only decides between equal candidates; a value that no longer matches its hint falls through to the plain search.
- Why not ids only: `value` stays the source of truth for controlled mode. An outside value that is equal to the committed one keeps the user's exact options; a changed one is matched by value, and an ambiguous one takes the first free duplicates in list order.
- Match order: identity (`same`: `===`, plus `NaN` equals `NaN`), then `JSON.stringify` for objects. `toJSON` never throws (circular, `BigInt`) and returns `undefined`, which matches nothing. Only records with an `original` field take part, so a value item `undefined` never matches a group header, the load-more row or an empty placeholder.
- JSX ids come from the `id` prop, which consumers may repeat. `claim` suffixes the repeats (`jsx-same`, `jsx-same~1`) in tree order, so the second one keeps its id while the order holds. Array ids are positional (`default-<depth>-<i>`) and unique by construction.
- Gotcha: a controlled consumer that ignores `onChange` still moves `picked`. With an unchanged, equal value the Select shows the option the user clicked among the equal ones; this is intended, the value cannot tell them apart.
- Gotcha: `onChange`'s second argument (`userId`s) is as ambiguous as the value for duplicates. Consumers who need to tell duplicates apart give them distinct `id`s.

## Highlight

`useSelectBehavior.js`. The highlight lives in `highlightStore`: `{index, fallback, ready}`.

- `index` is set explicitly by hover or the keyboard. `fallback` is computed: the first selected option that can be reached, otherwise the first reachable option (not a header), otherwise the first reachable header. `effectiveHighlight` is `index`, or `fallback` when `index` is `-1`.
- Reachable (`useReachable`: `reach` plus `list`, the reachable indices in order): enabled, not loading, and either an option outside a collapsed group or the header of a group that has options. Headers are reachable so that the keyboard can open and close groups: with `groupsClosed`, the options of a closed group were unreachable by keyboard before. Enter / Space on a header toggles it (`selectOption` routes headers to `toggleGroup`), and the highlight stays on it.
- A layout effect with no dependency list runs on every render. It keeps `index` only while it still points at a reachable entry and publishes the new `fallback` before paint.
- `step` moves over `list`: ArrowUp / ArrowDown by one, cyclically; PageUp / PageDown by `PAGE` (10) without wrapping; Home / End to the ends. While auto loading (`hasMore` without `loadButton`), the arrows do not wrap either, otherwise the user would jump over the loading edge. Home and End also open a closed list (with the highlight already moved); the other keys only open it.
- `ready` is set when the open animation ends. `OptionItem` scrolls into view only when it is ready, otherwise the collapsed container would be scrolled instead.
- Enter re-sets the current index before selecting, so a changed selection does not move the highlight away from the chosen option.

## Select Behavior

`useSelectBehavior.js`: keyboard, focus, blur, and scroll-driven loading.

- Auto loading (scroll mode only) fires when the highlight comes within `loadAhead` options of the end, or when the list is scrolled within `loadOffset` pixels of its end.
- Returning to the browser tab refocuses the select. A window `focus` listener stores a timestamp, and `handleFocus` ignores a focus that comes within 100 ms of it.
- The click that delivered focus must not immediately toggle the list closed again. `justFocused` blocks `toggleVisibility` for 200 ms after the focus.
- Focus opens the list (Tab included): this is a deliberate product decision, not the APG default.
- A click while in delete mode only leaves delete mode.
- A blur into the portal (`.rac-options`) does not count as leaving the select.
- `onFocus` / `onBlur` report the Select as a whole: `onFocus` when focus comes from outside the combobox, `onBlur` when it leaves both the combobox and the panel. Focus moving between the combobox and its hidden form inputs (see Form Field) reports nothing. Both are `MODEL_KEYS`, so inline callbacks re-render nothing.
- Escape leaves touch delete mode, otherwise closes an open list, and in both cases stops the event (`stopPropagation` + `preventDefault`), so a modal around the Select stays open. On a closed Select it does nothing and lets the event through untouched: the old unconditional `preventDefault` kept a native `<dialog>` from closing. A modal that listens in the capture phase (Radix `DismissableLayer`) still sees the key first; there the consumer filters it in `onEscapeKeyDown`.
- Delete clears the value, like the clear button, and only when `icons.clear` is on. Backspace removes the last chip in multiple mode (only when `icons.remove` is on). In single mode it clears, like Delete. These keys are the keyboard path to the clear and chip delete buttons, which are `tabIndex={-1}`: a focusable button inside the combobox would take focus from it, and its focus and key events would bubble into the combobox handlers.
- The clear button's `clear(e)` stops the event itself, so the click does not reach `toggleVisibility`. No class-name check is needed.

## Typeahead

`useSelectBehavior.js`, `typeahead` + `match`: typing jumps to an option by its text, like a native select (WAI-ARIA select-only combobox).

- A printable key without Ctrl / Meta / Alt (and not during IME composition) appends to a query that resets `TYPEAHEAD_MS` (500 ms) after the last key. A closed list opens, with the match already highlighted.
- The search runs over the reachable real options (`'original' in option`: no headers, no load-more row, no placeholders), by `name`, case-insensitive, from the current highlight on and wrapping. A query of one repeated letter (`p`, `pp`, `ppp`) cycles through the options starting with that letter, from the one after the current; a longer query stays on the current option while it still matches.
- Space is a typeahead character only while a query is running (`Pear tree` works); otherwise it keeps its select-or-open meaning.
- Options inside a collapsed group are not searched, like the arrows. The timer is cleared on unmount.

## Collapse

`motion.jsx`, `Collapse`: the only animation primitive. It renders one element (`<div>`, or the tag given in `as`) and animates its whole box on one axis (size, padding, border width and margins, plus opacity with `fade`) when it opens and closes. It has no dependencies: it runs on the Web Animations API (`element.animate`).

### Usage

```jsx
// controlled: `in` decides
<Collapse axis='y' in={open} className='rac-group-items'>{children}</Collapse>

// driven by the nearest <Presence/>: no `in`, a unique `key`
<Presence>
    {items.map(item => <Collapse axis='x' fade key={item.id}>{item.label}</Collapse>)}
</Presence>
```

| Prop | Default | Meaning |
|---|---|---|
| `as` | `'div'` | The rendered tag (`'button'` for the clear and chip delete buttons). |
| `in` | — | Shown or hidden. Omitted: follows the nearest `Presence`; with no `Presence` it is hidden. |
| `axis` | `'y'` | `'y'` animates `height` and the vertical padding, border widths and margins; `'x'` the same with `width` and horizontal sides. |
| `fade` | `false` | Also animates `opacity`. |
| `unmountOnExit` | `true` | Removes the div once closed. With `false` it stays in the DOM, collapsed to 0. |
| `duration` | Select `duration`, else 300 | Milliseconds. |
| `easing` | Select `easing`, else `'ease'` | Any CSS easing. |
| `group` | — | A `Set` shared by several Collapses: they run on one clock (see Collapse Group). Internal, used by the inline chip delete buttons and the titles. |
| `nodeRef` | own ref | Pass a ref when the owner must reach the element (the options panel positions itself through it). |
| `onEntered` / `onExited` | — | Called when the open / close animation really finishes. |
| rest | — | Spread onto the element (`className`, `style`, `id`, ARIA, handlers). |

### How it works

- On every change of the shown state, a layout effect (before paint) measures the natural box with `getComputedStyle` and runs one animation between the collapsed frame (every animated side `0px`, opacity `0`) and the measured frame. Both frames carry `overflow: hidden`, so the element clips its content only while it animates or is held closed.
- The frames also carry `text-overflow: clip` and lift the size limits of the axis (`min-width: 0` and `max-width: none`, or the height pair, `LIMITS`): while it animates, the animation owns the size. The measured target already includes the element's own limits. Without this, an ellipsis would slide along with a growing title, and a consumer `min-width` would stop a collapse halfway. The truncated chips rely on the lifted `max-width` (see Trigger Width).
- Nothing is written into inline styles. When an open animation ends, the effect disappears and the element goes back to its natural `auto` size, so later content changes resize it normally.
- Hidden state is held by the finished close animation (`fill: 'both'`). An open animation uses `fill: 'backwards'`. As a result, every animation that ends *open* leaves no trace, and every one that ends *closed* keeps the element at 0 until it is unmounted or reopened. The close fill also covers the *before* phase: Chrome may resolve a new animation's start time a little after the current frame, and for that instant its current time is negative. With `forwards` only, the element would show its natural size in that instant. Group members set their start time explicitly (see Collapse Group), but other Collapses still rely on this fill.
- Interrupting a running animation (open → close before it ends) calls `animation.reverse()`: it plays back from the current point with the remaining time. There is no jump and no new measurement. A Collapse in a `group` restarts instead.
- `onfinish` is the only completion signal. There are no timers and no `transitionend`. A stale animation (replaced or cancelled) is ignored by the `anim.current === animation` guard.

### Mount rules

- Mounted with `in` true: shown at once, no animation (same as the old `appear={false}`).
- Mounted hidden with `unmountOnExit` true: renders nothing until shown.
- Mounted hidden with `unmountOnExit` false: rendered, held at 0 without animating.
- Mounted by a `Presence` after that Presence's first render: animates in.

### Gotchas

- Collapsed means the whole box is 0 on the axis: size, padding, border and margins. A styled element (a button, the title, a chip) can therefore be the Collapse itself, with no wrapper.
- Collapse adds no class and no permanent CSS. An open Collapse does not clip (focus rings, shadows and the chip shake stay visible), and a consumer's `overflow` or `transition` cannot break the animation.
- Effect reconnects are harmless. React disconnects and reconnects the effects of a mounted component in StrictMode (on mount, and in React 19 also when a keyed child is moved) and inside `<Activity>`. The disconnect does not cancel the running animation and does not reset the "last shown" marker, so the reconnect finds the state unchanged and the animation just continues. An `alive` flag, cleared on disconnect, keeps a finish that lands on a really unmounted Collapse from calling back. (The old version cancelled on cleanup: every chip that React moved lost its animation and snapped to full size.)
- `prefers-reduced-motion: reduce` is read at the moment an animation starts, and it sets that animation's duration to 0. The state still changes through the same path, so hold-at-0, `onEntered` / `onExited` and Presence unmounting all behave as usual, just without motion. A running animation keeps its duration if the setting flips mid-way. CSS transitions follow the same setting through `--rac-duration` (see Styles Layer).
- Without `element.animate` (jsdom in consumer tests), every change completes at once and all callbacks still fire. The rest of the library guards its browser-only APIs the same way (`ResizeObserver`, `IntersectionObserver`, `getAnimations`, `scrollIntoView`), so a Select mounts, opens and selects in jsdom; before, `new IntersectionObserver` threw on every mount.
- Size animations run layout on every frame. That cost is the same for any height or width animation. Keep the animated subtree small.

## Collapse Group

`motion.jsx`, the `group` prop of `Collapse`: several Collapses whose sizes must add up to a known budget run on one clock. The inline chip delete buttons use it (see Delete Reserve): each chip row has room for exactly one open button. The titles use it too: a leaving and an entering title share one row, and two truncated titles sum to exactly its width (see Trigger Width).

- **Rule.** Whenever a member starts or changes direction, every running member restarts from its *current* frame towards its own target, with the same duration and easing. A member that changes direction does not `reverse()`.
- **The current frame is computed, not read.** A restart takes its start values from the member's own keyframes and `effect.getComputedTiming().progress`: `from + (to − from) · progress`, per property. It never reads them with `getComputedStyle`. Firefox handles real pointer input at the start of a refresh tick, after the timeline has advanced but before animated styles are resampled. There, `getComputedStyle` returns the new frame only for elements restyled for another reason (the chip whose `:hover` just changed), and last frame's values for the rest. The mixed start values summed past the budget (measured up to 19.2 px for a 16 px button), and a full row wrapped. Synthetic input (puppeteer, WebDriver) arrives outside the tick and never shows it. The targets (`frame()` of an idle element, or `closed`) have no running animation, so reading them stays safe.
- **The clock is explicit.** Every member animation gets `startTime = timeline.currentTime` (which leaves the pending state) and then `currentTime = 0` (which sets the exact internal timeline time). The timeline time is constant within a task. Starting the animations in the same task is not enough: Chrome resolves the start time of a pending animation on its own, sometimes a frame later than an animation that has just started, sometimes a fraction of a millisecond apart. When the opening button runs ahead of a closing one, the row exceeds the budget by up to about a pixel, and a row filled to the pixel wraps its last chip. `currentTime = 0` matters in Firefox, whose timing getters are coarsened (`privacy.reduceTimerPrecision`, much more under `resistFingerprinting`): a start time set from the coarse `timeline.currentTime` would begin the animation partway in.
- **Why it holds the budget.** With one clock, member *i* has width `wᵢ(t) = fromᵢ + (toᵢ − fromᵢ)·e(t)`, so the sum is `S₀·(1 − e) + S₁·e`: a blend of the sum now (`S₀`) and the sum at the targets (`S₁`). When both are within the budget (at most one target is open), so is every frame, for any easing between 0 and 1, however fast the targets change.
- **Why not `reverse()`.** A reversed animation retraces its curve backwards over the time it has run, while the new member runs its curve forwards. For an asymmetric easing such as `ease` (0.8 at half time), a button caught near the end of its opening and a new button opening sum up to about 1.6× the budget halfway through: the row overflows and its last chip wraps.
- **Why independent timings fail too.** A member that is already closing keeps its own older clock. For strong ease-out curves, that closer and the new pair can still sum above the budget. So every running member restarts, not only the two that changed.
- **Batch skip.** A member started in the current batch is skipped, because it already runs on the clock. A batch is a module-level token that lasts until the next microtask, so it covers one commit's layout effects. Comparing times does not work: Firefox returns a coarsened `startTime` (it gives back 366.82 after being set to 366.84), so the check never matches. Under `resistFingerprinting`, a start time from an earlier frame can match the current time, and skipping that member breaks the clock. A redundant restart in a later microtask of the same task is harmless: it restarts from the same frame. Touch delete mode does not use the group.
- **Rounding.** The sum is exact in real numbers, but layout rounds every member's width on its own: Blink and WebKit truncate to 1/64 px, which can only lose width, while Firefox rounds to the nearest 1/60 px (app unit). With several members, Firefox can therefore exceed the budget by up to half an app unit per member. This is measured at 1–3 app units with 7 members when the device pixel ratio or zoom is not 1. The Delete Reserve absorbs it.
- Membership: a Collapse joins the `Set` when it starts an animation and leaves when that animation finishes or the Collapse disconnects; a reconnect with a running animation joins again.
- An easing that overshoots (a `cubic-bezier` with a y above 1) breaks the bound. The chip buttons use the Select's `easing` like every animation, so such an `easing` with `deleteInline` can wrap a full row mid-handover.

## Presence

`motion.jsx`, `Presence`: replaces `react-transition-group`'s `<TransitionGroup>`. It keeps a child in the DOM after the parent stops rendering it, until that child's exit animation ends. It renders no wrapper element.

### Usage

```jsx
<Presence>
    {showA && <Collapse axis='x' key='a'>A</Collapse>}
    {showB && <Collapse axis='x' key='b'>B</Collapse>}
</Presence>
```

Rules:

1. Every child needs a stable, unique `key`. The key is the child's identity: the same key means the same item.
2. Each child must contain exactly one Collapse **without `in`**. That Collapse reads the child's presence and reports the end of its exit. Collapses with an explicit `in` inside the child ignore the Presence (for example the chip delete button).
3. The child may be any component (`Chip` wraps its Collapse together with a row break). It does not need to forward any props.

`hold` (default `false`): while it is true, a child whose exit has finished stays mounted instead of being dropped; when it turns false, every leaving child is dropped in that same render. The owner must turn it off only once all exits have finished. The chips use it (see Chip Hold), so that a collapsed chip keeps its row until the whole layout is released.

### How it works

- State: `{children, list}`, where `list` holds `{key, el, present, appear}` in render order.
- When the `children` prop changes, the list is re-synced during render (the documented "adjust state while rendering" pattern, the hooks counterpart of `getDerivedStateFromProps`). Present children take their fresh element. A child whose key vanished stays right after its old neighbour (the nearest earlier child that was present and still is) with its **last element frozen** and `present: false`. Anchoring on the neighbour, not on the old index, keeps several leaving children in their order; the old index-based splice put a leaver after its right neighbour as soon as another child had left or moved, and React then moved DOM nodes. Re-adding a key while it is leaving flips it back to `present`, and its Collapse reverses; it moves to its new place in `children`.
- Each item is wrapped in `PresenceChild`, which provides a memoized `{present, appear, onExited}` through `PresenceContext` (private to `motion.jsx`). The value changes only when that item's own state does, so a `memo` child such as `Chip` is not re-rendered by the group.
- `appear` is `false` for the children of the first render and `true` for everything added later. Collapse reads it only once, at mount.
- `onExited(key)` drops the item. It is a no-op if the key became present again, which guards against a late finish, and while `hold` is on.

### Gotchas

- The frozen element is never updated. A leaving child keeps the props it had at the moment of removal.
- Keys come from `Children.toArray`, so they carry React's `.$` prefix. They are only compared with each other.
- A child without a presence-driven Collapse never reports its exit and stays mounted forever.

## Value

`trigger.jsx`, `Value`: the `.rac-value` element, the only wrapper between the combobox root and its content. It holds chips in multiple mode, otherwise the title, and owns the chip layout state through `useChipLayout`.

```
div.rac-select                 role=combobox + state attributes
├─ div.rac-value               flex-wrap row, observed for its height
│  └─ div.rac-title            (or div.rac-chip-slot > div.rac-chip per value)
├─ button.rac-clear            Collapse as='button'
└─ div.rac-arrow               Collapse, aria-hidden
```

- The title and the chips have a `Presence` each, the title's first, so switching between them (for example, clearing a multiple value) cross-fades: the chips collapse out while the title collapses in. The title always sits at the start of the first row, which lets the chip rows stay held while the title grows or shrinks there (see Chip Hold).
- The title is itself the Collapse (no inner span). It holds the text and, while it shows `texts.loading` (loading without a value or error), the shared `dots` element from `utils.jsx`. The dots sit on the text baseline because the empty dot boxes give `.rac-dots` a baseline at its bottom edge.
- Title key: the title is text, so the Collapse is keyed by it; with `valueAsOption` (rich JSX, which cannot be a key) it is keyed by the selected option's id (see Option Content). A `-loading` suffix is added in both cases while the dots show. A new key makes the old title leave and the new one enter, so the dots appear and disappear with the title and need no Collapse of their own.
- Known issue (due for the animation rework): the key is the text, so any text change replays the title animation, even when the state did not change: typing into `placeholder` or `selectedText`, switching `texts` (i18n). The plan is to key by the meaning of the title (`error`, `loading`, `disabled`, `selectedText`, `value-<id>`, `placeholder`, `empty`), so a text change updates in place and only a state change or another selected option animates. The chips (by chip key, see Chip Keys), rows (by id) and the load-more row (constant id) do not have this problem.
- A boolean value marks the title with `data-bool='true'|'false'` (colored like boolean options).
- The title is one line, truncated with an ellipsis when it is wider than `.rac-value` (see Trigger Width). The title Collapses share one `group`.
- Delete button probe: while the inline delete reserve is needed and its width is unknown, a hidden `button.rac-chip-del` with the real `icons.remove` is rendered once inside `.rac-value` and measured (see Delete Reserve).
- The chip Collapses and the title Collapse call `settle` on `onEntered` / `onExited`, and `Presence` gets `hold={held}`; `Snapshot` (a class component, rendering nothing) records chip positions before each chip-list commit. All three belong to Chip Hold.

## Chip Keys

`trigger.jsx`, `rekey` + `useChipKeys`: the React key of each chip, kept apart from the option id.

- Why: an option id says where the option sits in the current catalog (`default-0-7`, `jsx-a`, `virtual-1-0`). When the catalog changes and the value does not (options become `[]`, arrive later, reorder), the same value item resolves to another id: a real option turns virtual or back. Keyed by id, every such chip left and a new one entered, so the chips animated out and in although nothing was picked or removed.
- Rule: each chip-list change is matched against the previous keyed list. A chip whose id was there keeps that key. Otherwise it takes the key of a leaving chip with an equal value (`sameValue` from `model.js`: identity, `NaN`, then JSON), first in order. Otherwise its key is its id, suffixed with `~` while that key is still taken.
- Invariant: the id-match goes first, so removing one of several equal chips (`1, 1, 1`) removes exactly the clicked one; the value-match only picks up chips whose id changed.
- The id stays the identity everywhere else: selection, `removeOption`, hover and swipe (`chipStore`), breaks and the ghost (`data-id`). Only the `key` in `Value` uses the chip key.
- Gotcha: a kept chip that turns virtual keeps its place and only changes content (for example, its JSX with `valueAsOption`); that is intended, the value is the same.

## Value Height

`useChipLayout.js`, `followHeight`: when the number of chip rows changes, the root's height animates instead of jumping. No wrapper element and no inline style are involved.

- The `ResizeObserver` on `.rac-value` reports its natural height. When that height changes, the root's height is animated with WAAPI from what is on screen now (the running animation's value, or the last natural root height) to the new natural height, read after cancelling the old animation. A change mid-way retargets from the current frame, so there is no jump.
- The keyframes also carry `overflow: hidden` (new rows are clipped until the root reaches them) and `align-items: flex-start` (the rows stay anchored to the top while the root grows or shrinks; the buttons keep `align-self: center`). Both apply only during the animation. At rest the root is `align-items: center`, so a consumer's fixed height keeps the value centered.
- Heights are read with `getComputedStyle`, which keeps the math right for any `box-sizing`. A root with a fixed height gives equal start and end values, and no animation runs.
- Why not CSS `interpolate-size`: a transition starts only when the computed value changes. Here the height stays `auto` and only the content changes, so no transition would ever start.
- Skipped on the first measurement, without `element.animate`, and under `prefers-reduced-motion: reduce`.

## Trigger Width

`base.css` + `useChipLayout.js` (`ghostRows`) + `trigger.jsx`: the Select never gets wider than its container. Where the consumer's layout sizes it by content (a flex item, an `auto` grid column, `width: fit-content`), it grows with the title and the chips; once it hits the limit, the title and every chip are truncated with an ellipsis.

- **Root.** `max-width: 100%` (never wider than the container) and `min-width: 0` (a flex or grid parent may shrink it below its content; a flex item's default minimum would be the widest text).
- **Title.** `max-width: calc(100% - 0.25px)`, `overflow-x: clip`, `text-overflow: ellipsis`. `clip`, not `hidden`: only the inline axis is cut, so rich content (`valueAsOption`) keeps its vertical overflow, and the title is no scroll container. While a title animates, its frames switch to `text-overflow: clip` (see Collapse), so the ellipsis appears when the title comes to rest instead of sliding with its width.
- **Two titles in one row.** A change of title puts the leaving and the entering one side by side in the first row. When both are truncated, their widths add up to the whole row, and a row that overflows by a fraction wraps the new title to a second line for a frame: the trigger jumps in height. The title Collapses share one `group` (see Collapse Group), so their sum never exceeds the row in Blink and WebKit, which truncate widths; the 0.25 px keeps Firefox's rounding to the nearest app unit inside it too.
- **Chips.** `.rac-chip-slot` is `max-width: 100%` of the row. `.rac-chip` is `max-width: inherit`, `box-sizing: border-box` and `flex-shrink: 0`: it takes the slot's `100%` at rest, and its label `.rac-chip-text` shrinks with an ellipsis (the delete button does not shrink). While the slot animates, Collapse lifts its `max-width` to `none` (see Collapse); the chip inherits `none`, keeps its natural width and is clipped by the slot. A chip that shrank with the slot instead would show an ellipsis sliding along with every enter and exit. A truncated chip's end margin sticks out of its slot, invisibly: it is alone in its row.
- **Growth before the row math.** The chip ghost of Chip Hold and Delete Reserve is laid out in the flow, in place of `.rac-value`: for the moment of the measurement the real `.rac-value` is `position: absolute` (out of the flow, CSS animations keep running, nothing paints in between). The root then takes the width it will have with every chip at full width, whatever the consumer's layout is, and the rows and breaks are computed for that width. The ghost keeps the real height, so the page does not move vertically.
- Why: the old ghost was `position: fixed` at the current width. A Select about to grow put an entering chip onto a new row, grew, then FLIPped the chip back up. With inline delete, the reserve wrapped the last chip of a single row that had room, and hovering flickered between one and two rows every frame (measured in the sandbox, `frame: fit` + `deleteInline`).
- Why the root width needs no pinning: in a content-sized root, the width follows the chips' current widths every frame, so it is never narrower than a held row; in a root of fixed width, the ghost width is the current one.
- **Gotchas.** A wrapper that shrinks to fit without being a flex or grid parent (`inline-block`, a float, `width: fit-content` on the wrapper) takes the widest text as its minimum and overflows; give that wrapper `max-width: 100%`. Rich content (`valueAsOption`) is clipped, not ellipsized. A truncated title or chip shows its ellipsis only once its animation has ended, a one-frame change. Each ghost measurement lays out the root's ancestors once more (on chip changes during animations, resizes, font loads).

## Trigger

`trigger.jsx`, `Trigger`: the `role='combobox'` root of the Select. It renders `Value` and the clear and open buttons. `Dropdown` is its sibling in `Select`, so React events from the portal panel never bubble into the combobox handlers.

- Keyboard, focus, click and blur handlers are attached only while the Select is `active` (not disabled, and has options; see State Semantics). The clear button needs `active` and a value; the arrow needs `active`.
- The clear button and the arrow are root children in one `Presence`. Each is itself an x-axis `Collapse`, so it collapses in and out on its own, with no shared wrapper.
- The clear button is a real `<button type='button'>` named by `texts.clear`, with `tabIndex={-1}`. Delete and Backspace are its keyboard path (see Select Behavior). It stops `mousedown`, so clicking it does not move focus. The icon inside is decoration: the default icons carry `aria-hidden`.
- The arrow is `aria-hidden`. Its rotation is pure CSS from `aria-expanded` and `data-placement` (see State Attributes).
- `Trigger` subscribes to `positionStore.upward` (see Dropdown Position) to set `data-placement`.
- Accessible name: `aria-label` or `aria-labelledby` from the consumer (see Public API), otherwise the placeholder as `aria-label`. A `<label htmlFor>` cannot name it: a `div` is not a labelable element, so the `id` prop is for `aria-labelledby` of other elements, tests and anchors. `required` adds `aria-required`.
- `aria-controls` points to the listbox id (`${selectId}-listbox`, set in `Dropdown`). `aria-activedescendant` is the DOM id (`optionDomId`) of the highlighted option while the list is open, otherwise it is absent. It is read from `highlightStore` with a selector that returns the id string, so `Trigger` re-renders only when the active option changes, and its `memo` children do not.

## Form Field

`trigger.jsx`, `FormField`: with `name` or `required`, the Select takes part in a native `<form>`.

- One `input.rac-input` per selected value inside the root, all with the same `name` (`FormData.getAll(name)` reads a multiple value). The value is `original` as text; objects are sent as JSON (`toJSON`, non-throwing). An empty single Select sends one empty field (`name=`), like a native `<select>` on an empty option; an empty multiple Select sends nothing, like `<select multiple>`.
- `required` goes onto the first input, so an empty Select blocks the submit and the browser shows its bubble. An empty multiple Select renders one empty field for that. `disabled` disables the inputs: they are not submitted and not validated, as for native controls.
- The inputs are real (not `type='hidden'`, which never validates, and not `readOnly`, which is barred from validation): absolutely placed over the root, `opacity: 0`, `pointer-events: none`, `tabIndex={-1}`, `aria-hidden`, with a no-op `onChange`. The bubble points at the Select. When the browser focuses an invalid input, it hands the focus to the combobox at once.
- Gotchas: `form.reset()` does not reset the Select (an uncontrolled `defaultValue` is not restored). A value without an option (virtual) is submitted as well.

## Dom Ids

`utils.jsx`, `optionDomId(selectId, optionId)`: the one format for the DOM ids of options and group headers. `OptionItem` and `GroupHeader` use it for `id`, `Trigger` for `aria-activedescendant`, and the group containers for `aria-labelledby`, so all of them always match.

- The option id is escaped, not cleaned: ASCII letters, digits and `-` stay, every other character becomes `_<code point in base 36>_` (`jsx-a b` → `jsx-a_w_b`). `_` itself is escaped, so the mapping is injective: different option ids always give different DOM ids. `selectId` (from `useId`) contains no `-`, so the first `-` separates it and ids of two Selects never collide either.
- Why: the old `makeId` lowercased and dropped characters, so `id='A'` / `id='a'`, `a.b` / `ab` or a repeated `a` (`a~1`) and `a1` got one DOM id, and `aria-activedescendant` pointed at the wrong row. Group headers used their raw name as `id`, not scoped by the Select: two Selects with the same group names repeated ids, and a name with spaces was no valid id.
- Deterministic: the same option id gives the same DOM id on every render and on the server, so SSR markup and ARIA references stay stable.

## Chip

`chip.jsx`. `Chip` is the Presence child: an x-axis `Collapse` with `fade` (`.rac-chip-slot`, `data-id` = the option id, `unmountOnExit={false}`), plus a `rac-spacer` row break after it while Chip Hold says so. `SelectedItem` is the chip itself (`.rac-chip`).

- The delete control is a `Collapse as='button'` (`.rac-chip-del`) named `${texts.remove} ${name}`, with `tabIndex={-1}`; Backspace is its keyboard path. Its inline-or-overlay placement comes from CSS through the root's `data-deleting` / `data-inline-delete`, not from inline style. Two independent props: `deleteInline` picks where it sits (inside the chip, which widens, instead of over its end), `deleteAlways` when it shows (always, instead of on hover; swipe and delete mode show it either way). Only inline-on-hover buttons share one `group` (outside delete mode, see Collapse Group); inline-always buttons are plain chip width and need no reserve. Without `icons.remove` there is no delete control at all: no button, no Backspace, no long press.
- `.rac-chip-slot` stays a separate element around `.rac-chip`: the slot is the animated box, the chip is the styled one (margins, shake, hover color).
- The slot carries `data-id`, not `id`: option ids are not unique across Selects on one page, and a DOM `id` could also collide with the page's own ids and styles.
- `Chip` reads its break flag from `chipStore` (`breaks.includes(id)`), not from a prop: a leaving chip is a frozen Presence element and never gets new props, but it may still have to own a break.
- The chip shows the option's text in `.rac-chip-text` (the element that truncates, see Trigger Width), or with `valueAsOption` its content plus its `className` and `style` (see Option Content).
- One `chipStore` subscription in `SelectedItem` returns two bits: hovered and swiped.
- While the Select is not `active` (disabled or no options), chips are `locked`: no hover, touch or click handlers, and the delete button is shown only with `deleteAlways`, as a `disabled` button, so the chip widths and rows stay put.
- Hover has no delay. `mouseenter` takes the hover at once; a leave clears it only if it still belongs to this chip, because a neighbour may already have taken it over. No delay is needed: a hovered chip only grows to the right (its button is at its end), and a closing button to its left shrinks it back by at most as much, so the chip never slides out from under the pointer, and hover cannot flicker. Hover works during a hold as well: the reserve is part of the held rows.

## Touch Delete

`chip.jsx` + `useChipLayout.js`. Delete mode is the touch alternative to hovering a chip.

- A long press (`LONG_PRESS_MS`, 600 ms) on a chip enters delete mode (only while `icons.remove` is on): `setDeleting(true)`, the select takes focus, the list closes, and the device vibrates if it can. A move of more than `JITTER` (10 px) cancels the pending long press, so a trembling finger still gets it; `touchcancel` cancels it too.
- A horizontal swipe of more than `SWIPE` (30 px) to the left reveals the chip's delete icon; a swipe back hides it.
- `touch-action: pan-y` on `.rac-chip`: the browser keeps vertical page scrolling and hands horizontal moves (the swipe) to the chip. The old `none` froze the page for any touch that started on a chip, which in a full trigger is almost every touch.
- In delete mode (`data-deleting` on the root), every chip shakes (not under `prefers-reduced-motion`) and shows its delete icon, and a tap removes the chip. The tap that ended the long press itself is ignored.
- Delete mode keeps the dropdown closed and cancels any hover. It ends by itself once the last chip is gone or the Select stops being `active`, and a click on the trigger or a blur also ends it.

## Chip Layout

`useChipLayout.js`: the layout state of the chip area. `useChipLayout(chips)` takes the chips `Value` renders (`selectedIDs`, or none while the title is shown).

- `layout` runs in a layout effect when the chips or the delete reserve change, on every `ResizeObserver` callback of `.rac-value`, and when a web font finishes loading (`document.fonts` `loadingdone`: a font swapped in after the first paint changes chip widths without resizing `.rac-value`). It re-freezes a running hold, drives the root height (see Value Height) and, at rest, sets the resting breaks (see Delete Reserve).
- The current chips and reserve are passed to `layout` through `holdRef`, written by the effect itself, not read from the effect event's closure: in React 19.2 an effect event called from a layout effect of the same commit still sees the previous render's values.
- Rows are grouped by vertical overlap (`rowsOf`): a slot starts a new row when its top is at or below the bottom of the row so far. Equal `offsetTop` is not a row test: with `align-items: center`, a shorter chip (or a tall JSX chip) in the same row has a different top.
- Chips are found as the `.rac-chip-slot` children of `.rac-value` (`SLOT`), identified by `data-id`.
- `chipStore` holds hover and swipe (`hoverId`, `swipedId`) and the break state (`held`, `breaks`). Each subscriber selects a primitive, so only the chips involved re-render.

## Chip Hold

`useChipLayout.js` + `chip.jsx` + `trigger.jsx`: chips animate their width, yet no chip ever changes rows in the middle of an animation. Rows change only in discrete steps, and each step is animated as a move (FLIP).

**Why it is hard.** In a wrapping flex row, a chip whose width animates reflows everything after it on every frame. A growing chip at 0 px fits at the end of a full row, then wraps once it grows. A shrinking chip in the middle pulls the tail of its row left, and as soon as the gap is wide enough, the first chip of the next row jumps up, then the next row's first chip, and so on. The old spacer logic patched two of these cases with a px-wide spacer computed once from the widths, so it broke with several rows, several animations at once, or a chip leaving while it owned the spacer.

**Hold.** When the chip list changes while a Collapse is animating, the layout is *held* (`freeze`):

1. `ghostRows` clones `.rac-value` into an invisible ghost (same classes, same height, an end padding of the delete reserve) and lays it out in the flow, in place of `.rac-value` (see Trigger Width), so ancestor selectors apply and the ghost gets the width the Select will have. A clone carries no Web Animations, so every chip in it has its full natural width: entering chips already grown, leaving chips not yet shrunk, finite CSS animations finished. The browser wraps that ghost itself, so there is no width math.
2. Row ends of the ghost become `breaks`: a `rac-spacer` after the last chip of every row but the last. The break is `flex-basis: 100%`, `height: 0`, plus 1 px of end margin: its own zero-height line that nothing can join. Without that 1 px, a chip that has collapsed to exactly 0 px still fits next to a 100% break, joins its line and gives it a height, which pushed every lower row down.
3. During the hold every chip is no wider than in the ghost (growing chips have not reached their width, leaving ones only shrink), so no row can overflow, and the breaks keep any row from pulling chips up. The rows stay exactly as in the ghost for the whole animation.
4. A change during a hold runs `freeze` again. The ghost is rebuilt with the breaks derived from the *held rows* (ids, `holdRef.rows`), not the breaks in the DOM: a break owned by a chip that has moved (a re-added leaver) would otherwise move with it. Held rows can split (a chip inserted in the middle overflows its row), never merge.
5. While held, `Presence` keeps collapsed leavers mounted (`hold`, chips use `unmountOnExit={false}`): a 0 px chip still holds its row's height, so a row made only of leavers does not vanish under the rows below it.
6. A width change of `.rac-value` during a hold (the `ResizeObserver`), a change of the delete reserve or a font swap runs `freeze` again.
7. Clearing (or `selectedText` hiding the chips) holds the rows too: the leavers' rows are kept while the title grows at the start of the first row. That row does not overflow: the title is at most the row width (it is truncated, see Trigger Width) and grows while the row's chips shrink, so their sum stays between the two. The title and the chips are not in one `group`, so this holds only as far as their animations start on the same frame. Without the hold, the shrinking leavers would pull each other up row by row.

**Release.** Every chip and title Collapse calls `settle` when it finishes. `settle` does nothing until no Collapse animation is running among the `.rac-value` children (`isBusy`: script animations only, not CSS ones, not FLIPs; a delete button inside a chip is not a child, so a hover never delays a release). Then it reads the chip positions, replaces the breaks with the resting ones (none, or the reserve rows of Delete Reserve) and drops the leavers in one `flushSync` commit (Presence drops them in the same render), and FLIPs every chip that moved: a `transform` animation from the old position, `id: 'rac-flip'`. Rows pulled up after a removal slide into place, and the root height animates by itself (see Value Height).

**Discrete moves at change time.** Some commits move chips at once: a chip inserted in the middle pushes the tail to the next row, a re-added leaver moves to its new place, a controlled `value` reorders. `Snapshot`, a class component in `Value`, records the chip positions in `getSnapshotBeforeUpdate`, which is the only React hook that runs before DOM mutations. After the commit, and after the new breaks are rendered (`breaks` in the layout effect equals the store), every chip that moved is FLIPped from its recorded position. A running FLIP is cancelled first; the recorded position already includes its transform, so a new move starts where the chip is on screen.

**Gotchas.**
- No hold without animations (no `element.animate`, as in jsdom): nothing would ever release it.
- The title is removed from the ghost: it is leaving whenever chips enter (and entering whenever they all leave), at the start of the first row, and its size change offsets theirs.
- A `row-gap` on `.rac-value` shows up once more per break (each break is a flex line of its own and takes a gap): during an animation, and always with inline-on-hover delete buttons. Use `.rac-chip` margins for spacing.
- Touch delete mode opens every delete button at once, inline. That widens chips outside any hold, so entering and leaving delete mode still reflows the rows in steps.

## Delete Reserve

`useChipLayout.js` + `chip.jsx` + `motion.jsx`: with `deleteInline` (and no `deleteAlways`), hovering (or swiping) a chip opens its delete button inside the chip, and the chips after it on its row slide right to make room. Nothing ever changes rows, and the Select never changes height.

- **Reserve by layout, not by an element.** Every row is laid out as if `.rac-value` were narrower by the button width D: `ghostRows` gives the ghost an extra end padding of D, with the delete buttons removed from it. A padding, not a smaller width: a Select sized by its content grows by D for the ghost, so a single row that fits stays single (see Trigger Width). The row ends found there become breaks, the same `rac-spacer` breaks as in Chip Hold, but kept at rest too (`restBreaks`). Each row therefore always has D of free space at its end, enough for one open button.
- **No feedback loop.** The ghost drops every break and every button before it measures, so the rows depend only on the chips' own widths and the Select's width, never on the breaks or buttons already on screen. The old element-based spacer (`rac-del-spacer`, a min-width D inside the row-end chip's slot) changed the very layout that decided where it went. It could push its chip to the next row, move to the previous chip, and end up between the last two chips of a row. Its mount animation always lasted 300 ms, whatever the `duration`.
- **One open button per row.** Hover and swipe are single ids, so at most one button is targeted open. The buttons share a `Collapse` `group` (see Collapse Group), so while buttons hand over, their widths in a row add up to at most D in every frame. The old design shrank the spacer with a CSS transition and grew the button with WAAPI. The two reverse differently when interrupted and start about a frame apart, and chaotic hovering overflowed the row.
- **Rounding slack.** The ghost is `SLACK` (0.25 px) narrower still, because Firefox's per-button rounding can push a handover a few app units past D (see Collapse Group). 0.25 px is 15 app units, and each member adds at most half of one. A row filled to within 0.25 px of the limit therefore breaks one chip earlier, which is invisible and stays stable. Without the slack, such a row wrapped its last chip for a frame now and then, and the root started a height animation. A consumer border on `.rac-chip-del` may not be covered: Firefox snaps thin borders to whole device pixels, which can exceed the slack mid-animation.
- **Measured from the real button.** D is the full box (width plus margins) of a hidden `button.rac-chip-del` probe with the real `icons.remove`, rendered once inside `.rac-value`, so consumer padding, borders and margins on `.rac-chip-del` count. The old probe measured only the icon.
- **Inside a hold.** The held rows are measured at `width − D` as well, so hovering stays safe while chips enter or leave, and a chip removed through its own open button (its slot starts as chip + D) still fits its row.
- **When.** The reserve applies with `deleteInline`, without `deleteAlways`, with an `icons.remove`, outside touch delete mode (there, and with `deleteAlways`, every button is already open and nothing changes on hover). Overlay mode (the default) needs none: its buttons are absolutely positioned.
- **Gotchas.** A chip wider than the row minus D truncates its text further while its button is open. In a Select sized by its content, the root widens by D while a button is open, since nothing reserves that width at rest. Chip width changes that resize nothing and are not a font swap (a consumer restyling `.rac-chip` at runtime) are picked up at the next chip change.

## Options Panel

`dropdown.jsx`, `Dropdown`: the dropdown panel. It is a `position: absolute` portal into `document.body` (or `container`), a `Collapse` on the y axis (with `fade` when `animateOpacity`). Inside it are the `role='listbox'` element (with `id` `${selectId}-listbox` and `aria-multiselectable` when `multiple`), the `OptionList`, and, in auto-loading mode (`hasMore` without `loadButton`), the loading footer. `Dropdown` owns `panelRef`, which is passed to Collapse as `nodeRef`, and it positions itself (see Dropdown Position).

- The custom properties (`--*` keys) of the Select's `style` prop are copied onto the panel; other keys stay on the trigger. Because the panel lives outside the trigger's DOM, this lets a consumer theme the list from one place (`style={{'--rac-bg': …}}`). `--rac-duration` and `--rac-ease` (from `duration` and `easing`) are applied after them, as on the trigger.
- Only `position: absolute` and `pointer-events` are inline (the panel's mechanics; `none` while closing, so the collapsing panel catches no clicks). `z-index` and `box-sizing` live in `.rac-options`, where a consumer can change them.
- The panel carries `data-placement='top'|'bottom'`, the same value as the trigger, so a consumer can style it by side (corners, shadow, `transform-origin` for their own effects).
- The status row at the end of the list: with `error`, `.rac-option[data-error]` with `texts.error`; otherwise, with `loading` or in auto-loading mode, the loading footer `.rac-option[data-loading]` with `texts.loading` or `texts.loadingMore` and the shared `dots` (see State Semantics). The listbox is labelled by `texts.list`.
- The closed panel unmounts after its exit animation; `keepMounted` keeps it in the DOM, collapsed.
- `container` (`portalTarget`): an element, or a function returning one (called on every render of the panel), else `document.body`. Needed inside modals and focus traps (Radix, MUI, Headless UI), which treat a click in `document.body` outside their content as an outside click and close. A function returning a still-empty ref falls back to `document.body` until the next render; a callback ref kept in state is the reliable form.
- `onEntered` calls `setListReady(true)`, so the list is marked ready only after the open animation has really finished.
- `Dropdown` is `memo` with no props, and `Select` renders it next to `Trigger`, so it re-renders only through its contexts.

## Dropdown Position

`dropdown.jsx`, `useDropdownPosition`: the one source of truth for where the panel goes.

- While closed, it estimates from the last known list height (or `--rac-list-max-height`, default 250px), so the trigger arrow already points the right way before opening. An `IntersectionObserver` keeps that estimate fresh without a scroll listener.
- `--rac-list-max-height` is registered with `@property` as a `<length>` (in `base.css`), so its computed value is always in px and any unit (`20em`, `50vh`) is read right. An invalid value falls back to the initial 250px. Without `@property` support, only px values are read correctly.
- While open, it writes `width`, `left` and `top` / `bottom` straight onto the panel element (`place`). The panel is `position: absolute`, so the values are page coordinates: `rect.left + scrollX`, `rect.bottom + scrollY + offset` (upward: `innerHeight - rect.top - scrollY + offset` as `bottom`). Scrolling the page then moves the panel with the select without any update. A capturing scroll listener (scrolling any inner ancestor moves the select), a `resize` listener, a `ResizeObserver` on the select and the panel, and a `MutationObserver` on `document.body` (DOM changes outside the select and the panel, checked before paint) re-place it, one frame at a time while it keeps moving. An `IntersectionObserver` toggles `data-offscreen` on the panel while a scroll ancestor clips the select.
- **Placed before it is measured.** The listbox has a callback ref (`listRef`) that places its parent, the panel. React attaches refs child-first in the layout phase, so this runs before the layout effect of the panel's `Collapse`, which measures the open height. Placed only in `useDropdownPosition`'s own layout effect (a parent effect, so after Collapse's), the fresh panel was measured at its shrink-to-fit width: with long wrapping options the open animation ran to a wrong height and snapped at the end. `listRef` changes with `open`, so a `keepMounted` panel is placed again on every open.
- **Containing block.** An ancestor that is positioned, or has a `transform`, `filter` or `contain` (a modal body centered with `translate(-50%, -50%)`, set as `container`), becomes the containing block of the `absolute` panel, so the page coordinates no longer match. `shift` reads where the panel really landed (minus its margins) and corrects `left` and `top` / `bottom` by the difference, so the panel sits at the trigger in any container. A scaled container is not compensated.
- Without `ResizeObserver` / `IntersectionObserver` (jsdom in consumer tests) the observers are skipped; the scroll and resize listeners still work.
- It opens upward only when the list does not fit below and there is more room above.
- The result (`upward`) lives in a small store, `positionStore`, that `useSelect` creates and `Select` puts into the config context next to `highlightStore`. The hook writes to it, and both the panel and the trigger arrow subscribe to it. Layout measurements do not go through React state, and the hook stays private to `dropdown.jsx`: the Fast Refresh lint rule forbids exporting a hook next to a component.

## Server Render

The Select must render to HTML on the server (Next.js, Remix, `renderToString`) and then hydrate on the client without a mismatch.

- Both bundles start with `'use client'` (a Rollup `banner` in `vite.config.js`, see Package Build), so a Next.js server component can import the Select. `defineOption` components still have to be declared in a client module.

- `Dropdown` reads a `client` flag through `useSyncExternalStore(noSubscribe, () => true, () => false)`. On the server and during hydration it is `false`, so the portal (`document.body`) is not rendered. In a client-only app (`createRoot`) React never calls the server snapshot, so the flag is `true` on the first render: no extra render and no delay there.
- After hydration React re-renders `Dropdown` once with `true`, and the panel mounts. The server HTML never contains the panel, even when `open` starts `true`; the trigger itself is complete in the HTML.
- `useDropdownPosition` gets `open: visibility && client`, so its layout effect re-runs when the panel appears and positions it. Without that, a panel that is open at hydration would stay unpositioned.
- The whole option model (array `options` and JSX options alike) is built during render, so the server HTML already has the right title, chips and enabled state. Nothing switches after hydration.
- DOM ids come from `useId` and from option paths (see Dom Ids, JSX Options), so the server and the client produce the same ids and ARIA references.

## Option List

`optionList.jsx`: `OptionList`, `OptionItem`, `GroupHeader`.

- `OptionList` builds the list structure from `normalizedOptions`: plain options, group headers, and one collapsible `Collapse` container per group. The result is memoized on the model, the selection, `expandedGroups` and `multiple`.
- The highlight is not an input of `OptionList`. Every `OptionItem` subscribes to `highlightStore` with a selector that returns one of three modes (none, highlighted, highlighted and ready), so a highlight change re-renders only the two affected options.
- `OptionItem` and `GroupHeader` are `memo`, and their props are primitives or model objects that keep their identity (see Option Model).
- Row content (`optionContent`, see Option Content): the option's own JSX (`<Option>` children) wins. Otherwise, with `renderOption`, a row that comes from real data (`'original' in option`: array items and JSX options, not the load-more row or empty/invalid placeholders) renders `renderOption(original, {selected, disabled})` inside `.rac-option-jsx`. Otherwise the text `name` in `.rac-option-text`.
- Row states are attributes, not classes (see State Attributes): `aria-selected`, `aria-disabled`, `data-highlighted`, `data-invalid`, `data-loading`, `data-bool`. `data-invalid` comes only from the model's `invalid` flag (a function in `options`), never from comparing the row text with `texts.invalidOption`. The checkbox (`.rac-check`, `data-default` without a custom `icons.checkbox`) shows its `.rac-checkmark` (`icons.check`) from the row's `aria-selected` (opacity and scale; the mark is absolutely centered over the frame or the custom checkbox icon).
- No `:hover` rule on rows: `mouseenter` sets the highlight, so pointer and keyboard share `data-highlighted`. A selected row that is highlighted has its own, stronger color, so the keyboard position stays visible on selected rows. A group header is `.rac-group` with `data-open` / `data-disabled` / `data-highlighted`; its arrow is the `.rac-group-arrow` Collapse itself.
- `useHighlighted(index)` is the one highlight subscription, shared by `OptionItem` and `GroupHeader`: a mode selector (none, highlighted, highlighted and ready) and the scroll into view once ready.
- Groups in ARIA: the `.rac-group-items` container is `role='group'` with `aria-labelledby` pointing at its header (`optionDomId`). The header itself has no role (a listbox owns only options and groups) and is not an option; when the keyboard highlights it, `aria-activedescendant` points at it and screen readers read its name. Its open state is visual only (`data-open`): ARIA has no expandable child of a listbox. A collapsed group's container is unmounted, so it is not in the tree.

## State Attributes

States are exposed as attributes on the element that has them, never as modifier classes. The one rule: an ARIA attribute where it is semantically exact, a valueless `data-*` flag (`flag()` in `utils.jsx`: `''` or absent) for the rest.

- Root: `aria-expanded`, `aria-disabled` (disabled or no options), `aria-busy` (loading or a pending `loadMore`), `data-error`, `data-empty` (no value), `data-deleting` (touch delete mode), `data-inline-delete` (`deleteInline`), `data-placement='top'|'bottom'` (panel side, also on `.rac-options`).
- The trigger reacts to hover only while interactive (not with `aria-disabled`); with `data-error` the hover keeps the red border. Cursors: `progress` while busy, `not-allowed` while inactive, `wait` while both.
- Why: the attributes are needed anyway for ARIA, a consumer styles open and error states with plain selectors (`.rac-select[aria-expanded='true']`), and the markup carries no `--open`/`--up` modifier pairs.
- Arrow: rotated `180deg` exactly when closed with the panel below, or open with the panel above. That is one CSS rule on `aria-expanded` and `data-placement`, so a custom `icons.arrow` needs no class.
- The full table is in the repo root `STYLES.md`.

## Styles Layer

`base.css` + `theme.css`, both imported by `index.js`. Everything is inside `@layer rac`, split into two sublayers declared in this order at the top of both files: `@layer rac.base, rac.theme;`.

- Any unlayered consumer CSS beats the library regardless of specificity, so overrides need no `!important` and no selector copying. A consumer using their own layers must declare `rac` first (`@layer rac, app;`); the sublayers stay inside it.
- **`rac.base`** (`base.css`) is what the Select needs to work: the flex layout of the trigger and the value area, `--rac-row`, button resets, the arrow and group arrow rotation, the loading dots, the chip mechanics (touch, the overlay or inline delete button, the `rac-spacer` breaks), the panel's `z-index` and scrolling, the checkbox frame and the checkmark reveal, cursors per state, icon image size, reduced motion. Motion that shows a state (arrow rotation, checkmark reveal) is base, because the animation is the product.
- **`rac.theme`** (`theme.css`) is the default look: colors, borders, padding, margins, typography, color transitions, the delete mode shake. Themes and presets are the consumer's choice; the theme is kept neutral and small.
- Tokens: the inputs `--rac-bg`, `--rac-fg`, `--rac-danger`, `--rac-success` are on `:root`. The derived tints (`--rac-tint-1..3`: 5, 10, 20% of `fg` over `bg`) and `--rac-muted` are declared on `.rac-select` and `.rac-options`, not on `:root`: a derived variable resolves where it is declared, so on `:root` it would ignore a `--rac-fg` set on one Select. Setting `--rac-fg` or `--rac-bg` on a Select (class or `style`) retints its trigger and, through `style`, its panel.
- Variables exist only for values shared by several rules, values read by JS (`--rac-list-max-height`) and values fed from props (`--rac-duration`, `--rac-ease`, inline on the root and the panel). Everything else is a plain property under its class.
- `duration` and `easing` drive every animation: Collapse and the chip FLIP and height animations read them from the config, CSS transitions read `--rac-duration` / `--rac-duration-fast` and `--rac-ease`. `--rac-duration-fast` is derived on `.rac-select` and `.rac-options` for the same reason as the tints. The looping indicators (`rac-blink`, `rac-shake`, `rac-busy`) keep their own period: they are not transitions.
- Reduced motion: `--rac-duration: 1ms !important` under `prefers-reduced-motion` (an important declaration beats the normal inline style that carries the `duration` prop), and the dots and the shake stop; the busy stripe becomes a static line.
- Keyframes are prefixed (`rac-blink`, `rac-shake`, `rac-busy`) so they cannot collide with the page's own.
- `renderOption` is a config prop: a new function identity re-renders every config reader (trigger, chips, rows). Consumers with large lists should pass a stable function (`useCallback` or module scope). It affects list rows, and the title and chips only with `valueAsOption` (see Option Content).

## Option Content

What the trigger shows for a selected option: `valueAsOption` (config prop, default `false`).

- Text mode (default): the title and the chips show `option.name`. The name comes from the model's label chain. For a `<Option/>` without `label` / `name` / `id` / `value` it is the text found in its JSX (`getText` in `select.jsx`, a pure walk over the element tree; strings and numbers only). With nothing at all (an image only) the name is `texts.emptyOption`, and `optionRecord` warns once in development.
- Rich mode (`valueAsOption`): `optionContent(option, renderOption, selected)` in `utils.jsx` is the one resolver, shared with `OptionItem`: the option's own JSX wins, otherwise `renderOption(original, {selected: true, disabled})` for real data, otherwise null (the text is used). The content sits in `.rac-option-jsx`, like in the list.
- The option's `className` and `style` go onto the chip (`.rac-chip`) and, in single mode, onto the title element (`.rac-title`). `.rac-option` itself is not carried over (hover, highlight, selected tint and the checkbox belong to rows), so shared rules are written as `.rac-option-jsx, .rac-chip {…}`.
- The model exposes `valueOption`: the selected option, or null when the title shows something else (`selectedText`, or no value, so a state text). `Value` uses it so the state texts never turn into option JSX. The title Collapse is keyed by `valueOption.id` in rich mode, by the text otherwise, so a changed selection still cross-fades.
- Gotchas: the chip cannot show different JSX from the row. Interactive content inside a chip conflicts with its click, swipe and long press. Each chip renders the content again, so heavy content costs more in big multiple selections. Like `renderOption`, `valueAsOption` is a config prop.

## Package Build

`vite.config.js` at the repo root. Check `dist/` and `npm pack --dry-run` after any change here.

- Two bundles: `dist/index.es.js` (`import`) and `dist/index.cjs` (`require`). The package is `"type": "module"`, so the CommonJS file must end in `.cjs`: Node reads a `.js` file there as ESM and `require` fails with `exports is not defined`.
- `external` is a pair of regexps (`react`, `react-dom` and their subpaths), so `react/jsx-runtime` is imported, never bundled. `dist` imports only `react`, `react/jsx-runtime` and `react-dom`.
- `'use client'` is the first line of both bundles (`output.banner`), before the injected CSS import.
- CSS: `vite-plugin-lib-inject-css` adds an `import './x.css'` to each ES module (`select.js` imports base and theme, `chip.js` imports `chip.css`), so bundlers load the CSS of the used modules by themselves; `"sideEffects": ["**/*.css"]` keeps it from being tree-shaken. The `cjs-output` plugin strips the CSS `require` from every CommonJS file, because plain Node and Jest without a CSS transform cannot `require` a stylesheet. The `style-css` plugin concatenates the emitted CSS into one `dist/style.css` (`@layer rac.base, rac.theme;`, then base, theme, chip: everything, chips included); CommonJS users, bundlers that skip CSS imported from JS and manual setups import `react-animated-select/style.css`.
- Types: `index.d.ts` serves `import`. The `cjs-output` plugin also emits a copy as `dist/index.d.cts` for the `require` condition: in a `"type": "module"` package TypeScript reads `.d.ts` as ESM types and rejects them for a CommonJS importer under `node16` resolution.
- npm ships only the `files` whitelist (`dist`, `index.d.ts`) plus `README.md`, `LICENSE` and `package.json`, which npm always adds. A root `.npmignore` would have no effect next to `files`, so there is none. `prepublishOnly` rebuilds `dist`.
