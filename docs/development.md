# Development guide

## Prerequisites

- Node.js LTS
- npm
- A Supabase project
- A browser with notification support for push testing

## Installation

```powershell
git clone https://github.com/Aaryan2R/QueueLess.git
cd QueueLess
npm install
Copy-Item .env.example .env.local
```

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<vapid-public-key>
VAPID_PRIVATE_KEY=<vapid-private-key>
VAPID_SUBJECT=mailto:admin@example.com
SUPABASE_SERVICE_ROLE_KEY=<server-only-secret-key>
```

`SUPABASE_SERVICE_ROLE_KEY` and `VAPID_PRIVATE_KEY` are server-only. Never use `NEXT_PUBLIC_` for them, paste them into chat, or commit them.

For Vercel, set `NEXT_PUBLIC_APP_URL` to the final public URL. If it is accidentally left as
`http://localhost:3000`, QueueLess uses Vercel's deployment URL for generated QR and push links.

In Supabase Authentication URL Configuration, set the production Site URL to
`https://queueless-navy.vercel.app` and add this Redirect URL:
`https://queueless-navy.vercel.app/auth/callback`. Keep the equivalent localhost callback URL for local development.

Generate VAPID keys when needed:

```powershell
npx web-push generate-vapid-keys
```

## Database migrations

Run the migrations in order in the Supabase SQL editor:

| Migration | Purpose |
| --- | --- |
| `202610230001_initial.sql` | Base schema, RLS and queue functions |
| `202610230002_fix_rls_recursion.sql` | RLS recursion correction |
| `202611110002_queue_hardening.sql` | Queue safety hardening |
| `202611110003_atomic_business_creation.sql` | Atomic business/queue creation |
| `202611110004_customer_leave_queue.sql` | Customer leave behavior |
| `202611110005_push_subscriptions.sql` | Browser push subscriptions |
| `202611110006_arrival_alerts_staff.sql` | Arrival windows, alerts and staff operations |

## Daily commands

```powershell
npm run dev
npm run test
npm run lint
npm run typecheck
npm run build
```

## Verification flow

1. Create an owner account and business.
2. Configure the queue and open its public URL.
3. Join as a customer in a second browser.
4. Operate the queue as owner/staff.
5. Verify called, ready, served, no-show and leave behavior.
6. Verify analytics and history.
7. Test a second business/account to confirm tenant isolation.

## Repository hygiene

- Keep product documentation in `docs/`.
- Keep migrations append-only and ordered.
- Keep secrets in ignored `.env.local`.
- Do not commit `.next/`, `node_modules/` or `*.tsbuildinfo`.
- Prefer focused tests for new queue rules and authorization boundaries.
