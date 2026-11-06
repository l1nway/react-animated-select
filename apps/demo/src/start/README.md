# Start

## Textarea grow

The "Ask a question" field grows and shrinks with its text. `useGrow.js` (used by `question.jsx`), styles in `question.css` (`.rac-llm-grow`, `.rac-llm-input`).

- Markup: `.rac-llm-field > .rac-llm-grow > textarea`. The textarea always has its **final** height (set in px by `fit()` in a layout effect on every value change); the wrapper `.rac-llm-grow` clips it (`overflow-y: clip`) and its height is animated with WAAPI from the visible height to the final one. So the text never jumps (the textarea itself does not scroll to the caret while the box grows), and everything below the field (counter, status) follows the animated wrapper.
- `fit()` measures with `height: auto` + `overflow-y: hidden` (a scrollbar appearing during the measure would narrow the box and give a wrong `scrollHeight`). CSS `min-height` / `max-height` clamp the result; past the cap `data-scroll` turns `overflow-y: auto` on.
- Fast typing (Enter held, Shift+Enter spam, paste): a retarget while an animation still runs starts from the current visible height (`getBoundingClientRect` of the wrapper reads the animated value), uses `linear` easing and a duration equal to the time since the previous retarget (floor `MIN`), so the box catches up instead of restarting an ease-in each time. A calm single step is `EASE` over `BASE` + `PER_PX` per pixel, capped by `CAP`. If the target did not change (ordinary characters) the running animation is left alone.
- Width changes (window resize) re-measure instantly through a `ResizeObserver` on the wrapper; the first measure on mount is instant too. Reduced motion: instant.
- Why not the alternatives: `field-sizing: content` is not in Firefox and cannot be animated (`height: auto`); a `height` transition on the textarea restarts on every change and scrolls the text inside while it is smaller than the content; `grid-template-rows` cannot animate `auto`.
- `overflow-x: visible` stays on the wrapper because the `.--null` error shake moves the textarea sideways; `overflow-clip-margin` leaves room for the busy blur.
- Not verified in a real browser yet: tune `BASE`, `CAP`, `MIN` by eye.

## Api fallback

`useLLM.jsx` picks the backend URL per request. `VITE_API_URL` is the target; in `npm run dev` only, `.env.development` also sets `VITE_API_FALLBACK` (the deployed backend). Before each ask, `endpoint()` probes `VITE_API_URL` with a `no-cors` `fetch` (an opaque response is enough: it resolves if something listens, rejects on a refused connection); no answer within 1.5 s means the fallback. So the UI works without starting `npm run dev:api`, and a backend started later is picked up on the next question.

- Production and `dev:remote` have no fallback (`import.meta.env.DEV` is false in a build, and `.env.remote` sets no fallback variable).
- The deployed backend counts the developer's IP in its rate limits and spends real LLM quota.
