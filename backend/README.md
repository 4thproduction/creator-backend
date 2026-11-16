# Creator application intake

The creator form sends JSON to `POST /api/creators/applications`. The backend validates the application and saves it in MongoDB. The portal reads saved applications through its authenticated `/api/creators` endpoints.

Portal staff with the `create_creator` role permission can also add an application manually at `/creators/new`. This uses authenticated `POST /api/creators`, with the same required fields and validation as the public intake route.

Portal staff with the `update_creator` role permission can edit existing creator applications. Updates use authenticated `PUT /api/creators/:id` and keep existing analytics uploads unless replacement files are submitted.

## Local setup

1. Copy `.env.example` to `.env` and set `MONGO_URI` and `FRONTEND_ORIGINS`.
2. Run the backend on port 5000. In `creator-hub`, set `VITE_CREATOR_API_URL` to a browser-reachable backend URL before building. It defaults to `http://localhost:5000` for local development.

The Docker build for creator-hub accepts `VITE_CREATOR_API_URL` as a build argument through its Compose file. For a deployed site, set it to the public HTTPS URL of the portal backend, then rebuild the creator-hub image.

The intake route returns `201` with an application ID on success. Validation failures return an error without storing the application, and the form shows that error while staying on the form. Analytics files are limited to JPEG, PNG, WebP, or PDF, at most 5 MB each.

Run `npm test` for the backend tests. A live submission also requires a running MongoDB instance.


## Server-managed sessions

Sessions use the existing MongoDB connection and a `sessions` collection linked to `User`. No Redis service is needed. The browser receives an opaque HttpOnly `portal_session` cookie; only its SHA-256 hash is stored in MongoDB. Login identity and credentials are no longer persisted in localStorage. Existing JWT logins must sign in again after this update.

- Login sets a fixed 24-hour `expiresAt`, a `confirmAt` one hour away, and a `deadline` 30 seconds after that.
- The modal appears at `confirmAt`. Continue atomically advances the next prompt by one hour without changing `expiresAt`. Repeated or early Continue requests cannot extend a pending interval.
- No response before `deadline`, or reaching `expiresAt`, makes the session invalid immediately on protected requests. MongoDB's TTL index cleans up expired records later; authorization does not wait for cleanup.
- Sign out deletes the current session. Other devices have independent sessions; tabs in the same browser share the cookie and synchronize using storage notifications, status polling, and focus checks.
- Refresh restores the user from `GET /api/auth/session`. The countdown is based on server deadlines, not a timer restarted by refresh. Browser sleep does not pause server expiry. Protected content is hidden at the local deadline; an unreachable server causes local signout after the bounded status check.

Endpoints: `POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/session/continue`, `POST /api/auth/logout`. Cookie-authenticated writes require `X-Portal-Request: 1` and trusted browser origins. Public creator intake remains available without session authentication.

Set `FRONTEND_ORIGINS` to the exact comma-separated portal browser origins (including scheme and port). Defaults allow localhost and 127.0.0.1 on ports 5173 and 5174. Use `NODE_ENV=production` and HTTPS in production for Secure cookies. Serve the frontend and API on the same site (for example, `portal.example.com` and `api.example.com`) because cookies use SameSite=Lax. MongoDB must permit creating the session collection and its indexes. Restart the backend and rebuild/restart the frontend after applying changes.

References: [MongoDB TTL cleanup](https://www.mongodb.com/docs/manual/core/index-ttl/) and [Express cookie options](https://expressjs.com/en/4x/api/response/).
