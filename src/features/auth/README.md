# Auth session lifecycle

`authSessionLifecycle.ts` is the single state transition boundary for login,
hydration, credential replacement, refresh, and logout. UI and provider adapters
must wait for its result before reporting success or navigating.

The browser session route stores the current JWT in an HttpOnly cookie, validates
its shape, identity, and expiry, and caps cookie lifetime to the JWT expiry. The
application still uses a client bearer-token contract because the existing backend
APIs require the token in `Authorization`; consequently `GET /api/auth/session`
returns the token to trusted application JavaScript. The HttpOnly cookie prevents
direct cookie reads but is not an XSS security boundary for this architecture.

Logout is currently browser-local and clears the lifecycle state, query cache,
server session cookie, and legacy client-readable cookies. No backend token revoke
contract exists in this repository, so a stolen token remains valid until its JWT
expiry. Add server-side revocation before treating logout as global invalidation.
