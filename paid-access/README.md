# Buy a fixed-price API call

Run with Node.js 24+. Configure a fixed-price resource and test payment account for
the seller. The buyer workspace owner sets a seller-specific spending ceiling.
Use the buyer agent's test key with `charge:buy` throughout the purchase.

```sh
export CHITMARK_SELLER_TENANT_ID=org_your_seller
export CHITMARK_BUYER_TENANT_ID=org_your_buyer
# Set CHITMARK_API_KEY to the buyer's ck_test_… key in your shell.

OPERATION_ID="$(node -e 'console.log(crypto.randomUUID())')"
node paid-access/index.mjs quote weather_call "$OPERATION_ID"
# Review the quote and set PURCHASE_ID, QUOTE_VERSION, and APPROVED_CENTS from it.
node paid-access/index.mjs accept "$PURCHASE_ID" "$QUOTE_VERSION" "$APPROVED_CENTS"
# If the response says pay, open checkoutUrl and complete test payment.
node paid-access/index.mjs status "$PURCHASE_ID"
```

Record the operation ID before requesting a quote. Reuse it to recover a lost
quote response. Retry acceptance with the same purchase ID, version, and approved
amount. The status command reads the original purchase after Checkout.

The seller checks its own permission, confirms capture, and reserves execution
before delivering the resource. See the [Agent Paid Access guide](https://chitmark.com/docs/guides/agent-paid-access)
for seller setup, delivery, and refunds.
