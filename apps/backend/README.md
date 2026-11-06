# Backend

## Deploy to Oracle

Purpose: the repo is the only source of what runs in production.

Files: `Dockerfile` (the Express app), `docker-compose.yml` (backend + Caddy), `Caddyfile`, `bootstrap.sh` (one-time VM setup), `../../.github/workflows/backend.yml` (the pipeline).

Flow: a push to `main` touching `apps/backend/**`, `packages/react-animated-select/**` or the root `README.md` runs `build-data` on the runner (the `codebase` context needs the library source, so the library paths trigger it too), writes the commit to `REVISION`, rsyncs `apps/backend/` to `~/rac/` on the VM with `--delete`, runs `docker compose up -d --build`, then curls `https://$OCI_DOMAIN/`. `cat ~/rac/REVISION` on the VM tells which commit runs.

Contract:
- VM-only, never in git or in the rsync: `~/rac/.env` (`GEMINI_API_KEY`, `GROQ_API_KEY`, `LIMIT_*`, `DOMAIN`). The rsync excludes `.env*`, so `--delete` leaves it alone.
- GitHub secrets `OCI_SSH_KEY`, `OCI_KNOWN_HOSTS`; variables `OCI_HOST`, `OCI_USER`, `OCI_DOMAIN`. The API keys are never in GitHub.
- `TRUST_PROXY=1` is pinned in `docker-compose.yml` (Caddy is the only hop and overwrites `X-Forwarded-For`), so it overrides a stale `.env`.

Why:
- Push from CI over SSH, not a pull from the VM: one workflow, no agent on the VM, a failed deploy fails the run.
- The VM builds the image, so the same files work on ARM (Ampere A1) and AMD (E2 Micro). A swap file (`bootstrap.sh`) keeps `npm ci` alive on 1 GB.
- Host keys are pinned (`OCI_KNOWN_HOSTS`), not scanned at deploy time.
- A pull from a registry (GHCR) was rejected: the image needs `bundle.json`, which exists only after `build-data`, and a multi-arch build under QEMU is slow.

Traps:
- Two firewalls: the VCN security list (cloud side) and `iptables` on the Ubuntu image; `bootstrap.sh` handles only the second. Port 22 must stay open to the GitHub runners (key-only auth).
- Let's Encrypt needs the DNS A record pointing at the VM before Caddy starts; until then Caddy retries and logs errors.
- Counters in `src/limits.js` are in memory: every deploy resets the rate limits.
- `.agents` and `.env*` are excluded from the rsync and from the Docker context.
