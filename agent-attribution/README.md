# Recognize a returning agent session

Run with Node.js 24+ and an Attribution-enabled workspace. Create a test key with
`attribution:read` and use an HTTPS site origin you control.

```sh
export CHITMARK_SITE=https://app.example.com
# Set CHITMARK_API_KEY to your ck_test_… key in your shell.
node agent-attribution/index.mjs
```

The script creates a server-owned opaque token and sends two observations. Expect
`first none` and `returning existing_session`. Each observation is a separate request.
In an integration, keep the token in your application session store and pass it from
your backend. An existing session establishes continuity at that site. Keep your
application's authentication and authorization checks in place.

## Link an agent to an enrolled account

Use this flow when a recipient needs proof that an enrolled account authorized an
agent. The session example above works with a scoped read key and a site token.

1. Open **Dashboard → Attribution** in the test workspace. Generate an Ed25519
   key pair for the account owner, paste the public JWK into **Principal public
   key**, and complete account sign-in. Save the **Workspace ID** and the
   enrollment ID shown beside the authenticated account.
2. Generate a separate Ed25519 key pair for the agent. Choose the site origin
   and a test credential with `attribution:read` for the receiving backend.
   Copy the recipient's key record ID (`key_…`) from **Dashboard → Keys** for the
   link. The backend uses the corresponding secret (`ck_test_…`) when calling
   the API.
3. The account owner signs the link grant with the principal private key. A
   caller with `attribution:write` submits it to `POST /v1/identity-links` and
   saves the returned link ID. For a basic test, leave email consent off.
4. The agent signs a fresh proof with its own private key for each request. The
   receiving backend submits that proof with its read credential within 60 seconds.

The [Agent Attribution guide](https://chitmark.com/docs/guides/agent-attribution)
lists the exact fields and signing order for both signatures.
