# Library sync

Things the demo found that must change in the library (`..`, `react-animated-select`). The fix belongs to the library repo, never to the site. The library session reads this file, fixes, and marks entries done.

Checked against: `0.8.0` (npm `latest` == `../package.json` == installed; `../src` code == sandbox `src/rac`, but its `README.md` is behind the sandbox copy; 2026-10-04). Every entry up to 0.7.7 is closed in the sandbox `SYNC.md` (Done, 2026-10-02/03) and was removed here.

## Entry format

```md
### <short title>
- **Kind:** bug | api | docs | styles | perf | a11y | idea
- **Seen in:** demo section or file
- **Library:** file in `../src` or doc-key in `../src/README.md`
- **Now:** what happens (steps if it is a bug)
- **Expected:** what should happen
- **Demo workaround:** none, or what the site does meanwhile (and where, so it can be removed)
```

Statuses: an entry sits in **Open** until the library ships the fix, then moves to **Done** with the version (`fixed in 0.7.6`). Once the demo is updated to that version and the workaround is removed, delete the entry.

## Open

### Sortable chips: a plugin on top of chips, not a prop
- **Kind:** api
- **Seen in:** `src/plugins/multiple.jsx` (props table, `sortable` row)
- **Library:** sandbox `FEATURES.md` (Planned), `demo/FEATURES.md` (Reordering chips)
- **Now:** the plan contradicts itself: sandbox `FEATURES.md` says future features (sortable included) are plugins, but its sortable note and `demo/FEATURES.md` still say "behind a `sortable` prop". Same for virtualization and search ("a `virtual` prop", "a `search` prop"), which the demo now shows as planned plugins.
- **Expected:** per the author, reordering ships as a separate add-on plugin that works only together with `chips` (`plugins={[chips, sortable]}`), so it stays out of the bundle when unused. Same wording for `virtual` and `search`. Plugin names and the behaviour of `sortable` without `chips` (warn and ignore?) to be confirmed.
- **Demo workaround:** the Multiple table shows `sortable` as a planned plugin (`kind: 'soon'`, type `plugin`); `src/plugins/search.jsx` and `virtual.jsx` are Soon placeholders with a guessed `virtual` import. Replace them when the plugins ship.

### 0.8.0 shipped without plugin types
- **Kind:** api
- **Seen in:** `src/plugins/bundle.jsx`, `src/plugins/multiple.jsx`
- **Library:** `../index.d.ts`, `dist/index.d.cts`
- **Now:** the published 0.8.0 types have no `plugins`, `chips`, `paging` or `SelectPlugin`: TypeScript consumers get errors on `import {chips}` and `plugins={[chips]}`. The fix sits uncommitted in `../index.d.ts`.
- **Expected:** commit it, rebuild so `dist/index.d.cts` is regenerated, ship in 0.8.1.
- **Demo workaround:** none (the site is JS).

### No Plugins or migration docs in the package README
- **Kind:** docs
- **Seen in:** `src/plugins/bundle.jsx`
- **Library:** `../README.md`, `../src/README.md` (Package Build)
- **Now:** the package README says nothing about plugins or migrating to 0.8, although `multiple` without `chips` now looks different than in 0.7. `../src/README.md` is behind the sandbox copy (Plugins, Live Region, Popup, Fieldset Disabled and others missing; Forms still says `form.reset()` does not reset the Select), and its Package Build names `dist/index.es.js` instead of `dist/index.js` and never mentions tree-shaking.
- **Expected:** README sections Plugins and Migrating to 0.8; one merged `src/README.md` with Package Build fixed and a note that plugins are separate modules dropped when not imported (`chip.css` may still ship under esbuild because of `sideEffects`).
- **Demo workaround:** none.

## Done

_None._
