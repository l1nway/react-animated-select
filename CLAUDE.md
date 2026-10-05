# CLAUDE.md

Migration in progress: follow `MONOREPO_MIGRATION.md` (local file, not in git).

Reply to the owner in Russian. Code, comments and docs stay in English.

## Monorepo map

```
react-animated-select/                 git root, github.com/l1nway/react-animated-select
├─ package.json                        private, npm workspaces, root scripts, shared devDependencies
├─ package-lock.json                   one lock for both workspaces
├─ README.md, LICENSE                  canonical; copied into the package on pack (the copies are gitignored)
├─ TESTING.md                          test plan
├─ .changeset/                         config.json and pending changesets
├─ .github/workflows/                  ci.yml, pages.yml, release.yml, backend.yml
├─ scripts/                            copyMeta.js, checkPack.js
├─ packages/react-animated-select/     the npm package: src/, index.d.ts, vite.config.js, CLAUDE.md, FEATURES.md, STYLES.md, BUGS.md
├─ apps/demo/                          the demo site, https://l1nway.github.io/react-animated-select/ (CLAUDE.md, SYNC.md)
├─ apps/backend/                       the LLM backend, own lock, .env local only (CLAUDE.md)
└─ apps/sandbox/                       GITIGNORED: local stress playground, never pushed
```

Each workspace has its own `CLAUDE.md`; read it before working there.

## Commands

- `npm run dev`: the demo on http://localhost:5173/react-animated-select/, running the library source with HMR, against the local backend.
- `npm run dev:remote`: the demo against the production backend.
- `npm run dev:api`: the backend on port 3000.
- `npm run sandbox`: the local playground on port 5174.
- `npm run build`: the package, then the demo.
- `npm run lint`, `npm test`, `npm run check:pack` (the npm tarball holds exactly `package.json`, `README.md`, `LICENSE`, `index.d.ts` and `dist/**`).

Local development needs two terminals: `npm run dev` and `npm run dev:api`; optionally a third, `npm run sandbox`.

## General rules

- The package is published on npm. Treat every change as something that ships to real users.
- Do not make speculative, exploratory or "while I'm here" edits. Change only what the task asks for. When unsure whether a change is in scope, ask first.
- Do not refactor, rename, reformat or restructure code unless asked.
- Do not add dependencies (runtime or dev) without explicit approval.
- Never commit secrets. Secrets live only in `apps/backend/.env` (local) and in AWS; never in git or GitHub.
- Do not push, change GitHub settings, or touch npmjs.com or AWS without explicit approval.

## Published contract

- Keep the contract in sync with the code. If a task changes something the contract mirrors (a new or removed export, a prop, a build output file), update `packages/react-animated-select/index.d.ts` and the matching fields of `packages/react-animated-select/package.json` (`exports`, `files`, `main`, `module`, `types`) in the same change, and list those edits in the reply. Before finishing, check that `index.d.ts` matches the exports of `src/index.js` and the props of `<Select/>`.
- Do not change the contract on your own initiative: no new, removed or renamed public API, no changes to `peerDependencies`, `sideEffects` or `version` without explicit approval. A breaking change for consumers needs approval.
- `react` and `react-dom` are externals and peer dependencies. They are never bundled.
- The build (`npm run build -w packages/react-animated-select`, Vite library mode, `preserveModules`) outputs per-module ESM (`dist/*.js`, entry `dist/index.js`) and CJS (`dist/*.cjs`, entry `dist/index.cjs`), plus `dist/index.d.cts`. CSS is split per module and imported by the ES files; the CJS files have the CSS imports stripped. The combined `dist/style.css` (starts with `@layer rac.base, rac.theme;`, then base, theme, chip) is exported as `react-animated-select/style.css`.

## Releases

- Library source: `packages/react-animated-select/src`. Edit it directly; there is no sync step and no second copy.
- **Changesets.** A change to the published package (code, `index.d.ts`, `package.json` contract, root `README.md`) adds `.changeset/<kebab-slug>.md`, written by hand because the CLI is interactive:
  ```
  ---
  'react-animated-select': patch
  ---

  One line for the changelog, written for library users.
  ```
  Before 1.0: `minor` for a breaking change or a new feature, `patch` for a fix. Internal changes (tests, docs only, demo, backend) need no changeset.
- Never run `npm publish`, `changeset publish`, `npm version` or `git tag` by hand. Releases happen only by merging the "Version Packages" pull request that CI opens.
- The demo deploys to GitHub Pages on every push to `main` that touches the library or the demo. Backend-only pushes do not rebuild it.

## Links between workspaces

The library and the backend each relate only to the demo; the demo relates to both. The library and the backend never depend on each other (the backend only reads the library source to build its LLM context).

1. Working on the demo, a bug found in the library or the backend is always reported to the owner. It is fixed in place only with the owner's approval or on a direct instruction (then right away, so the context is not lost, following that workspace's `CLAUDE.md`). Otherwise it is recorded in that workspace's `BUGS.md`: `packages/react-animated-select/BUGS.md`, or `apps/backend/BUGS.md` (created with its first entry).
2. Working on the library, a change the site should reflect is made in `apps/demo` in the same change, or recorded in `apps/demo/SYNC.md`.
3. Working on the backend, a change that affects the demo is made in `apps/demo` in the same change, or recorded in `apps/demo/SYNC.md`.

For 2 and 3, if the task does not say which, ask the owner.

- `apps/sandbox` is local and gitignored: never reference it from tracked code. A scenario worth keeping becomes a test.
- `@l1nway/collapse` is a demo dependency only. The library never imports it; it keeps its own `motion.jsx`.

## Verify

`npm run lint`, `npm run build`, `npm run check:pack`, `npm test`.
