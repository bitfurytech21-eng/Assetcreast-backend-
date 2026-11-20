# AssetCrest Pro — Investor Dashboard & API

A full investor dashboard (React + Vite) and its backend API (Express + SQLite) built on top of
the original AssetCrest proxy service. The proxy still works exactly as before; the dashboard and
its API are mounted ahead of it.

## What's included

### Backend (`src/server/`)
| File | Responsibility |
|---|---|
| `config.ts` | Environment-driven configuration, fails fast on a missing `JWT_SECRET` in production |
| `db.ts` | SQLite (better-sqlite3) connection, WAL mode, idempotent schema |
| `auth.ts` | bcrypt hashing, JWT access tokens, hashed + rotating refresh tokens, audit log |
| `market.ts` | Live quotes/candles from CoinGecko + Yahoo Finance, FX from Frankfurter, TTL cache with stale fallback |
| `services.ts` | Money ledger (integer cents), deposits, withdrawals, order execution, portfolio valuation, performance series |
| `http.ts` | Auth middleware, rate limiting, Zod-aware error handling |
| `routes/auth.ts` | Register, login, refresh, logout, profile, change password |
| `routes/dashboard.ts` | Summary, performance, notifications, watchlist |
| `routes/wallet.ts` | Balance, deposit, withdraw, currency transfer, paginated history |
| `routes/market.ts` | Instruments, quotes, candles, FX, market overview |
| `routes/trade.ts` | Place order, order preview, order history, portfolio |

### Frontend (`src/pages/`, `src/components/`)
- **Login / Register** — real auth against the API, live password-strength rules
- **Overview** — total value, cash, invested, unrealised P&L, performance chart, allocation donut,
  holdings table, watchlist, recent activity and orders
- **Portfolio** — every open position with cost basis, P&L, weight and 24h change
- **Trade** — live price chart, market/limit order entry with fee preview, order history
- **Wallet** — deposit, withdraw, currency conversion, paginated transaction ledger
- **Markets** — searchable/filterable instrument table with watchlist toggles
- **Notifications** and **Settings** (profile + password change)

## Running it

```bash
npm install --legacy-peer-deps
npm run build
JWT_SECRET="$(openssl rand -hex 32)" npm start
```

Then open `http://localhost:3000/dashboard` — you'll be redirected to `/login` and can register.

For development with hot reload:

```bash
JWT_SECRET=dev-secret npm run dev
```

## Configuration

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `3000` | |
| `JWT_SECRET` | dev placeholder | **Required in production** |
| `DATABASE_FILE` | `data/assetcrest.db` | SQLite file, created automatically |
| `ACCESS_TOKEN_TTL` | `900` | Seconds |
| `REFRESH_TOKEN_TTL` | `2592000` | Seconds (30 days) |
| `MIN_DEPOSIT_CENTS` | `5000` | $50 |
| `MIN_WITHDRAWAL_CENTS` | `10000` | $100 |
| `WITHDRAWAL_FEE_CENTS` | `500` | $5 |
| `PLATFORM_FEE_BPS` | `25` | 0.25% trading fee |
| `MARKET_CACHE_TTL_MS` | `60000` | Quote cache |

## API

All authenticated routes take `Authorization: Bearer <accessToken>`.

```
POST   /api/auth/register          { email, password, fullName, country? }
POST   /api/auth/login             { email, password }
POST   /api/auth/refresh           { refreshToken }        → rotates the refresh token
POST   /api/auth/logout
GET    /api/auth/me
PATCH  /api/auth/me                { fullName?, country?, phone?, riskProfile? }
POST   /api/auth/change-password   { currentPassword, newPassword }

GET    /api/dashboard/summary
GET    /api/dashboard/performance?days=30
GET    /api/dashboard/notifications
POST   /api/dashboard/notifications/read
GET    /api/dashboard/watchlist
POST   /api/dashboard/watchlist    { symbol }
DELETE /api/dashboard/watchlist/:symbol

GET    /api/wallet/balance
POST   /api/wallet/deposit         { amount, method }
POST   /api/wallet/withdraw        { amount, destination }
POST   /api/wallet/transfer        { amount, toCurrency }
GET    /api/wallet/transactions?limit=&offset=&type=

GET    /api/market/instruments
GET    /api/market/quotes?symbols=BTC,ETH
GET    /api/market/quotes/:symbol
GET    /api/market/candles/:symbol?range=1M
GET    /api/market/fx?base=USD
GET    /api/market/overview

POST   /api/trade/orders           { symbol, side, type, quantity, limitPrice? }
POST   /api/trade/orders/preview
GET    /api/trade/orders
GET    /api/trade/orders/:id
GET    /api/trade/portfolio

GET    /api/status
GET    /api/health                 (original proxy health check)
```

Errors are always `{ "error": { "code", "message", "details?" } }` with a matching HTTP status.

## Design notes

- **Money is integer cents** everywhere in the ledger; floats only appear at the presentation edge.
- **Every balance change is a transaction row** — the ledger is the source of truth, and the
  performance series is rebuilt by replaying it.
- **Refresh tokens are stored hashed** and rotated on use; replaying a revoked token revokes the
  whole family for that user.
