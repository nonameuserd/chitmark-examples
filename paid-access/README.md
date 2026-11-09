# Buy a fixed-price API call

Run with Node.js 24+ and two Chitmark test workspaces. In each workspace, open
**Dashboard → Attribution** and copy the **Workspace ID**. Replace the example IDs
below with those values.

| Variable                    | What to copy                                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `CHITMARK_SELLER_TENANT_ID` | The workspace ID of the business offering the API call. This workspace owns the connected payment account and resource. |
| `CHITMARK_BUYER_TENANT_ID`  | The workspace ID of the business funding the purchase. The example includes this ID in the operation digest.            |
| `CHITMARK_API_KEY`          | A `ck_test_…` credential issued in the buyer workspace with `charge:buy`. It authenticates the buyer on each request.   |

In the seller workspace, configure a test payment account and publish a fixed-price
resource using `charge:configure`. Replace `weather_call` with the resource ID you
configured. In the buyer workspace, use `charge:budget` to set the buyer's spending
ceiling for this seller. Keep the seller's `charge:fulfill` key in the seller backend.

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
