# Lead Distribution Platform - Backend

Express + TypeScript + Prisma (MySQL) API for the lead distribution platform. Receives leads from the public form, applies duplicate detection and the weighted deficit distribution algorithm inside a serializable transaction, and serves the admin API.

Frontend repository: https://github.com/taniyow/lead-platform-frontend

## Architecture

```
Browser -> Next.js frontend (public port, only public process)
             -> Express API (127.0.0.1, private port)
                  -> Prisma -> MySQL
```

- The backend binds to loopback and is never exposed to the internet. The only path in is the frontend's server-side proxy.
- Layers: `routes` (wiring) -> `controllers` (HTTP translation) -> `services` (workflows, transactions) -> `domain` (pure business rules, no framework imports, fully unit-tested).
- Client IP arrives in the `x-client-ip` header, stamped by the frontend's custom server from the TCP socket. The backend trusts it because it is only reachable through that trusted frontend; it falls back to the socket address otherwise.

```
src/
  app.ts, server.ts        app factory and bootstrap
  config/env.ts            Zod-validated environment loading
  middleware/              auth (JWT), central error handler
  modules/                 auth, brokers, forms, distributions, leads, dashboard
    <module>/              *.routes.ts, *.controller.ts, *.service.ts, *.schema.ts
  domain/                  normalize-email, distribution/ (deficit, selection, schedule, day range)
  lib/                     prisma client, logger, transaction retry, client IP
prisma/                    schema, migrations, seed
```

## Requirements

- Node.js 20.9+ (built and deployed on Node 22)
- MySQL 8+
- npm

## Setup (local development)

```bash
git clone https://github.com/taniyow/lead-platform-backend
cd lead-platform-backend
npm install
cp .env.example .env    # then fill in real values
npx prisma migrate dev  # creates schema, generates client
npx prisma db seed      # creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev             # http://127.0.0.1:4001 by default
```

Health check: `GET /api/health`.

## Environment variables

| Variable | Purpose | Notes |
| --- | --- | --- |
| `NODE_ENV` | runtime mode | `production` on the server |
| `HOST` | bind address | keep `127.0.0.1` so the API is never public |
| `PORT` | bind port | the provided private port in production |
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | signs auth tokens | long random string, backend-only |
| `JWT_EXPIRES_IN` | token lifetime | e.g. `1d` |
| `COOKIE_SECURE` | Secure flag on the auth cookie | `false` when serving plain HTTP (the provided VPS); `true` behind TLS |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | seed account credentials | used by the seed script only |

Never commit `.env`. `.env.example` carries placeholders only.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | start with live reload |
| `npm run build` | compile TypeScript to `dist/` |
| `npm start` | run the compiled server |
| `npm run typecheck` | type-check without emitting |
| `npm test` | run the unit test suite (32 tests) |
| `npm run db:migrate` / `db:deploy` / `db:seed` | Prisma migrate dev / deploy / seed |

## API overview

```
POST /api/auth/login            POST /api/auth/logout          GET /api/auth/me
GET|POST /api/brokers           GET|PATCH /api/brokers/:id     GET /api/brokers/:id/leads
GET|POST /api/forms
GET|POST /api/distributions     GET /api/distributions/:id
PATCH /api/distributions/:id/brokers                           GET /api/distributions/:id/leads
GET /api/leads                  POST /api/leads/:id/manual-assign
GET /api/public/forms/:slug     POST /api/public/forms/:slug/leads   (no auth)
GET /api/health
```

All responses use the envelope `{ "data": ..., "error": null }` or `{ "data": null, "error": { "message": ... } }`. Every write endpoint and path parameter is validated with Zod server-side. Admin routes require the JWT cookie; the two public form endpoints do not.

## Distribution algorithm

For each eligible broker:

```
targetAfterLead = (totalSentToday + 1) * brokerPercentage / 100
deficit         = targetAfterLead - brokerSentToday
```

