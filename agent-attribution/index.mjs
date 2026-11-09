import { randomBytes } from "node:crypto";

const { CHITMARK_API_KEY: apiKey, CHITMARK_SITE: site } = process.env;
const apiUrl = process.env.CHITMARK_API_BASE_URL ?? "https://api.chitmark.com";

if (!apiKey?.startsWith("ck_test_"))
  throw new Error("Set a test attribution:read key");
if (
  !site ||
  new URL(site).protocol !== "https:" ||
  new URL(site).origin !== site
) {
  throw new Error("Set CHITMARK_SITE to an exact HTTPS origin");
}

const endpoint = new URL("/v1/attributions/resolve", apiUrl);
const session = randomBytes(32).toString("base64url");

for (const observation of ["first", "returning"]) {
  const response = await fetch(endpoint, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(5_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ site, session, piiMode: "hashed" }),
  });
  if (!response.ok)
    throw new Error(`Attribution request failed (${response.status})`);
  const result = await response.json();
  console.log(observation, result.identity.match);
}
