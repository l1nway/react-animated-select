# Backend: knowledge queue and bugs

## Knowledge queue

Changes the "Ask a question" assistant must learn. Any session appends one short line here instead of editing the knowledge files; Gemini applies the whole queue in one batch (`KNOWLEDGE.md`, "Processing the queue") and moves the lines to Done.

Format: `- YYYY-MM-DD · docs | styling | prompts | codebase · what changed (source)`. One line, no explanations: the source holds the details.

- 2026-10-05 · docs · opening a Select never scrolls the page or any ancestor container; the highlight scrolls the option list alone and programmatic focus uses `preventScroll` (`packages/react-animated-select/src/README.md`, Highlight)
- 2026-10-05 · docs · the hidden form inputs carry `inputMode='none'`, so validating them raises no mobile soft keyboard; the bubble, `required`, `texts.required` and the submitted value are unchanged (`packages/react-animated-select/src/README.md`, doc-key `form-field`)
- 2026-10-05 · docs, styling · a trigger clipped sideways no longer keeps a full-width panel: the panel spans only the visible part and ends at the container's edge, and `data-offscreen` is now set when either axis is fully clipped (`FEATURES.md` Options panel in a portal, `STYLES.md` `data-offscreen`)
- 2026-10-05 · docs, styling · touch delete mode keeps the placement `deleteInline` picks (overlay by default, inline with the prop); it changes only *when* the buttons show, and `[data-deleting]` no longer makes `.rac-chip-del` relative or transparent (`FEATURES.md` Props `deleteInline`, `STYLES.md` `rac-chip-del`)
- 2026-10-05 · docs, styling · in touch delete mode `.rac-clear` and `.rac-arrow` stay mounted and keep their box, collapsing in place by `scale: 0` / `opacity: 0` / `visibility: hidden` / `pointer-events: none`, and in every mode the chip row takes their width through the internal `data-del-room` + `--rac-room` and the chips animate into the freed space and back (`STYLES.md` `data-deleting`, `data-del-room`, `--rac-room`, `rac-clear`)
- 2026-10-05 · docs · a long press entering touch delete mode no longer opens the options panel for a moment, and fires no `onOpenChange` pair (`FEATURES.md` Touch delete mode)
- 2026-10-05 · docs, styling · the panel background and text colour moved from `.rac-list` to `.rac-options` (an overshooting `easing` showed the page through the panel's bottom edge while it opened); `--rac-bg` / `--rac-fg` are the trigger and panel colours, and `.rac-list` shaped on its own needs a matching `.rac-options` (`STYLES.md` `rac-options`, `rac-list`, `--rac-bg`)

## Bugs

- **`npm audit`: 3 high vulnerabilities, dev-only.** `nodemon@3.1.14` (latest) pulls `chokidar@3` → `braces@3.0.3` (stack exhaustion on nested patterns); no patched `braces` for this chain exists. Not shipped to production. Option: replace `nodemon` with `node --watch` (Node 24, one fewer dependency); needs the owner's approval.
- **Gemini free-tier quotas are unverified.** Google publishes them only in AI Studio (Rate limits page). Unofficial figures: about 20 requests per day per Flash model, about 500 per Flash-Lite model. Read the real numbers there and adjust `ROLES` in `src/llm.js` if the codebase role runs dry.
- **Production is not deployed.** The code from 2026-10-05 (limits, model roles, knowledge base) runs only locally until the next deploy; `TRUST_PROXY` must be checked against the AWS topology first (`CLAUDE.md`, "Code and limits").

## Done

- 2026-10-05 · CORS limited to `https://l1nway.github.io` and `localhost` / `127.0.0.1` on any port (`ORIGINS` in `src/index.js`).
- 2026-10-05 · `axios` and the unused `@google/generative-ai` removed; `nodemon` raised to `^3.1.14` (audit: 14 → 3, dev-only).

- 2026-10-05 · invalid audio returns `400 {"error": "The recording could not be read"}` instead of 500 (`apps/demo/backend.md` #3).
- 2026-10-05 · dead models replaced (`moonshotai/kimi-k2-instruct`, `qwen/qwen3-32b`, `llama-3.1-8b-instant`, every `gemini-2.5-*`); every role has fallbacks.
- 2026-10-05 · the question goes as the user message, separate from the system prompt (prompt injection).
- 2026-10-05 · the knowledge base was rewritten for 0.8.1 (`documentation.md`, `styling.md`, prompts), in English.
