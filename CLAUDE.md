# CLAUDE.md

## Project status — READ FIRST

This repository is a **finished, published npm library** (`react-animated-select`). It is **not a sandbox** and not a playground for experiments.

This repository is used to **prepare releases for publication to npm**. Treat every change as something that will ship to real users.

Rules:
- Do not make speculative, exploratory or "while I'm here" edits. Change only what the task explicitly asks for.
- Do not refactor, rename, reformat or restructure code unless asked.
- Do not add dependencies (runtime or dev) without explicit approval.
- Do not change `package.json` fields (`exports`, `files`, `main`, `module`, `types`, `peerDependencies`, `sideEffects`, `version`) without explicit approval: they define the published contract.
- Do not change the public API or `index.d.ts` without explicit approval: it is a breaking change for consumers.
- Do not run `npm publish`, bump versions, create tags or push without explicit approval.
- When unsure whether a change is in scope, ask first.

## Build

- `npm run build` runs `vite build` (library mode, `vite.config.js`) and outputs ESM (`dist/index.es.js`), CJS (`dist/index.cjs`), CSS and `dist/index.d.cts`.
- `react` and `react-dom` are externals and peer dependencies. They are never bundled.
- Publishing runs from `.github/workflows/publish.yml`.
