import { createHash } from "node:crypto";

const { CHITMARK_API_KEY: apiKey, CHITMARK_SELLER_TENANT_ID: sellerTenantId } =
  process.env;
const apiUrl = process.env.CHITMARK_API_BASE_URL ?? "https://api.chitmark.com";
const [operation, ...args] = process.argv.slice(2);

if (!apiKey?.startsWith("ck_test_"))
  throw new Error("Set a test charge:buy key");
if (!sellerTenantId) throw new Error("Set CHITMARK_SELLER_TENANT_ID");

async function charge(body, idempotencyKey) {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const response = await fetch(new URL("/v1/charge", apiUrl), {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
    headers,
    body: JSON.stringify({ sellerTenantId, ...body }),
  });
  if (!response.ok) {
    const { error } = await response.json().catch(() => ({}));
    throw new Error(
      `Charge request failed (${response.status}${error ? `, ${error}` : ""})`,
    );
  }
  return response.json();
}

function purchaseResult({ purchase, next }) {
  return {
    purchaseId: purchase.purchaseId,
    quoteVersion: purchase.quote.version,
    amountCents: purchase.quote.amount,
    currency: purchase.quote.currency,
    payment: purchase.payment.state,
    next,
    ...(next === "pay" ? { checkoutUrl: purchase.checkoutUrl } : {}),
  };
}

if (operation === "quote") {
  const [resourceId, operationId] = args;
  const buyerTenantId = process.env.CHITMARK_BUYER_TENANT_ID;
  if (!resourceId || !operationId || !buyerTenantId) {
    throw new Error(
      "Usage: quote <resourceId> <operationId>; set CHITMARK_BUYER_TENANT_ID",
    );
  }
  const quantity = 1;
  // This example sells one fixed call with no additional inputs.
  const operationDigest = createHash("sha256")
    .update(
      JSON.stringify([
        buyerTenantId,
        sellerTenantId,
        resourceId,
        operationId,
        quantity,
      ]),
    )
    .digest("hex");
  const result = await charge(
    { operation, resourceId, quantity, operationDigest },
    `quote-${operationDigest}`,
  );
  console.log(JSON.stringify(purchaseResult(result), null, 2));
} else if (operation === "accept") {
  const [purchaseId, quoteVersion, approvedCents] = args;
  const maxAmount = Number(approvedCents);
  if (
    !purchaseId ||
    !quoteVersion ||
    !/^\d+$/.test(approvedCents ?? "") ||
    !Number.isSafeInteger(maxAmount) ||
    maxAmount < 50
  ) {
    throw new Error(
      "Usage: accept <purchaseId> <quoteVersion> <approvedUsdCents>",
    );
  }
  const result = await charge(
    { operation, purchaseId, quoteVersion, maxAmount, currency: "usd" },
    `accept-${purchaseId}`,
  );
  console.log(JSON.stringify(purchaseResult(result), null, 2));
} else if (operation === "status" && args[0]) {
  console.log(
    JSON.stringify(
      purchaseResult(await charge({ operation, purchaseId: args[0] })),
      null,
      2,
    ),
  );
} else {
  throw new Error(
    "Usage: quote <resourceId> <operationId> | accept <purchaseId> <quoteVersion> <approvedUsdCents> | status <purchaseId>",
  );
}
