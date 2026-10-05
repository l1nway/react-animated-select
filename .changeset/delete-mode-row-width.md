---
'react-animated-select': patch
---

Touch delete mode gives the chips the space the trigger's controls stop using. The clear button and the arrow collapse in place (a scale, not a width, so the layout moves in one frame while the picture of it animates) and the chip row takes their width for as long as the mode lasts, in every `deleteInline` / `deleteAlways` combination; the chips animate into the freed space and animate back when the mode ends. Entering and leaving no longer re-wrap a row mid-animation or fling a chip past the trigger.
