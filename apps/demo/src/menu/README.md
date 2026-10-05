# menu

## Mobile bottom bar

`nav.css` (`[DOC: mobile-bottom-bar]`), with `--rac-nav-h` / `--rac-nav-gap` and their consumers in `../rac.css`, the `theme-color` meta in `../../index.html`, and one line in `menu.jsx` (the tracking pause, below). Below 1024px the aside becomes a **floating pill** tab bar: `position: fixed`, centred (`left: 0; right: 0; margin-inline: auto`), `width: min(88%, 26.25rem)`, `height: 3.5rem`, `border-radius: 999px`, `bottom: max(var(--rac-nav-gap), env(safe-area-inset-bottom))`. The indicator pill (`.rac-menu-indicator::before`) is a stadium too, so it stays concentric with the bar's ends; that rule sits inside the `.rac-menu` block on purpose, because `.rac-pill::before` in `rac.css` comes later in the bundle and wins at equal specificity. The indicator is `100% / count` wide and moves by whole slots, so the items must be equal: `flex: 1` with `min-width: 0` (without it a longer label such as "Customize" widened its slot and pushed the indicator off centre).

The owner's devices differ by OS, which explains most of what follows: the **iPhone SE2 runs iOS 26** (Liquid Glass Safari, floating toolbar), the **iPhone XR cannot go past iOS 18** (iOS 26 dropped the A12). Observed on 2026-10-05 from the owner's screenshot (the glass accessory bar and floating address pill are iOS 26 UI).

### Why a floating pill: Safari 26 colours the area under its toolbar

Verified in WebKit source (`LocalFrameView::fixedContainerEdges`, `PageColorSampler.cpp`, `FixedContainerEdges.*`, `WKWebView.mm` `_updateFixedColorExtensionViews`):

- For each viewport edge WebKit hit-tests the middle of the edge **4px inside** the layout viewport, among fixed and sticky layers only, and walks up to the first `position: fixed/sticky` box. For the bottom edge that box must be **at least 90% of the viewport width**.
- If such a box is found and has a background colour, or **any `backdrop-filter`** on the walk, Safari hides its native glass ("scroll edge effect") under the toolbar and paints a **solid** colour extension instead (for a backdrop-filter: the page background, `underPageBackgroundColor`). Alpha below 0.75 is blended to opaque; 0.75 and above is forced to 1. There is no opt-out property.
- The old full-width bar at `bottom: 0` with a `backdrop-filter` qualified on every count, hence the flat slab the owner saw on the SE2.

- **The choice sticks.** `Page::updateFixedContainerEdges` (`Page.cpp`): when a new sample finds nothing on a side, WebKit keeps the element it found last time, for as long as that element has a renderer and `visibility: visible`. Only `visibility: hidden`, `display: none` or removal releases it (or a new page load). One frame of qualifying is enough for the slab to stay for good.

