# Chitmark examples

Working integration samples for [Chitmark](https://chitmark.com), covering Trust Decisions, Agent Attribution, and Agent Paid Access.

All samples are MIT licensed: copy them into your project.

| Folder                                   | What it shows                                                                                                    |
| :--------------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| [express](./express)                     | Signup gate with the `chitmarkGate` middleware: 403 on deny, 428 plus challenge payload on challenge             |
| [nextjs-route](./nextjs-route)           | Next.js App Router route handler verifying a signup before work happens                                          |
| [worker](./worker)                       | Cloudflare Workers `verifyRequest` helper on the `/edge` entrypoint                                              |
| [label-connector](./label-connector)     | The feedback half: drain usage-metering buckets and report `credit_burn` outcomes joined on the stored `eventId` |
| [agent-attribution](./agent-attribution) | Resolve a first and returning site session with a scoped Attribution key                                         |
| [paid-access](./paid-access)             | Quote a fixed-price API call, accept the exact amount, and resume after hosted Checkout                          |

## Run one

```bash
git clone https://github.com/nonameuserd/chitmark-examples
cd chitmark-examples/express
npm install
CHITMARK_API_KEY=ck_... npm start
```

Get a free API key (10,000 verify events a month, no card) at [chitmark.com](https://chitmark.com). Try a verdict with no key at all in the [playground](https://chitmark.com/playground).

## Trust Decisions rules

1. **Persist `verdict.eventId`** on your account row at verify time. Feedback joins only on that id.
2. **Fail to challenge, never to allow.** If the API is degraded or times out, treat the action as `challenge`.

## More

- [Integration skill for coding agents](https://chitmark.com/SKILL.md)
- [Full docs](https://chitmark.com/docs) and [docs as markdown](https://chitmark.com/docs.md)
- [TypeScript SDK](https://www.npmjs.com/package/@chitmark/sdk) and [Python SDK](https://pypi.org/project/chitmark/)
