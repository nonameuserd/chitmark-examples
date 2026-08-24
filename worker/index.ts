/**
 * Cloudflare Worker drop-in (SDK.md §2 Drop-in C): verify at the edge.
 * Copy into a Workers project; uses the fetch-safe `@chitmark/sdk/edge` entry.
 *
 * This file is illustrative and not built by turbo (no Worker package here).
 */
import { CHITMARK_HTTP_STATUS, Chitmark } from "@chitmark/sdk/edge";

interface Env {
  CHITMARK_API_KEY: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (new URL(req.url).pathname !== "/signup") {
      return fetch(req);
    }

    const chitmark = new Chitmark({ apiKey: env.CHITMARK_API_KEY });
    // Reads cf-connecting-ip, user-agent, headers, and Web Bot Auth signatures.
    const v = await chitmark.verifyRequest(req, { action: "signup" });

    if (v.degraded || v.decision === "challenge") {
      return Response.json(
        { challenge: true, eventId: v.eventId },
        { status: CHITMARK_HTTP_STATUS.preconditionRequired }, // 428
      );
    }
    if (v.decision === "deny") {
      return new Response("blocked", { status: CHITMARK_HTTP_STATUS.forbidden }); // 403
    }

    // Explicit non-degraded allow: stamp the verdict for origin, then continue.
    const fwd = new Request(req);
    fwd.headers.set("x-chitmark-principal", v.principal.onBehalfOf ?? "unknown");
    fwd.headers.set("x-chitmark-event", v.eventId);
    return fetch(fwd);
  },
};
