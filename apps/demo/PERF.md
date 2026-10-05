# Performance journal

One row per measured state of the site, written by `npm run perf -- --log "note"` (see CLAUDE.md, Performance). The table must stay the last thing in this file: the script appends to it.

- Values: medians of 3 cold loads. Mobile is CPU ×4 + slow 4G, desktop is unthrottled. Times are in ms.
- `M long`: the longest main-thread task on mobile. `CLS`: the worst of load and full scroll, both profiles, without the menu sub-list. `Idle`: main-thread ms over 5 s after the intro. `Entry KB`: gzip of the entry and its preloaded chunks.
- `Commit` is the monorepo commit; ending in `+` means uncommitted changes on top of it anywhere in the repo (library and backend included). Rows before the monorepo (`482c027`, `11a71da`) name commits of the old demo repo, kept in this repo's history under `apps/demo`.
- `Lib`: the library version, read from the workspace package (`packages/react-animated-select/package.json` through the root `node_modules`). It does not change with unreleased source edits, so the commit identifies the library code. Rows before the monorepo show the npm version the demo had installed.
- `Note` says what changed and why. If a value got worse, the note says why the change was worth it. Unexplained regressions get fixed, not logged.
- Run-to-run noise is about ±10 % on mobile times. Compare trends across rows, not a single run.

| Date | Commit | Lib | M FCP | M LCP | M TBT | M long | D FCP | D TBT | CLS | Idle | Entry KB | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-10-01 | 482c027+ | 0.7.5 | 2660 | — | 832 | — | 544 | 117 | 0.800 | 519 | 231.0 | baseline before the perf pass (one-off harness, single run) |
| 2026-10-01 | 482c027+ | 0.7.5 | 1428 | 1428 | 433 | 276 | 132 | 1 | 0.000 | 5 | 111.2 | perf pass: lazy parts, scroll restore, IntersectionObserver menu, framer and gsap out of entry |
| 2026-10-01 | 482c027+ | 0.7.5 | 1424 | 1424 | 502 | 280 | 148 | 7 | 0.000 | 2 | 111.6 | entrance: header and aside spring in with CSS keyframes; parts mount via startTransition without Suspense (no 300 ms reveal throttle on #hash loads); header excluded from scroll anchoring (fixes #dev restore). M TBT over budget: same tree gave 411–556 across runs, old deferred 478, entrance off 503, so it comes from the grown main content (1734 nodes), not from this change |
| 2026-10-01 | 482c027+ | 0.7.5 | 1448 | 1448 | 359 | 228 | 172 | 0 | 0.000 | 3 | 87.7 | first render inside startTransition. M long was the first commit: React render ~130 ms plus the first page layout ~170 ms (text shaping and font loading in a cold renderer) forced inside it by the header glyph measure; the render now yields, commit + layout ~230 ms. Also: #question reload jump fixed, #basic renamed to #usage |
| 2026-10-01 | 11a71da+ | 0.7.5 | 1452 | 1452 | 339 | 230 | 164 | 0 | 0.000 | 2 | 89.6 | subsections split into nested lazy parts; new sections forms, layout, performance, search, content, ssr; a11y, safety, states, multiple, styling, animations, debug extended; self-contained CopyButton; + path routes & per-section share pages |
| 2026-10-02 | 11a71da+ | 0.7.5 | 1436 | 1436 | 312 | 231 | 148 | 0 | 0.000 | 4 | 91.6 | styling presets (As styled from basic.css via ?snippet, bare Default via revert-layer, Aurora); SlideDown ported from the library Collapse (WAAPI, no framer); CodeMorph takes one code and morphs any change via @starting-style, tabs lock while it runs; perf.mjs closes Edge via CDP (leaked browsers had piled up to 379 processes and skewed D FCP to 204-252). Entry +2 KB vs last row: not isolated, the tree carries other uncommitted changes |
| 2026-10-02 | 11a71da+ | 0.7.5 | 1400 | 1400 | 279 | 212 | 136 | 0 | 0.000 | 4 | 91.7 | Global Select theme via --rac-bg/--rac-fg in basic.css (no per-Select classes), Usage styles moved out of rac.css, SlideDown measures under the clip (no margin jump) |
