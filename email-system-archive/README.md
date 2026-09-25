# FindBuilders Email System — Archive

## 1. What this folder is

This folder contains the **archived FindBuilders transactional email system** — a complete,
read-only backup of the email implementation as of commit `5d84651` (with the
`EMAIL_ENABLED` kill switch), preserved so it can be restored later once a sending
domain has been purchased and verified.

**This archive is dormant. The active production backend must never import anything
from `email-system-archive/`.** Nothing under this folder is compiled, executed, or
loaded by `backend/`, `frontend/`, or `admin/`.

## 2. Email is intentionally disabled in production

The production backend treats email as **not configured**:

- `EMAIL_ENABLED` defaults to **false** when missing (fail-safe) — the strict parser
  only enables email for the exact value `true`.
- While disabled: no Resend client is constructed, no `email_events` rows are created
  or mutated, no Resend API calls are made, no email logs/errors are produced, and
  signup / product submission / approval / rejection all succeed normally.

## 3. Production must NOT depend on this archive

- No file in the active backend imports from `email-system-archive/`.
- This folder exists purely as a backup/documentation artifact.
- Do not add imports, `tsconfig` includes, or build steps that reference it.

## 4. Supported email types (4)

| Event type | Permanent event key | Trigger |
|---|---|---|
| `WELCOME` | `WELCOME:<user_id>` | Signup / OAuth account creation |
| `PRODUCT_SUBMITTED` | `PRODUCT_SUBMITTED:<product_id>` | Maker submits a product (pending) |
| `PRODUCT_APPROVED` | `PRODUCT_APPROVED:<product_id>` | Admin approves a submission |
| `PRODUCT_REJECTED` | `PRODUCT_REJECTED:<product_id>` | Admin rejects a submission |

Exactly one event + one email ever per type per entity (permanent keys, no timestamps).

## 5. Provider: Resend

Delivery went through the [Resend](https://resend.com) HTTP API (`resend` npm package)
with a **deterministic idempotency key** per logical event (`welcome/<user_id>`,
`product-submitted/<product_id>`, …) so duplicate attempts collapse into one message.
Currently there is **no verified sending domain**, which is why email is disabled.

## 6. EmailGuard — exactly-once protection

`EmailGuard` provides exactly-once delivery semantics across processes/restarts:

- Atomic `reserve()` via the `UNIQUE(event_key)` constraint (insert = send lock).
- States: `PENDING → SENDING → SENT | FAILED` (FAILED allows retry of the same key).
- In-flight lock with 5-minute stale-lock recovery; optional disk fallback store.
- `ALREADY_SENT` / `IN_FLIGHT` blocks prevent duplicate provider calls.

## 7. `email_events` — persistent database guard

PostgreSQL table `public.email_events` (see `backend/migrations/email_events.sql`)
is the durable idempotency store: unique `event_key`, status machine,
`provider_message_id`, `error_message`, RLS enabled.

**The table remains in Supabase, dormant and untouched** while email is disabled.
No SQL was run, dropped, or modified when creating this archive.

## 8. Email templates are preserved

All four HTML/text templates plus the universal Gmail-safe wrapper are preserved:

- `backend/email/templates/{Welcome,ProductSubmitted,ProductApproved,ProductRejected}Email.ts`
- `backend/email/components/UniversalEmailTemplate.ts` (logo, layout, text alternative)
- `backend/email-template/index.html` — the static design reference

Logo always resolves to `https://findbuilders.pages.dev/findbuilderslogo.png`;
links resolve to `https://findbuilders.pages.dev` (the dead `findbuilders.app` domain is ignored).

## 9. Restoring the system later

1. Purchase a domain and verify it in Resend (`https://resend.com/domains`) with SPF/DKIM.
2. Put the archived files back:
   - `backend/email/*` → `backend/src/email/*` (the active copy still exists — overwrite only if restoring this exact snapshot)
   - `backend/email-template/` → `backend/email-template/`
   - `backend/migrations/email_events.sql` → `backend/supabase/email_events.sql` (table already exists — no need to re-run)
   - `backend/scripts/*` → `backend/scripts/`
   - `backend/tests/*` → `backend/tests/` and re-add them to the `npm test` script
     (see `config/environment.example` for the original test file list)
3. Configure `backend/.env` (see `config/environment.example`), then set
   `EMAIL_ENABLED=true` — only that exact value enables sending.
4. `npm test` (backend) and `npm run build`, then deploy.

## 10. SECURITY — no secrets in this archive

**No real credentials are stored here.** This archive intentionally contains **no**:

- `RESEND_API_KEY` values
- Supabase service-role / anon keys
- JWT secrets
- Passwords, OAuth secrets, or private tokens

Only variable **names** and placeholder/empty values are preserved
(`config/environment.example`). Real secrets live exclusively in the untracked
`backend/.env` / Render environment variables and must never be copied here.

## Archive contents

```
email-system-archive/
├── README.md                          ← this file
├── backend/
│   ├── email/                         ← snapshot of backend/src/email/ (implementation)
│   │   ├── index.ts                   ← barrel
│   │   ├── emailService.ts            ← dispatcher, test mode, idempotency keys
│   │   ├── emailGuard.ts              ← exactly-once guard (email_events)
│   │   ├── emailRenderer.ts           ← renderer
│   │   ├── emailConfig.ts             ← EMAIL_ENABLED strict switch
│   │   ├── components/UniversalEmailTemplate.ts
│   │   └── templates/{Welcome,ProductSubmitted,ProductApproved,ProductRejected}Email.ts
│   ├── email-template/index.html      ← MOVED from backend/email-template/ (design reference)
│   ├── tests/                         ← email test suites
│   │   ├── emailTestMode.test.ts      ← MOVED from backend/tests/
│   │   ├── emailGuard.test.ts         ← MOVED from backend/tests/
│   │   ├── emailExactlyOnce.test.ts   ← MOVED from backend/tests/
│   │   └── emailEnabledSwitch.test.ts ← COPY (also active: proves EMAIL_ENABLED=false behavior)
│   ├── migrations/email_events.sql    ← MOVED from backend/supabase/ (DB table unchanged)
│   └── scripts/
│       ├── canonicalize-email-events.ts ← MOVED from backend/scripts/ (one-off migration, already applied)
│       └── audit-email-testmode.ts      ← MOVED from backend/ (test-recipient audit runner)
└── config/environment.example          ← sanitized env reference (placeholders only)
```

## Left active in the production backend (shared — could not be moved)

| File | Why it stays |
|---|---|
| `backend/src/email/*` | Imported by `authService` / `productService` triggers; gated by `EMAIL_ENABLED=false` (a snapshot copy lives in `backend/email/`) |
| `backend/tests/emailEnabledSwitch.test.ts` | Verifies the active kill switch + that signup/submission/approval/rejection succeed with email disabled (copy in archive) |
| `backend/package.json` | Shared; only its `test` script was updated for the moved tests |
| `backend/.env.example` | Shared backend config (email section documented; archive has `config/environment.example`) |
| `backend/README.md`, `README.md` | Whole-project documentation (mention email among features) |
| `supabase-schema.sql` (root) | Shared database schema document (includes the `email_events` DDL) |
| `backend/src/services/authService.ts`, `productService.ts` | Core auth/product logic that merely calls the (no-op) email triggers |
