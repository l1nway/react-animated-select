# Library sync

Things the demo found that must change in the library (`..`, `react-animated-select`). The fix belongs to the library repo, never to the site. The library session reads this file, fixes, and marks entries done.

Checked against: `0.7.5` (npm package == `../dist`, 2026-10-01).

## Entry format

```md
### <short title>
- **Kind:** bug | api | docs | styles | perf | a11y | idea
- **Seen in:** demo section or file
- **Library:** file in `../src` or doc-key in `../src/README.md`
- **Now:** what happens (steps if it is a bug)
- **Expected:** what should happen
- **Demo workaround:** none, or what the site does meanwhile (and where, so it can be removed)
```

Statuses: an entry sits in **Open** until the library ships the fix, then moves to **Done** with the version (`fixed in 0.7.6`). Once the demo is updated to that version and the workaround is removed, delete the entry.

## Open

### Array objects and `<Option/>` report different value shapes
- **Kind:** docs
- **Seen in:** `start.jsx` (Usage: Array / JSX tabs)
- **Library:** `model.js` (`normalizeItem`, `original`), `useSelectModel.js` (`commit`); doc-keys `option-model`, `selection-identity`; `FEATURES.md` "Options as JSX or data"
- **Now:** for `options={[{value: 'pro', label: 'Pro'}]}`, `onChange` reports the whole object; for `<Option value='pro'>Pro</Option>`, it reports `'pro'`. A controlled `value` taken from one source does not select the same option of the other: with `value = {value: 'pro', label: 'Pro'}` and JSX children, the title shows `Pro` (a virtual entry) and no row has `aria-selected`. `index.d.ts` types `value` and `onChange` as `any` and nothing in the public docs says which shape comes back.
- **Expected:** the shape is stated where consumers look (README / `index.d.ts` comment on `onChange`): array items are reported as given (the object), `<Option/>` as its `value`. Optional idea: a way to get `item.value` from object options, so data and JSX sources are interchangeable.
- **Demo workaround:** the Usage demo resets the value when the tab changes and says in its description which shape `onChange` receives.

### Every Select forces a synchronous layout on mount
- **Kind:** perf
- **Seen in:** mobile trace of the demo (CPU ×4): the `features` part mount, and the first screen
- **Library:** `useChipLayout.js` (`layout` → `followHeight`, run from the `[chips, reserve]` layout effect); doc-key `value-height`
- **Now:** on mount, each Select reads `value.offsetHeight` and `getComputedStyle(root).height` inside a layout effect, even a single Select without chips. `memo.value` is still `0`, so nothing animates, but the first read forces layout of the whole freshly committed tree inside the React commit task. Traced: 90–131 ms of forced Layout (1217 of 2080 objects) when `features` mounts (about 13 Selects), and the first full layout of the page when no earlier code reads geometry.
- **Expected:** no geometry reads on mount. The first `ResizeObserver` callback (already set up in the next effect) delivers the initial size after the browser's own layout; `followHeight` only needs a value once there is a previous height to animate from. The same goes for `restBreaks` when there are no chips.
- **Demo workaround:** none.

### Open panel lags behind the trigger on mobile scroll
- **Kind:** bug
- **Seen in:** any demo on a phone (Usage, Features), open Select + fast swipe up and down
- **Library:** `dropdown.jsx` (`useDropdownPosition`: `position: fixed` panel, re-placed from a `scroll` listener); doc-keys `dropdown-position`, `options-panel`
- **Now:** on desktop the panel stays glued to the trigger. On mobile the page scrolls on the compositor thread, while `scroll` events and the `place` call run later on the main thread, so the fixed panel is drawn at its old viewport position for a frame or more and then catches up. A fast swipe makes the panel visibly trail the Select.
- **Expected:** the panel moves in the same frame as the trigger. When the portal container scrolls with the page (`document.body`), position the panel `absolute` in document coordinates (`rect + scrollX/scrollY`), so the compositor moves both together. Re-place from `scroll` only for nested scroll containers, or hoist the panel into the nearest scrolling ancestor.
- **Demo workaround:** none.

## Done

_None yet._
