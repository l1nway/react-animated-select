# react-animated-select

## 0.8.3

### Patch Changes

- 919645f: A failed submit no longer flashes the mobile soft keyboard: the hidden form fields ask for no virtual keyboard, while the validation bubble, `required` and the submitted value stay unchanged.
- 919645f: Touch delete mode now keeps the delete button placement `deleteInline` picks, instead of always forcing the buttons into the flow. With the default `deleteInline={false}` the buttons stay overlays over the end of each chip, keeping their tinted background, and the chips do not change width when delete mode starts.
- 919645f: Touch delete mode gives the chips the space the trigger's controls stop using. The clear button and the arrow collapse in place (a scale, not a width, so the layout moves in one frame while the picture of it animates) and the chip row takes their width for as long as the mode lasts, in every `deleteInline` / `deleteAlways` combination; the chips animate into the freed space and animate back when the mode ends. Entering and leaving no longer re-wrap a row mid-animation or fling a chip past the trigger.
- 919645f: Touch delete mode: a long press on a chip no longer flashes the options panel open and closed. The focus the long press takes is now raised after delete mode is committed, so the focus-opens-the-list rule sees it and skips, and the Select no longer reports a spurious `onOpenChange(true)` / `onOpenChange(false)` pair.
- 919645f: An `easing` that overshoots no longer opens the panel with a transparent strip along its bottom edge: the theme paints the background and the text colour on `.rac-options`, the box the open animation resizes, instead of on `.rac-list` inside it. A translucent `--rac-bg` is now painted once, not twice. If you shape `.rac-list` itself (its own radius, padding or outline), give `.rac-options` a matching shape, or the panel background shows around it.
- 919645f: A trigger clipped sideways by a scrolling container now gets a panel that spans only its visible part instead of its full width, so the panel can no longer reach past the right edge of the document and make the page scroll sideways.
- 919645f: Opening the Select no longer scrolls the page or any surrounding scroll container: the highlight scrolls the option list alone, and focus moves without scrolling.