- **Market data degrades gracefully**: on upstream failure the last known good quote is served
  flagged `stale: true` rather than blanking the dashboard.
- **Rate limiting** is in-memory and per-identity; swap the store for Redis when running more than
  one instance.

## Disclaimer

This is a demonstration platform. Balances, trades and market data are simulated or sourced from
public APIs and do not constitute investment advice.

---

## v2 — Crypto deposit flow, plans, referrals

### New screens
| Route | Screen |
|---|---|
| `/dashboard` | Five KPI cards (Account balance, Total Profit, Bonus, Referral Bonus, Total Deposit) |
| `/dashboard/deposit` | 4-step wizard: Amount → Network → Payment address → Proof upload |
| `/dashboard/transactions` | Deposit history + full account ledger, CSV export, status filter |
| `/dashboard/plans` | Investment plan picker, invest form, active plan progress |
| `/dashboard/referrals` | Referral code/link, invitee table, bonus history |
| `/dashboard/contact` | Support form |

### New API
```
GET    /api/deposits/networks            public — rails + demo flag
GET    /api/deposits                     paginated, ?status=
GET    /api/deposits/summary             totals + recent
POST   /api/deposits                     { amount, network }
GET    /api/deposits/:reference
POST   /api/deposits/:reference/proof    { filename, mime, data(base64) }
GET    /api/deposits/:reference/proof    authenticated file stream
POST   /api/deposits/:reference/complete
POST   /api/deposits/:reference/cancel

GET    /api/plans                        public
GET    /api/plans/mine
POST   /api/plans/:code/invest           { amount }

GET    /api/referrals
GET    /api/referrals/bonuses
POST   /api/contact

GET    /api/admin/stats                  admin only
GET    /api/admin/deposits               ?status=
GET    /api/admin/deposits/:id/proof
POST   /api/admin/deposits/:id/approve
POST   /api/admin/deposits/:id/reject
GET    /api/admin/messages
```

### Deposit lifecycle
`pending` → (proof uploaded) `proof_uploaded` → `completed` | `rejected`, or `cancelled`.

With `DEMO_AUTO_APPROVE_DEPOSITS=true` (default) the balance is credited as soon as
proof is uploaded. Set it to `false` to hold deposits in `proof_uploaded` until an
admin approves them via `/api/admin/deposits/:id/approve`.

Proofs are validated (PNG/JPEG/WebP/GIF/PDF, ≤5 MB), written to
`data/uploads/`, and served only through an authenticated route — never as a
public static file.

### Investment plans
Seeded: Starter (0.45%/day, 30d), Growth (0.70%/day, 30d), Premium (0.95%/day, 60d),
Institutional (1.20%/day, 90d). ROI accrues lazily on dashboard reads and is
written to the ledger as `investment_roi`, so a restart never loses or double-pays.

### Referrals
Every user gets a code at registration. A referral qualifies on the invitee's
first confirmed deposit and pays 5% (capped at $500) into the referrer's balance
as a `referral_bonus` ledger entry.

### New env vars
| Var | Default | Meaning |
|---|---|---|
| `DEMO_AUTO_APPROVE_DEPOSITS` | `true` | Credit deposits on proof upload |
| `REFERRAL_BONUS_BPS` | `500` | 5% of the invitee's first deposit |
| `REFERRAL_BONUS_CAP_CENTS` | `50000` | Per-referral bonus cap |
| `SIGNUP_BONUS_CENTS` | `0` | Optional signup credit |

### Schema additions
`deposit_networks`, `deposits`, `uploads`, `investment_plans`, `investments`,
`referrals`, `bonuses`, `contact_messages`; plus `users.referral_code`,
`users.referred_by`, `transactions.realized_pnl_cents`, `orders.realized_pnl_cents`.
All additive — an existing v1 database upgrades in place on boot.

---

## v3 — Deposit decision emails + admin review screen

### Email notifications
Approving or rejecting a deposit now emails the customer. The message is queued
**after** the database transaction commits, so a slow or failing mail server can
never roll back a credited balance.

| File | Responsibility |
|---|---|
| `src/server/mailer.ts` | Transport, queue, retries, templates, outbox fallback |
| `src/server/routes/admin.ts` | Review queue, approve/reject, email log, resend |

**Delivery is recorded, not assumed.** Every message gets a row in `email_log`
with one of these statuses:

| Status | Meaning |
|---|---|
| `queued` / `sending` | In flight |
| `sent` | Accepted by the SMTP server (provider message id stored) |
| `logged` | **No SMTP configured** — written to `data/outbox/*.eml`, not delivered |
| `failed` | All 3 attempts failed; the error is stored and the message can be resent |
| `skipped` | Recipient turned email notifications off |

Retries use a 2 s then 10 s backoff. The admin screen shows the real status, so
"we emailed the customer" is a claim you can check.

### Admin review screen
`/dashboard/admin/deposits` — visible in the sidebar only when `user.role === 'admin'`.

- Tabs for awaiting review / no proof / approved / rejected / all, plus search by
  reference, email or name.
