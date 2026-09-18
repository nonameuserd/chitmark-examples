/**
 * Next.js App Router route handler drop-in (SDK.md §2 Drop-in B).
 * Copy into app/api/signup/route.ts in a Next app.
 *
 * This file is illustrative and not built by turbo (no Next.js peer dep here).
 */
import {
  CHITMARK_HTTP_STATUS,
  Chitmark,
  getTrustedClientIp,
  isEligibleAllow,
} from "@chitmark/sdk";

const chitmark = new Chitmark({
  apiKey: process.env.CHITMARK_API_KEY!,
});

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as { email?: string };

  const v = await chitmark.verify({
    action: "signup",
    surface: "app.acme.com/signup",
    subject: {
      email: body.email,
      // Platform / trusted-proxy IP only. Do not read raw XFF on a public origin.
      ip: getTrustedClientIp(req),
      userAgent: req.headers.get("user-agent") ?? "",
      headers: Object.fromEntries(req.headers),
      formData: body,
    },
  });

  if (v.degraded || v.decision === "challenge") {
    return Response.json(
      { challenge: true, eventId: v.eventId },
      { status: CHITMARK_HTTP_STATUS.preconditionRequired },
    );
  }
  if (v.decision === "deny") {
    return Response.json(
      { error: "blocked" },
      { status: CHITMARK_HTTP_STATUS.forbidden },
    );
  }
  if (!isEligibleAllow(v)) {
    // Unknown / malformed decision: fail to challenge, never to allow.
    return Response.json(
      { challenge: true, eventId: v.eventId },
      { status: CHITMARK_HTTP_STATUS.preconditionRequired },
    );
  }

  // Only an explicit non-degraded allow reaches here.
  // Store v.eventId on the account row NOW: feedback joins only on this id.
  const user = await createUser(body, {
    chitmarkEventId: v.eventId,
    chitmarkVerdict: v,
  });
  return Response.json({ ok: true, userId: user.id });
}

/**
 * Pattern only: replace with your own persistence. The load-bearing part is
 * `chitmarkEventId: v.eventId` on the account row: every later outcome
 * (credit_burn, chargeback, …) joins on it via `client.feedback`.
 */
async function createUser(
  body: { email?: string },
  meta: { chitmarkEventId: string; chitmarkVerdict: unknown },
): Promise<{ id: string }> {
  // `db` is your data layer (Prisma/Drizzle/raw SQL): replace the call below.
  const user = await db.accounts.create({
    email: body.email,
    chitmarkEventId: meta.chitmarkEventId,
  });
  return { id: user.id };
}

declare const db: {
  accounts: { create(data: unknown): Promise<{ id: string }> };
};
