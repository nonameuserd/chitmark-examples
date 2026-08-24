# Chitmark examples

Working integration samples for [Chitmark](https://chitmark.com): the trust-decision API that scores each signup or agent action and returns `allow`, `challenge`, or `deny`, then learns from the outcomes you report back.

All samples are MIT licensed: copy them into your project.

| Folder | What it shows |
| :-- | :-- |
| [express](./express) | Signup gate with the `chitmarkGate` middleware: 403 on deny, 428 plus challenge payload on challenge |
| [nextjs-route](./nextjs-route) | Next.js App Router route handler verifying a signup before work happens |
| [worker](./worker) | Cloudflare Workers `verifyRequest` helper on the `/edge` entrypoint |
| [label-connector](./label-connector) | The feedback half: drain usage-metering buckets and report `credit_burn` outcomes joined on the stored `eventId` |

## Run one

```bash
git clone https://github.com/nonameuserd/chitmark-examples
cd chitmark-examples/express
npm install
CHITMARK_API_KEY=ck_... npm start
```

Get a free API key (10,000 verify events a month, no card) at [chitmark.com](https://chitmark.com). Try a verdict with no key at all in the [playground](https://chitmark.com/playground).

## The two rules that make it work

1. **Persist `verdict.eventId`** on your account row at verify time. Feedback joins only on that id.
2. **Fail to challenge, never to allow.** If the API is degraded or times out, treat the action as `challenge`.

## More

- [Integration skill for coding agents](https://chitmark.com/SKILL.md)
- [Full docs](https://chitmark.com/docs) and [docs as markdown](https://chitmark.com/docs.md)
- [TypeScript SDK](https://www.npmjs.com/package/@chitmark/sdk) and [Python SDK](https://pypi.org/project/chitmark/)
