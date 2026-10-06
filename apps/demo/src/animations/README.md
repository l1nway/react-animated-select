# animations

## Cat eyes

The cat peeking from the bottom-left (`catEyes.jsx`, data `cat-eyes.json`, styles `.rac-cat-eyes-container` in `rac.css`). It follows the pointer or the last tap in two dimensions.

- **Two channels.** Horizontal gaze is the Lottie playhead: frames `LEFT..RIGHT` (35..62) sweep the pupils across the iris, driven by a spring. Vertical gaze is not on the timeline (one playhead cannot carry two axes): the pupil layers carry the class `rac-cat-pupil` (`"cl"` in the JSON, lottie-web writes it to the layer `<g>`), and JS sets the CSS `translate` property on them (`0 Npx`, user units of the 1440x2560 composition). `translate` is separate from the SVG `transform` attribute that lottie rewrites every frame, so they do not fight. Without `CSS.supports('translate')` (Safari < 14.1, Chrome < 104, Firefox < 72) the cat tracks horizontally only.
- **Gaze vector.** `gaze()` takes the angle from the eye centre (`COMP.x`, `COMP.y`, composition units, read from the JSON: null position 578,2556 + 1.83 x the iris centres) to the pointer, and a strength that saturates at `REACH` x `innerWidth`. The eye centre is mapped to the screen through the `<svg>` box each frame, so the cat can be anywhere (desktop 10% wide, mobile 35% wide above the nav bar, or mid-slide while `bottom` transitions).
- **Pupil keyframes were edited.** In the original file the sweep (frames 35 and 62) ran along the top rim of the iris (y -85, iris centre -69.7), so a centred pointer looked "up and left". Those y values are now -69.68, the iris centre; the rest pose (frames 30 and 67) is unchanged. `LIFT` (24) is the vertical travel in composition units, about the horizontal travel (+-13 x 1.83).
- **Show and exit** play the authored animation with `lift` springing back to 0, so the intro and the sink are as drawn.
- The cat leaves 7 s after it starts tracking, whatever the pointer does (`setTimeout` in the effect).
- Verified on desktop Chromium (CDP: pointer at centre, above, right, above-right, frames inspected). Not checked on a phone: a tap is `pointerdown`, and `touchmove` follows the first touch.

## Cat preload

`lottie-react` (~51 KB gzip) and the two JSON files never load with the page. Two triggers fetch the player:

- **Eyes** (`CatEyes`): the player and `cat-eyes.json` start loading once `#playground` (a lazy part, so the effect waits for it through `subscribe`) comes within 1.5 viewports (`rootMargin: '150% 0px'`), above or below. The cat appears only when Playground crosses the midline (`menu.jsx`), so the player has 1.5 screens of scroll to arrive. On a fast fling or a menu jump it may arrive late: `Eyes` keeps running its timeline with no player, and the drawing catches up on the current frame once it loads.
- **Loading cat** (`LoadingLottie` in `start/question.jsx`): `focus` or `pointerdown` inside the question form. `pointerdown` is needed because a tap on the mic button does not focus it in iOS Safari.

Do not go back to a timer preload. The old 4 s timer competed with the first-screen chunks on slow 4G for a player used only at the bottom of the page.

## Lottie player

`lottieWith(loadData)` in `catEyes.jsx` builds both players (`EyesLottie`, `LoadingLottie`): `lottie-react` plus one JSON, loaded together by `load()`, which is also `Player.preload`.

- **No suspend once loaded.** `load()` stores the ready component (`ready`) when it resolves. A player that mounts after that renders it directly. One that mounts before renders the `React.lazy` version, which suspends. The choice is made once per mount (`useState`), so a re-render never swaps the element type and remounts the animation (the eyes keep `lottieRef` and their cached `svg` across re-renders).
- **Why.** `React.lazy` suspends on its first render even when the chunks are already loaded: its own promise is still pending. React 19 then holds the revealed content back by about 300 ms (Suspense reveal throttle). The loading cat's entrance (`animIcon.twist` in `start/components.js`) is a ~0.5 s spring, so the cat used to appear only once its motion was over, already in place. Measured in headless Edge, CPU ×4, with the chunks preloaded: the motion started 59 ms after submit, the svg appeared at 480 ms.
- **The animated box sits inside `Suspense`** (`question.jsx`, `[DOC: lottie-player]`), not around the player. Without a preload (slow network), the box mounts only with the player, so the entrance never runs empty.
- Now (same setup): the svg is there in the first frame of the entrance, preloaded or not. A preloaded cat shows up about 170 ms after submit (CPU ×4). Building the svg (`loadAnimation`) is part of that commit.