The pill stays 8px above the edge, so the hit test finds nothing and Safari keeps its native glass while our bar keeps its own blur. **Do not** bring the bar within 4px of the bottom, **not even for one frame**: on iOS 26 the 88% width is not a safe margin (main's ratio is 0.9, but shipped 26.x was reported with 80%, and the SE2 behaves like it), so the gap is the only guard. Hiding the backdrop in a `::before` or a child does not help (a child is on the walk; a pseudo-element is caught by the pixel-snapshot fallback). Closed overlays must use `display: none`, not `opacity: 0`, or they can count too (reported).

**The entrance.** The bar used to slide in from below (`--rac-enter-y: 100%`), which put it across the bottom edge during the first frames, and the backwards fill held it there through the delay. Safari sampled it then and, by the rule above, kept the slab until something hid the bar: the owner saw a solid fill after every load that turned to glass only after focusing a text field (2026-10-05, SE2, screen recording). The mobile entrance is now a fade with `--rac-enter-scale: 0.9` and no translate. Measured in headless Chromium from the first frame: the bar comes no closer than 7.7px to the edge (the bounce overshoot) and peaks at 88.8% of the width.

`theme-color` is not an input to this sampling, and Safari 26 on iOS ignores it for tinting (reported). It stays for iOS 15–18 Safari and Android Chrome. One value is enough: the site is dark-only (`color-scheme: dark`, the inline `html{background:#0a0a0f}`), no `media=` variants. It mirrors the inline `html` background and `body`'s `background-color`; change all three together.

The bar's own translucency: `backdrop-filter: blur(12px) saturate(180%)` (the `-webkit-` property first: Safari shipped the unprefixed one only in 18) over `color-mix(in srgb, var(--rac-surface) 72%, transparent)`, both inside `@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))` nested in `.rac-menu`. Without backdrop-filter the bar is the plain opaque `var(--rac-surface)`. Perf budget: `backdrop-filter` on a fixed element is GPU work every scrolled frame and an A13 is the floor; keep the radius at 12px, and if inertial scroll stutters on the SE2, drop `saturate(180%)` first, then the radius.

### Space reservation

- `--rac-nav-gap: 0.5rem` — the gap under the pill (also its `bottom` floor).
- `--rac-nav-h: calc(3.5rem + var(--rac-nav-gap))` — the **stable space the bar takes** above the bottom edge (64px). Consumers: `.rac-main { padding-bottom }`, `.rac-cat-eyes-container { bottom }` (the cat sits on the pill), `html { scroll-padding-bottom }`. The `3.5rem` is the bar's `height` in `nav.css`; the bar is `border-box` and `nav` / `.rac-menu-list` are `height: 100%`, so the border does not add to it (measured: 56px bar, 8px gap). Change the two numbers together.
- `--rac-nav-h` must never contain an `env()`: iOS reports `env(safe-area-inset-bottom)` as 0 with the toolbar expanded and ~34px once it collapses (home-indicator devices), flipping as the visitor scrolls, and every consumer would twitch. The inset reaches only the bar's own `bottom` through `max()`, like a native iOS 26 tab bar that sits above the home indicator. Accepted trade-off: while the inset exceeds the gap (XR, toolbar collapsed) the stable consumers under-reserve by up to ~26px, so the cat and the last pixels of the page sit behind the bar (`z-index` 10 over the cat's 9).
- `scroll-padding-bottom` only steers browser-driven scrolling (`scrollIntoView()`, fragments, focus). `pick()` scrolls by hand and compensates only the top (`- 20`), which is fine because it puts the target at the top.

### Hidden while typing: CSS `:has()`, not geometry

The bar must disappear while the soft keyboard is up (Apple HIG: a tab bar is hidden while a keyboard is displayed). The platform does **not** do it reliably on its own, contrary to what this file used to say:

- **iOS 26 Safari:** a WebKit bug leaves `position: fixed; bottom: 0` above or half under the keyboard's accessory bar, mostly when the toolbar was expanded at focus time (webkit.org/b/297779, rdar://159439271, Apple Developer Forums 800125; partly fixed in 26.1, still reported on 26.1 and the iOS 27 beta). Observed by the owner on the SE2, random.
- **Firefox for iOS** (bottom address bar): the app shrinks the WKWebView frame by the keyboard height (`adjustBottomSearchBarForKeyboard`, `BrowserViewController.swift`, verified in source), so the layout viewport itself shrinks and the bar always sits above the keyboard. Observed by the owner on the XR. `innerHeight` and `visualViewport.height` shrink together there, so a `visualViewport` threshold cannot detect it.
- iOS 18 Safari (XR) did hide the bar by itself; that is the only case the old "the platform does it" reasoning held for.

