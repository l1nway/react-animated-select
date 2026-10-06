# header

## Header intro

The scramble of the title and description in `header.jsx`, styles in `header.css`. It runs once per visit, from a start state that is part of the prerendered HTML (`src/components/README.md`, Prerender).

**Markup**
- `h1` and `p` each hold a ghost (`.rac-scramble-ghost`, the real text, invisible, reserves the box and is what screen readers read) and an `aria-hidden` overlay (`.rac-scramble-text`, absolute, inset 0).
- Title overlay: one `.rac-lib-title` span per glyph, inside `nowrap` words. The span always holds the real character, so its width is the final glyph slot from the first paint and nothing needs measuring. Inside it, `.rac-lib-glyph` holds the scramble glyph as text, absolute over the slot, in the glyph colour (`--rac-glyph`, set per `data-color`).
- `data-glyphs` on the title overlay switches the glyphs on: the real characters turn transparent and the `.rac-lib-glyph` spans show. Without it (and always with reduced motion) the glyph spans are `display: none`, so they are neither painted nor copied.
- The start glyph of each position is fixed, not random (`(at * 11 + 5) % CHARS.length`, in `WORDS`). Random values in render would differ between the server and the client.
- Description overlay: it renders the full text with `data-intro`, which hides it.

**Sequence**
1. First paint (server HTML): start glyphs, empty-looking description. CSS only, under `prefers-reduced-motion: no-preference`. With reduced motion the same markup paints the final text.
2. The layout effect (hydration): it removes `data-intro` and empties the description, which looks the same. It sets `data-glyphs` again, for a StrictMode remount whose cleanup removed it. While restoring a deep link, or with reduced motion, it ends the intro at once instead.
3. Right after hydration, behind `afterPaint` (`src/components/README.md`, After paint: once the first contentful paint has happened, which on a real phone is long before hydration), it imports `gsap` and `ScrambleTextPlugin`. One timeline starts both tracks at 0: the title (`progress` 0 → 1, 1.5 s, own `draw()` writing the `.rac-lib-glyph` text, the real character once revealed, 15 % random flicker ahead of the reveal) and the description (`scrambleText`, 2.5 s). Before 2026-10-06 the description started 1.25 s after the title.
4. `finish()` removes `data-glyphs`. A failed import shows the final text at once.

**Do not**
- Do not draw the animated glyphs with `content: attr(...)` in a pseudo-element. Until 2026-10-06 the title did: `::before { content: attr(data-glyph) }`, with `draw()` changing the attribute value. WebKit (iOS Safari 18 and 26, Firefox for iOS) did not repaint the pseudo-element on a value change, only when the attribute was added or removed. The title froze on one frame and jumped to the final text at the end, while the description animated. Seen on the owner's iPhone SE2 and XR recordings. Desktop engines and headless Chromium repaint, so a desktop check cannot catch it. Text nodes repaint everywhere.
- Do not set the start state from an effect or write glyphs as text content. The prerendered first paint would show the final text, then the effect would flip it to garbage at hydration.
- Do not start the gsap import before the first contentful paint. Until 2026-10-06 it waited for the window `load` event, because it competed with the render-blocking CSS and the first-screen chunks on slow 4G (the intro started at ~1.7 s on the mobile profile). With the CSS inlined and the first screen prerendered, nothing it could delay is left after the paint, so the owner chose to start it at hydration (2026-10-06): the empty description is shorter. Before the paint, Lighthouse counts the request towards FCP.
- The description stays hidden until the scramble writes it. Showing the final text on the first paint would help Speed Index, but the owner rejected it (2026-10-06): it kills the intended intro.
- A scramble glyph wider than its slot overflows it without moving the layout. It is start-aligned, as in the old fixed-width spans, so `CHARS` needs no width filtering.
