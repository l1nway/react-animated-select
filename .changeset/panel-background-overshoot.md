---
'react-animated-select': patch
---

An `easing` that overshoots no longer opens the panel with a transparent strip along its bottom edge: the theme paints the background and the text colour on `.rac-options`, the box the open animation resizes, instead of on `.rac-list` inside it. A translucent `--rac-bg` is now painted once, not twice. If you shape `.rac-list` itself (its own radius, padding or outline), give `.rac-options` a matching shape, or the panel background shows around it.