The eligible broker with the highest deficit receives the lead. Ties break to the broker with fewer sent leads today, then to the lowest broker id (documented addition for determinism). A broker is eligible only when it is globally active, active inside the distribution, under its daily cap, on a working day, and inside its open window, all evaluated in the broker's own IANA timezone (Luxon). The whole pipeline (persist lead, duplicate check, counts, selection, assignment) runs inside one serializable transaction with a small retry on write conflicts, so caps and the duplicate rule hold under concurrent submissions.

## Testing

```bash
npm test
```

32 unit tests over the pure domain layer: the deficit formula (including the assessment's worked example), the tie-break chain, schedule evaluation across timezones (boundary minutes, wrong working day, overnight windows, a 25-hour DST day), day-range computation, and email normalization. Integration behaviors (singleton rules, duplicate flow, cap and schedule skips, manual assignment, concurrency races) were verified against the running system; a step-by-step manual test guide with expected results accompanies the submission.

## Deployment (VPS, no sudo)

The server runs Node via nvm (user-level) and PM2 as the process manager.

```bash
# one-time: node + pm2 without sudo
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
nvm install 22 && npm install -g pm2

# app
cd ~/apps/lead-platform-backend
# place .env with production values (HOST=127.0.0.1, PORT=<private port>)
npm ci
npx prisma migrate deploy
npx prisma db seed
npm run build
pm2 start dist/server.js --name lead-backend
pm2 save
```

Operations:

```bash
pm2 ls                                    # status
pm2 restart lead-backend                  # restart
pm2 logs lead-backend --lines 100         # logs (stdout + stderr)
```

Reboot survival without systemd access: `pm2 save` plus a crontab entry `@reboot . $HOME/.nvm/nvm.sh && pm2 resurrect`.

## Assumptions (ambiguities and the decisions taken)

1. **Duplicate rule**: a lead is `duplicate` when its normalized email (trim + lowercase) was previously assigned to any broker (`assignedBrokerId` is set). Earlier `unsent` or `duplicate` leads do not trigger it; a manual assignment does.
2. **totalSentToday**: the sum of the participating brokers' sent counts for each broker's own local day. This matches the arithmetic of the assessment's worked example (4 + 3 + 3 = 10).
3. **Tie-breaking**: after "fewer sent leads today", remaining ties resolve to the lowest broker id so selection is fully deterministic and testable.
4. **Manual assignment** is an administrative override: it ignores schedule and cap (unsent leads exist precisely because brokers were closed or capped) but still requires the lead to be `unsent`, the broker to belong to the distribution, and re-checks that the email was not assigned meanwhile. The UI warns when the chosen broker is closed, capped, or inactive.
5. **failed status**: used only when a submission was accepted but processing failed unexpectedly; the lead is preserved with status `failed` rather than lost. Validation failures return errors instead of creating failed leads, and no artificial failure paths were invented.
6. **Percentages**: each value is validated 0 to 100, but the total is deliberately not forced to 100. The formula is well-defined for any weights; the UI shows the total and warns when it is not 100.
7. **Reserved slugs**: the public form cannot use slugs that would shadow application routes (`login`, `dashboard`, `brokers`, `form`, `distribution`, `leads`, `api`, ...).
8. **Overnight schedules** (closing before opening, e.g. 22:00-06:00) are supported as a robustness extra; the after-midnight segment counts against the previous day's working-day flag.
9. **Public responses are neutral**: the visitor sees the same confirmation whether the lead was sent, unsent, or duplicate, so outsiders cannot probe known emails or routing behavior.

## Security notes

- Passwords are bcrypt-hashed (cost 10); the admin account is created by the seed script from environment variables.
- The JWT lives in an HttpOnly, SameSite=Lax cookie; it is never exposed to client-side JavaScript or stored in localStorage.
- The backend is not reachable from the internet; only the frontend proxy on the same host can call it.
- Client-supplied IP headers are never trusted at the public edge: the frontend stamps the real TCP peer address and the backend only honors that internal header.
- No secrets are committed. `.env` is gitignored; `.env.example` contains placeholders only.
- Known production hardening not in scope for the assessment: rate limiting on public endpoints, TLS termination, request-scoped correlation ids, error tracking.
