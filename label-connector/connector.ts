/**
 * Credit-burn label connector (MVP-014, Recipe A).
 *
 * Drains per-account usage-metering buckets and reports `credit_burn`
 * feedback keyed by the STORED chitmarkEventId from verify: never a guess.
 *
 * This is a production-ready pattern for the first design partner: adapt
 * `AccountStore.findByAccountId` to your DB, and swap the stdin drain for
 * your queue consumer (SQS / RabbitMQ / your metering pipeline).
 *
 * Run:
 *   CHITMARK_API_KEY=ck_... npm start -- events.ndjson
 *
 * Input (one JSON object per line):
 *   {"accountId": "acct_123", "creditsBurnedUsd": 12.4, "observedAt": "2026-08-06T04:00:00Z"}
 */
import { log } from "./logger";
import { Chitmark, ChitmarkApiError } from "@chitmark/sdk";
import { readFileSync } from "node:fs";

interface UsageBucket {
  accountId: string;
  creditsBurnedUsd: number;
  observedAt?: string;
}

interface Account {
  id: string;
  chitmarkEventId: string | null;
}

/**
 * Replace with your DB read. The only rule: the event id comes from the
 * account row persisted at verify time: never derived from the bucket.
 */
const AccountStore = {
  async findByAccountId(accountId: string): Promise<Account | null> {
    return { id: accountId, chitmarkEventId: null };
  },
};

const apiKey = process.env.CHITMARK_API_KEY;
if (!apiKey) {
  log.error("missing required environment variable", { envVar: "CHITMARK_API_KEY" });
  process.exit(1);
}

const chitmark = new Chitmark({
  apiKey,
  env: "development", // local edge stub at 127.0.0.1:8787
});

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 200;

function parseUsageBuckets(file: string | undefined): UsageBucket[] {
  if (!file) {
    log.error("usage events file is required", {
      usage: "node connector.ts events.ndjson",
    });
    process.exit(1);
  }
  return readFileSync(file, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as UsageBucket);
}

async function reportCreditBurn(bucket: UsageBucket, eventId: string): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await chitmark.feedback({
        eventId,
        outcome: "credit_burn",
        value: bucket.creditsBurnedUsd,
        unit: "usd",
        observedAt: bucket.observedAt,
      });
      log.info("reported credit_burn label", {
        accountId: bucket.accountId,
        eventId,
        creditsBurnedUsd: bucket.creditsBurnedUsd,
      });
      return;
    } catch (err) {
      const retryable =
        err instanceof ChitmarkApiError && err.status !== undefined && err.status >= 500;
      if (!retryable || attempt === MAX_RETRIES) {
        throw err;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_BASE_DELAY_MS * 2 ** attempt),
      );
    }
  }
}

async function main(): Promise<void> {
  const eventsFile = process.argv.slice(2).find((arg) => arg !== "--");
  const buckets = parseUsageBuckets(eventsFile);
  log.info("draining usage metering buckets", { count: buckets.length });

  let reported = 0;
  let misses = 0;
  for (const bucket of buckets) {
    const account = await AccountStore.findByAccountId(bucket.accountId);
    if (!account?.chitmarkEventId) {
      // Never guess an event id. Log the miss and fix the signup path that
      // failed to persist eventId at verify time.
      log.warn("skipping bucket: account has no stored chitmarkEventId", {
        accountId: bucket.accountId,
      });
      misses += 1;
      continue;
    }
    await reportCreditBurn(bucket, account.chitmarkEventId);
    reported += 1;
  }

  log.info("label connector finished", { reported, misses });
}

main().catch((err) => {
  log.error("label connector failed", {
    message: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
