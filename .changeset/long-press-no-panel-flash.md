---
'react-animated-select': patch
---

Touch delete mode: a long press on a chip no longer flashes the options panel open and closed. The focus the long press takes is now raised after delete mode is committed, so the focus-opens-the-list rule sees it and skips, and the Select no longer reports a spurious `onOpenChange(true)` / `onOpenChange(false)` pair.