- Each row shows the customer, amount, rail, proof link, status and email state.
- **Review** opens a drawer with the proof rendered inline, the deposit details,
  and a note field. **Approve & credit** writes the ledger entry; **Reject**
  requires a reason (3–500 chars) which is sent to the customer.
- **Email log** drawer lists every message with its status, attempt count and
  error, and offers **Resend** for `failed` / `logged` messages.
- A banner appears when no SMTP transport is configured, naming the outbox path.

### Settings
Users can switch deposit decision emails off in **Settings → Email notifications**.
The in-app notification is still written; only the email is skipped, and the skip
is logged.

### New endpoints
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/deposits?status=&search=&limit=&offset=` | Review queue |
| `POST` | `/api/admin/deposits/:id/approve` | Credit + email |
| `POST` | `/api/admin/deposits/:id/reject` | Reject + email (note required) |
| `GET` | `/api/admin/emails?status=` | Email log + transport info |
| `POST` | `/api/admin/emails/:id/resend` | Re-send a failed/logged message |
| `GET` | `/api/deposits/:reference/emails` | The user's own email history |
| `PATCH` | `/api/auth/me` | Now accepts `emailNotifications` |

### New env vars
| Var | Default | Meaning |
|---|---|---|
| `SMTP_URL` | — | Full connection string, e.g. `smtps://user:pass@smtp.example.com:465` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | — / `587` / `false` | Alternative to `SMTP_URL` |
| `SMTP_USER` / `SMTP_PASS` | — | SMTP credentials |
| `MAIL_FROM` | `AssetCrest <no-reply@assetcrest.local>` | Sender |
| `MAIL_REPLY_TO` | — | Optional reply-to |
| `MAIL_TIMEOUT_MS` | `10000` | Connection/greeting/socket timeout |
| `MAIL_OUTBOX_DIR` | `data/outbox` | Where `logged` messages are written |
| `APP_URL` | `http://localhost:3000` | Used for links inside emails |

With no SMTP variables set the app still runs: messages are written to the
outbox and marked `logged`. Set `SMTP_URL` (or the `SMTP_*` set) to deliver for real.

### Schema additions
`email_log`; plus `users.email_notifications` (default `1`) and
`users.email_verified_at`. Additive — an existing v2 database upgrades in place.

### Making a user an admin
There is no self-service promotion. Set the role directly:

```bash
node -e "require('better-sqlite3')('data/assetcrest.db').prepare(\"UPDATE users SET role='admin' WHERE email=?\").run('you@example.com')"
```

---

## v4 — Welcome email + password reset

### Welcome email
Sent once, immediately after a successful registration, through the same
`mailer.ts` transport as the deposit emails. It carries the account address, the
status and the user's referral code, and links to the dashboard.

Queued **after** the account row is committed, so a mail failure can never fail a
registration. The `email_log` row records what actually happened (`sent` /
`logged` / `failed`), exactly like the deposit messages.

### Password reset
| Route | Screen |
|---|---|
| `/forgot-password` | Request a reset link (linked from the sign-in form) |
| `/reset-password?token=…` | Choose a new password |

Flow: **request → emailed link → choose new password → signed out everywhere**.

Security properties, all covered by the test run:

- The raw token is **never stored** — only its SHA-256 hash, so a database leak
  cannot be replayed as an account takeover.
- Tokens are **single-use** and expire after `PASSWORD_RESET_TTL_MINUTES`
  (default 60). A second use returns `reset_used`.
- `POST /api/auth/forgot-password` returns the **same 200 body** for a
  registered address, an unknown address and a rate-limited request. It cannot
  be used to discover which emails have accounts.
- Issuing a new token **invalidates any earlier unused one** for that user.
- A successful reset **revokes every refresh token**, so other sessions die.
- Per-account **cooldown** (`PASSWORD_RESET_COOLDOWN_SECONDS`, default 60) stops
  the endpoint being used to flood a mailbox.
- The reset endpoints have their **own rate-limit bucket**, so a user who
  mistyped their password cannot lock themselves out of requesting a reset.
- A `password_changed` email is sent after a successful reset.

### New endpoints
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/forgot-password` | `{ email }` → always a generic 200 |
| `GET` | `/api/auth/reset-password/:token` | Validate a link before showing the form |
| `POST` | `/api/auth/reset-password` | `{ token, newPassword }` → set the password |

### New env vars
| Var | Default | Meaning |
|---|---|---|
| `PASSWORD_RESET_TTL_MINUTES` | `60` | How long a reset link stays valid |
| `PASSWORD_RESET_COOLDOWN_SECONDS` | `60` | Minimum gap between reset requests per account |
| `PASSWORD_RESET_RATE_LIMIT` | `20` | Requests per window on the reset endpoints |
| `PASSWORD_RESET_RATE_WINDOW_MS` | `900000` | Reset rate-limit window |

### Schema additions
`password_resets` (user id, token hash, expiry, used-at, requesting IP).
Additive — an existing v3 database upgrades in place on boot.

### Email templates now in use
`welcome`, `password_reset`, `password_changed`, `deposit_confirmed`,
`deposit_rejected` — all visible in **Admin → Email log**, with resend for any
message that is not `sent`.
