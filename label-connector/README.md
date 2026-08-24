# Label connector (credit_burn)

Production-ready pattern for the first design partner (MVP-014, Recipe A): a
queue consumer that turns usage-metering buckets into `credit_burn` feedback
labels joined on the **stored** `chitmarkEventId` from verify.

## The rule that matters

Every connector reads the event id off the **account row** that verify
returned. Never derive or guess an event id from the outcome payload. If the
account has no stored `chitmarkEventId`, skip and log the miss, then fix the
signup path that failed to persist it.

## Run

```bash
CHITMARK_API_KEY=ck_... pnpm --filter @chitmark/example-label-connector start -- events.ndjson
```

`events.ndjson`: one usage bucket per line:

```json
{"accountId": "acct_123", "creditsBurnedUsd": 12.4, "observedAt": "2026-08-06T04:00:00Z"}
{"accountId": "acct_456", "creditsBurnedUsd": 3.1, "observedAt": "2026-08-06T08:00:00Z"}
```

## Adapting to production

1. Replace `AccountStore.findByAccountId` with your DB read.
2. Replace the stdin drain with your metering/queue consumer (SQS, RabbitMQ,
   your pipeline). Keep the per-account aggregation: one label per account
   per window is enough.
3. Retries: the SDK throws on non-2xx; this example retries 5xx with backoff
   and then rethrows into your dead-letter policy. Exact retry duplicates
   derive the same warehouse `feedbackId`, so they never double-count value.

## Other recipes

- T&S queue → `abuse_confirmed`: same shape, no `value`/`unit`
- Stripe dispute → `chargeback`: resolve `eventId` via your stored
  `account.chitmarkEventId` mapping: see SDK.md §3 Recipe C

Unknown or cross-tenant event ids return `404 unknown_event_id`; the edge
never acknowledges a label generically.
