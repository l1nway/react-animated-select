# Backend contract

What the demo relies on in the "Ask a question" backend. The site takes its URL from the Vite env (`VITE_API_URL`): `http://localhost:3000/ask` in development (the local backend, `npm run dev:api` at the repo root; `VITE_API_FALLBACK` covers it not running, see `src/start/README.md`, "Api fallback"), `https://92.5.61.99.sslip.io/ask` (the Oracle VM) in production and in `npm run dev:remote`. The backend lives in `../backend` (`apps/backend`) of the same repo; its deploy is described in its `README.md` ("Deploy to Oracle"). Contract changes follow the cross-workspace rules in the root `CLAUDE.md`.

## Request contract (what the site sends)

- `POST /ask`, `multipart/form-data`, no auth headers, no cookies.
- Text question: field `prompt`, at most 2048 characters (trimmed, never empty).
- Voice question: field `audio`, one file, at most 60 s long:
  - `record.webm` with type `audio/webm;codecs=opus` (Chrome, Edge, Firefox, new Safari);
  - `record.mp4` with type `audio/mp4` (older Safari and iOS, which cannot record webm).
- Recording bitrate is 24 kbit/s (`audioBitsPerSecond` in `MediaRecorder`, about 3 KB per second, so 60 s is about 180 KB). Speech-to-text models resample to 16 kHz mono anyway, so quality is not affected.
- Expected answer: `200` with `{"answer": "<non-empty string>"}`.
- The site reads only the status code and `answer`:
  - `413` shows "The question is too long."
  - `429` shows "Too many questions in a row."
  - any other error shows "Something went wrong on the server."
  - a `200` with an empty or missing `answer` shows "No answer came back."
- The site gives up after 45 s. From 3 s on it shows a "server is busy" indicator.

## What the backend enforces

Details in `apps/backend/CLAUDE.md`.

- `413` for a `prompt` over 2048 characters or an `audio` file over 1 MB.
- `429` with `Retry-After`: one request in flight per IP, 5 per minute and 50 per day per IP, 2000 per day for everyone. The counters are in memory and reset on every deploy.
- `400 {"error": "The recording could not be read"}` for a file in `audio` that is not valid audio. The site shows its generic server message for it.
- Any `audio/*` type is accepted (only the part before `;` is compared); `webm`, `mp4` and `wav` were checked, spoken English and Russian are transcribed and answered.
- CORS allows only the site's origin and localhost; a new origin goes into `ORIGINS` in `apps/backend/src/index.js`.

## History

- Until 2026-11, the backend ran on AWS behind CloudFront and a WAF whose body-size rule blocked voice questions (bodies over about 8 KB) with a `403` that carried no CORS header. The move to the Oracle VM (Caddy, no WAF) removed both problems.
