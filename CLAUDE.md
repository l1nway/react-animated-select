# CLAUDE.md

## Project status — READ FIRST

This repository is a **finished, published npm library** (`react-animated-select`). It is **not a sandbox** and not a playground for experiments.

This repository is used to **prepare releases for publication to npm**. Treat every change as something that will ship to real users.

Rules:
- Do not make speculative, exploratory or "while I'm here" edits. Change only what the task explicitly asks for.
- Do not refactor, rename, reformat or restructure code unless asked.
- Do not add dependencies (runtime or dev) without explicit approval.
- Keep the published contract in sync with the code. If a task changes something that the contract mirrors (a new or removed export, a prop, a build output file), update `index.d.ts` and the matching `package.json` fields (`exports`, `files`, `main`, `module`, `types`) in the same change, and list those edits in the reply. Before finishing, check that `index.d.ts` matches the exports of `src/index.js` and the props of `<Select/>`.
- Do not change the contract on its own initiative: no new, removed or renamed public API, no changes to `peerDependencies`, `sideEffects` or `version` without explicit approval. A breaking change for consumers needs approval.
- Do not run `npm publish`, bump versions, create tags or push without explicit approval.
- When unsure whether a change is in scope, ask first.

## Build

- `npm run build` runs `vite build` (library mode, `vite.config.js`, `preserveModules`) and outputs per-module ESM (`dist/*.js`, entry `dist/index.js`) and CJS (`dist/*.cjs`, entry `dist/index.cjs`), plus `dist/index.d.cts`.
- CSS is split per module and imported by the ES files. The CJS files have the CSS imports stripped. The single combined `dist/style.css` (starts with `@layer rac.base, rac.theme;`, then base, theme, chip) is exported as `react-animated-select/style.css`.
- `react` and `react-dom` are externals and peer dependencies. They are never bundled.
- Publishing runs from `.github/workflows/publish.yml`.