The rule (`nav.css`, `@media (pointer: coarse)` inside the mobile block): `body:has(<text entry>:focus) .rac-menu { visibility: hidden }`, where text entry is an `input` of a type that raises a text keyboard (not checkbox, radio, range, color, file, the button types, date, datetime-local, month, time), a `textarea` or a `[contenteditable]`, and in every case not `[readonly]` and not `[inputmode=none]`. In WebKit's source the iPhone keyboard is shown exactly for a focused element that can hold text without `inputmode=none` (`_shouldShowKeyboardForElement`, `WKContentViewInteraction.mm`), and the accessory bar's ✓ blurs the element, so on iOS focus and keyboard match. The library's hidden form anchor is `inputmode=none` and is excluded by the selector (the old JS guard misfired on it). No transition: a transition on `visibility` here once delayed the bar's reveal after `.rac-main[data-restoring]` was dropped. Without `:has()` support the bar simply behaves as before.

Why not the old JS guard (`focusin`/`focusout` + React state + `data-keyboard`): it re-rendered the whole menu subtree on every focus change and lacked the `inputmode=none` exclusion. The CSS rule does the same job with no state and no listener. Why not `visualViewport`: it fails in Firefox iOS (above) and on iOS 26 after the keyboard closes (`offsetTop` not reset, `visualViewport.height` ~24px short). The VirtualKeyboard API is Chromium-only.

Known edges: with a hardware keyboard on a touch device the bar hides with no soft keyboard showing; on Android, closing the keyboard with Back leaves the field focused, so the bar stays hidden until it blurs (unverified).

**Tracking pause.** `sync()` in `menu.jsx` returns early while `getComputedStyle(bar).visibility === 'hidden'`. Firefox iOS shrinks the viewport when the keyboard opens, the `-50%` `rootMargin` midline moves, and the section, the pill and the URL used to change under the visitor's fingers. Reading the bar's computed style keeps the "is typing" selector in one place (the CSS). It is also hidden while `.rac-main[data-restoring]` (the aside inherits it), where `sync()` already returns. After blur the viewport grows back, the observer fires again and tracking resumes; if nothing crossed the midline, the section was right anyway.

### Firefox iOS toolbar jumping: known, accepted

Firefox for iOS shows its toolbars instantly on every same-origin URL change (`handleURL` → `updateUIForReaderHomeStateForTab` → `scrollController.showToolbars(animated: false)`, `BrowserViewController.swift`, verified in source; github.com/mozilla-mobile/firefox-ios/issues/6375). `setRoute()` calls `history.replaceState` on each section change while scrolling, so the toolbar pops up at every section boundary; hiding it again resizes the web view, which can move the midline and change the section once more. Safari does not do this. The owner chose (2026-10-05) to keep the address bar in sync with the scroll position on every browser, for sharing, and to accept the Firefox behaviour. A milder option that still keeps the URL in sync, if it is ever revisited: write the URL only on `scrollend` (with an idle-timer fallback), so the toolbar pops once per scroll instead of mid-scroll. `document.title` does not trigger the toolbar.

### What still needs a real device

Nothing above was observed on a device after the change; desktop proof only (headless Chromium, 375×667 with touch emulation and focus emulation: bar 56px tall, 88% wide, 8px above the bottom, no horizontal overflow; hidden for focused `textarea`, `input[type=search]` and `contenteditable`; visible for `inputmode=none`, `readonly` and a checkbox, and on a 900px desktop without touch). Confirm:

- **SE2 / Safari 26:** the area under Safari's toolbar is glass right after a load and a reload, with no input focused first (not a slab); focusing "Ask a question" with the toolbar expanded and collapsed never leaves the bar over the keyboard; inertial scroll stays smooth with the blur.
- **XR / Firefox:** the bar is gone while typing, and the section / URL no longer change when the keyboard opens.
- **XR / Safari 18:** the pill sits above the home indicator with the toolbar collapsed, and how much of the cat it covers then.
- **Android Chrome:** the bar hides while typing; after Back-dismissing the keyboard it returns once the field blurs.
