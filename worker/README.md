# Cloudflare Worker example

Copy `index.ts` into a Workers project (`src/index.ts`), set the `CHITMARK_API_KEY`
secret, and deploy. Uses the fetch-safe `@chitmark/sdk/edge` entrypoint.

```bash
npm install @chitmark/sdk
wrangler secret put CHITMARK_API_KEY
wrangler deploy
```

Behavior on `/signup` (all other paths pass through untouched):

| Verdict fields                         | HTTP status                   | Body / effect                                                                       |
| :------------------------------------- | :---------------------------- | :---------------------------------------------------------------------------------- |
| `decision: "allow"`, `degraded: false` | 200 via origin                | stamps `x-chitmark-principal` + `x-chitmark-event` headers on the forwarded request |
| `decision: "challenge"` or `degraded`  | **428** Precondition Required | `{ "challenge": true, "eventId": "evt_..." }`                                       |
| `decision: "deny"`                     | **403** Forbidden             | `blocked`                                                                           |

428 means the request is not rejected permanently; a required verification
precondition must be satisfied before the action can proceed (unlike 401/403).

Stored `x-chitmark-event` at origin: persist it on the account row: feedback
joins only on that id. See SDK.md §2 Drop-in C for the full walkthrough.
