# Changesets

A change to the published package (code, `index.d.ts`, the `package.json` contract, the root `README.md`) adds one file here, `.changeset/<kebab-slug>.md`. Write it by hand; the CLI is interactive.

```md
---
'react-animated-select': patch
---

One line for the changelog, written for library users.
```

Before 1.0: `minor` for a breaking change or a new feature, `patch` for a fix. Internal changes (tests, docs only, demo, backend) need no changeset.

CI turns pending changesets into a "Version Packages" pull request (version bump and `CHANGELOG.md`). Merging it publishes to npm. Never run `npm publish`, `changeset publish`, `npm version` or `git tag` by hand.
