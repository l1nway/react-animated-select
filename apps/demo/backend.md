# Backend issues

Problems the demo found while talking to the "Ask a question" backend. The site takes its URL from the Vite env (`VITE_API_URL`): `http://localhost:3000/ask` in development (the local backend, `npm run dev:api` at the repo root), `https://react-animated-select-backend.online/ask` (AWS) in production and in `npm run dev:remote`. The backend lives in `../backend` (`apps/backend`) of the same repo; its problems are fixed there or in AWS, not on the site. Contract changes follow the cross-workspace rules in `CLAUDE.md` (Library, backend and SYNC.md). Checked on 2026-10-01, against the AWS backend.

## Request contract (what the site sends)

- `POST /ask`, `multipart/form-data`, no auth headers, no cookies.
- Text question: field `prompt`, at most 2048 characters (trimmed, never empty).
- Voice question: field `audio`, one file, at most 60 s long:
  - `record.webm` with type `audio/webm;codecs=opus` (Chrome, Edge, Firefox, new Safari);
  - `record.mp4` with type `audio/mp4` (older Safari and iOS, which cannot record webm).
- Recording bitrate is 24 kbit/s (about 3 KB per second, so 60 s is about 180 KB).
- Expected answer: `200` with `{"answer": "<non-empty string>"}`.
- The site reads only the status code and `answer`:
  - `413` shows "The question is too long."
  - `429` shows "Too many questions in a row."
  - any other error shows "Something went wrong on the server."
  - a `200` with an empty or missing `answer` shows "No answer came back."
- The site gives up after 45 s. From 3 s on it shows a "server is busy" indicator.

## 1. Every voice question is blocked by CloudFront (critical)

- **Now:** any request body over about 8 KB gets `403` from CloudFront itself and never reaches Express. A real recording passes 8 KB after 2–3 seconds, so almost every voice question fails.
- **Evidence** (multipart upload with a random file in `audio`):

| Body | Status | `Server` | `Access-Control-Allow-Origin` |
|---|---|---|---|
| text `prompt` | 200 | nginx (Express) | `*` |
| 7 000 B | 500 | nginx (Express) | `*` |
| 8 000 B (8 202 B uploaded) | 403 | CloudFront | missing |
| 9 000 B, 20 000 B, 200 000 B | 403 | CloudFront | missing |

  - The 403 body is the CloudFront page "The request could not be satisfied. Request blocked." (`X-Cache: Error from cloudfront`, POP `WAW51-P2`).
- **Likely cause:** the AWS WAF web ACL on the CloudFront distribution uses the AWS managed Core rule set (`AWSManagedRulesCommonRuleSet`). Its `SizeRestrictions_BODY` rule blocks bodies over 8 KB. The threshold matches, but the WAF config itself was not seen from here.
- **Fix:**
  - In the web ACL, set the rule action override for `SizeRestrictions_BODY` to **Count**, or add a scope-down statement that excludes `/ask`.
  - Add a custom size rule for `/ask` instead, for example block bodies over 1 MB. That leaves room for 60 s of mp4 (Safari may ignore the bitrate hint).
- **Also hits text:** 2048 emoji or CJK characters are 6–8 KB in UTF-8 plus multipart overhead, so long non-Latin text questions can be blocked the same way.

## 2. CloudFront and WAF error responses have no CORS header

- **Now:** the WAF/CloudFront `403` has no `Access-Control-Allow-Origin`. The browser hides the real status and reports "CORS Missing Allow Origin", and `fetch` rejects as if the network were down. This is why the issue looked like an expired token.
- **Expected:** errors are readable from the site, so it can show the right message.
- **Fix:** give the WAF block action a custom response that includes the header `Access-Control-Allow-Origin: *`, and/or attach a CloudFront response headers policy with CORS to the `/ask` behavior. Check afterwards with `curl -i` that a blocked request returns the header.

## 3. Unreadable audio returns 500

- **Now:** a file in `audio` that is not valid audio returns `500 {"error":"Internal Server Error"}`.
- **Expected:** `400` (or `415` for an unsupported format) with a short message. A 500 should mean a real server fault, since it is what monitoring should alert on.

## 4. `audio/mp4` support

- **Now:** not verified. Every real recording is over 8 KB, so issue 1 blocks it before the backend.
- **Expected:**
  - Accept `audio/mp4` (AAC in an MP4 container, file `record.mp4`) as well as `audio/webm`.
  - Do not match the MIME type exactly. Browsers send parameters such as `audio/webm;codecs=opus` or `audio/mp4;codecs=mp4a.40.2`, so compare only the part before `;`.
  - If the speech-to-text service detects the format by file name, keep the original name or extension when forwarding.

## 5. Limits exist only on the client

- **Now:** the 2048-character and 60-second limits are enforced only in the browser and are easy to bypass.
- **Expected:**
  - The server checks text length and audio size or duration itself, and returns `413` when either is over the limit.
  - Requests are rate-limited per IP, with `429` when the limit is hit.

## 6. Recording bitrate (done on the site)

- The site now records at 24 kbit/s (`audioBitsPerSecond` in `MediaRecorder`). Speech-to-text models resample to 16 kHz mono anyway, so quality is not affected.
- Measured with the browser's test microphone: 1.6 s of recording is 2.9 KB (opus). Real speech is up to about 3 KB per second, against about 9 KB per second at the browser's default bitrate.
- This does not solve issue 1: anything over about 2.5 s is still above 8 KB.
