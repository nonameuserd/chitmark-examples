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

For signed agent associations, enroll a principal and issue a link bound to the
agent key, the site, and the recipient key. The agent supplies a fresh proof on each
resolve. The [Agent Attribution guide](https://chitmark.com/docs/guides/agent-attribution)
shows the signing payload and link lifecycle.
