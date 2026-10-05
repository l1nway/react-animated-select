# animations

## Cat eyes

The cat peeking from the bottom-left (`catEyes.jsx`, data `cat-eyes.json`, styles `.rac-cat-eyes-container` in `rac.css`). It follows the pointer or the last tap in two dimensions.

- **Two channels.** Horizontal gaze is the Lottie playhead: frames `LEFT..RIGHT` (35..62) sweep the pupils across the iris, driven by a spring. Vertical gaze is not on the timeline (one playhead cannot carry two axes): the pupil layers carry the class `rac-cat-pupil` (`"cl"` in the JSON, lottie-web writes it to the layer `<g>`), and JS sets the CSS `translate` property on them (`0 Npx`, user units of the 1440x2560 composition). `translate` is separate from the SVG `transform` attribute that lottie rewrites every frame, so they do not fight. Without `CSS.supports('translate')` (Safari < 14.1, Chrome < 104, Firefox < 72) the cat tracks horizontally only.
- **Gaze vector.** `gaze()` takes the angle from the eye centre (`COMP.x`, `COMP.y`, composition units, read from the JSON: null position 578,2556 + 1.83 x the iris centres) to the pointer, and a strength that saturates at `REACH` x `innerWidth`. The eye centre is mapped to the screen through the `<svg>` box each frame, so the cat can be anywhere (desktop 10% wide, mobile 35% wide above the nav bar, or mid-slide while `bottom` transitions).
- **Pupil keyframes were edited.** In the original file the sweep (frames 35 and 62) ran along the top rim of the iris (y -85, iris centre -69.7), so a centred pointer looked "up and left". Those y values are now -69.68, the iris centre; the rest pose (frames 30 and 67) is unchanged. `LIFT` (24) is the vertical travel in composition units, about the horizontal travel (+-13 x 1.83).
- **Show and exit** play the authored animation with `lift` springing back to 0, so the intro and the sink are as drawn.
- The cat leaves 7 s after it starts tracking, whatever the pointer does (`setTimeout` in the effect).
- Verified on desktop Chromium (CDP: pointer at centre, above, right, above-right, frames inspected). Not checked on a phone: a tap is `pointerdown`, and `touchmove` follows the first touch.
