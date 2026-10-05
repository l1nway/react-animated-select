---
'react-animated-select': patch
---

Touch delete mode now keeps the delete button placement `deleteInline` picks, instead of always forcing the buttons into the flow. With the default `deleteInline={false}` the buttons stay overlays over the end of each chip, keeping their tinted background, and the chips do not change width when delete mode starts.
