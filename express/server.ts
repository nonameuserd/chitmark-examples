/**
 * Express drop-in matching SDK.md: signup gate with chitmarkGate middleware.
 *
 * Prerequisite: edge stub or real API + CHITMARK_API_KEY.
 */
import express from "express";
import { log } from "./logger";
import { CHITMARK_HTTP_STATUS, Chitmark, chitmarkGate } from "@chitmark/sdk";

const apiKey = process.env.CHITMARK_API_KEY;
if (!apiKey) {
  log.error("missing required environment variable", { envVar: "CHITMARK_API_KEY" });
  process.exit(1);
}

const chitmark = new Chitmark({
  apiKey,
  env: "development", // local edge stub at 127.0.0.1:8787
});

const app = express();
app.use(express.json());

app.post("/signup", chitmarkGate(chitmark, "signup"), (req, res) => {
  const verdict = res.locals.chitmark;
  // Store verdict.eventId on the account row for feedback joins
  res.status(CHITMARK_HTTP_STATUS.created).json({
    ok: true,
    user: { email: req.body?.email },
    chitmarkEventId: (verdict as { eventId?: string } | undefined)?.eventId,
  });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  log.info("express example listening", {
    url: `http://localhost:${port}`,
    port,
  });
});
