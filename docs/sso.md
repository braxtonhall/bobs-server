# SSO

Other services (first: the bobs-sink operator console at `sink.bobs-server.net`) use bob's server's email
login instead of running their own. bob's server only says who the person is; each service decides what
they may do.

## Flow

1. The service sends the browser to `https://bobs-server.net/sso?redirect=<callback>&state=<random>`.
2. If the visitor isn't logged in, `/sso` sends them through the usual `/login` and they come back via `next`.
3. `/sso` issues a one-time code (256 random bits, `SSO_CODE_EXPIRATION_SEC`, default 60 s), stored as a
   `Token` of type `sso` along with the `redirect` it was issued for, and redirects to
   `<callback>?code=<code>&state=<state>`.
4. The service checks `state`, then calls `POST /api/sso/exchange` server to server:

   ```http
   POST /api/sso/exchange
   Authorization: Bearer <SSO_EXCHANGE_SECRET>
   Content-Type: application/json

   { "code": "<code>", "redirect": "<callback>" }
   ```

   The response is `{ "sub": "<Email.id>", "email": "<address>" }`; `401` without the secret; `400` with
   `{ "error": "invalid_code" }` for an unknown, expired, spent, or mismatched code.

## Rules

- `redirect` must exactly match an entry in `SSO_REDIRECTS` (comma-separated). Anything else gets a `400`,
  never a redirect.
- A code is spent before its `redirect` is checked, so it can't be retried with another one.
- The exchange lives under `/api` because, when the server terminates TLS itself, its plain-HTTP listener redirects everything else to https; services
  call it over the internal Docker network (e.g. `http://server/api/sso/exchange`). The reverse proxy should
  also refuse it from outside.
- Both routes are `404` unless `SSO_REDIRECTS` and `SSO_EXCHANGE_SECRET` are set.
- Expired codes are removed by the same job that removes other expired tokens.
