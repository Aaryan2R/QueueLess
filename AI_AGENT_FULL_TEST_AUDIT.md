# QueueLess — Full-System Test, Security Audit, and SaaS Review Brief

## Mission

You are an independent senior software engineer, QA lead, SaaS architect, and security reviewer.

Conduct a complete, evidence-based evaluation of QueueLess. Be direct and ruthless about defects, weak assumptions, incomplete features, security risks, poor UX, operational gaps, and architecture problems.

Do not give a polite summary. Do not assume that a feature works because the code exists. Execute the application, inspect the database behavior, test authorization boundaries, reproduce failures, and distinguish:

- Confirmed working behavior
- Partially implemented behavior
- Untested behavior
- Broken behavior
- Security vulnerability
- Production blocker
- Documentation mismatch

Do not expose secrets in the report. Redact tokens, API keys, cookies, service-role keys, private VAPID keys, and customer access tokens.

---

## Repository

- Project: `QueueLess`
- Repository: `Aaryan2R/QueueLess`
- Local path: `C:\Users\admin\Downloads\QueueLess`
- Main branch: `main`
- Current latest implementation commit: `7e7fb3a`
- Technology: Next.js 15, React 19, TypeScript, Supabase, PostgreSQL, Supabase Auth, Supabase Realtime, Zod, QRCode, Web Push

---

## Product Purpose

QueueLess is a virtual queue SaaS for small businesses.

The intended customer flow is:

1. A business creates a workspace and queue.
2. The business displays a QR code at its location.
3. A customer scans the QR code.
4. The customer joins the queue without creating an account.
5. The customer receives a private ticket URL.
6. The customer can leave the queue, monitor position, receive push alerts, and return when called.
7. Staff operate the live queue.
8. The system calls customers in order.
9. A called customer has 120 seconds to confirm arrival.
10. The first missed turn moves the customer two positions backward.
11. The second missed turn marks the customer as `NO_SHOW`.

The product must eventually be reliable enough for real businesses, not merely a successful local demo.

---

## Current Architecture

### Frontend and server

- Next.js App Router
- React client components for forms, controls, countdowns, and push permission
- Next.js route handlers for mutations and API behavior
- Server components for authenticated dashboard and public ticket rendering
- Middleware for Supabase SSR session refresh
- TypeScript
- ESLint 9
- Prettier

### Backend and database

- Supabase Auth
- Supabase PostgreSQL
- Supabase Row Level Security
- PostgreSQL RPC functions for critical queue operations
- Supabase Realtime for ticket changes
- Server-side Supabase service-role client for push delivery only

### Notifications

- Browser Web Push
- Service worker: `public/sw.js`
- VAPID configuration
- Push subscriptions stored in `push_subscriptions`
- Alert deduplication stored in `ticket_alerts`

### Important design rule

Critical authorization and queue state transitions must be enforced in PostgreSQL functions and RLS, not only in React or route-handler code.

---

## Important Files

### Application

- `src/app/dashboard/page.tsx`
- `src/app/dashboard/sign-out-button.tsx`
- `src/app/dashboard/queues/[id]/page.tsx`
- `src/app/dashboard/queues/[id]/queue-controls.tsx`
- `src/app/dashboard/queues/[id]/ticket-actions.tsx`
- `src/app/dashboard/businesses/[id]/staff/page.tsx`
- `src/app/dashboard/businesses/[id]/staff/staff-form.tsx`
- `src/app/dashboard/businesses/[id]/staff/staff-member-actions.tsx`
- `src/app/q/[slug]/page.tsx`
- `src/app/q/[slug]/join-queue-form.tsx`
- `src/app/ticket/[token]/page.tsx`
- `src/app/ticket/[token]/arrival-window.tsx`
- `src/app/ticket/[token]/push-notification-button.tsx`
- `public/sw.js`

### API routes

- `src/app/api/businesses/route.ts`
- `src/app/api/businesses/[id]/staff/route.ts`
- `src/app/api/public/join/route.ts`
- `src/app/api/public/leave/route.ts`
- `src/app/api/public/push/subscribe/route.ts`
- `src/app/api/public/ticket/arrive/route.ts`
- `src/app/api/public/ticket/check/route.ts`
- `src/app/api/queues/[id]/call-next/route.ts`
- `src/app/api/queues/[id]/status/route.ts`
- `src/app/api/tickets/[id]/status/route.ts`

### Services and security

- `src/lib/services/business.ts`
- `src/lib/services/queue.ts`
- `src/lib/services/push.ts`
- `src/lib/security.ts`
- `src/lib/supabase.ts`
- `src/lib/supabase-browser.ts`
- `src/lib/database.types.ts`
- `middleware.ts`
- `next.config.ts`

### Database migrations

Run in numerical order:

1. `supabase/migrations/202610230001_initial.sql`
2. `supabase/migrations/202610230002_fix_rls_recursion.sql`
3. `supabase/migrations/202611110002_queue_hardening.sql`
4. `supabase/migrations/202611110003_atomic_business_creation.sql`
5. `supabase/migrations/202611110004_customer_leave_queue.sql`
6. `supabase/migrations/202611110005_push_subscriptions.sql`
7. `supabase/migrations/202611110006_arrival_alerts_staff.sql`

Confirm that the live Supabase project has every migration applied before reporting application failures.

---

## Environment Requirements

Use `.env.example` as the variable reference.

Required local variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@example.com
```

Rules:

- Never print secret values.
- Never commit `.env.local`.
- Never send `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Never send `VAPID_PRIVATE_KEY` to the browser.
- Use HTTPS or localhost for browser push testing.
- If push configuration is absent, mark push as unconfigured rather than calling it broken.

---

## Initial Commands

From:

```powershell
cd C:\Users\admin\Downloads\QueueLess
```

Run:

```powershell
npm install
npm run lint
npm run typecheck
npm run build
npm run dev
```

Check:

```powershell
git status --short
git log --oneline -5
```

Do not reset, rebase, delete branches, rewrite history, or discard user changes.

---

## Test Data and Accounts

Create at least:

- Owner Account A
- Owner Account B
- Staff Account C
- Unassigned Account D

Create:

- Business A owned by Owner A
- Business B owned by Owner B
- Staff assignment for Staff C to Business A
- At least two queues if the UI permits it
- At least ten tickets in one queue

Use distinct browser contexts:

- Browser profile A
- Browser profile B
- Incognito/customer browser
- Staff browser

Do not reuse cookies accidentally. Record which account is active in every test.

---

# Functional Test Plan

## 1. Authentication

Test:

- Signup with valid email and password.
- Signup with duplicate email.
- Signup with weak password.
- Signup with malformed email.
- Login with correct credentials.
- Login with incorrect password.
- Login with nonexistent account.
- Logout.
- Browser back after logout.
- Refresh after logout.
- Direct navigation to `/dashboard` after logout.
- Session persistence after refresh.
- Session behavior in a second browser.
- Two accounts in separate browser contexts.
- Account A must never see Account B's businesses.
- Account B must never see Account A's businesses.

Expected:

- No cross-account data.
- Logout clears the authenticated session.
- Protected routes redirect unauthenticated users.
- Failed logout is visible and does not pretend success.

## 2. Business Isolation

Test:

- Owner A creates a business.
- Owner B loads the dashboard.
- Owner B attempts to access Business A by direct URL.
- Owner B attempts to access Business A's queue by guessed UUID.
- Owner B attempts to mutate Business A through route handlers.
- Staff C accesses Business A.
- Unassigned Account D attempts to access Business A.
- Public customer opens Business A's active queue.

Expected:

- Owner A has management access.
- Staff C has only assigned operational access.
- Owner B and Account D cannot manage or read private operational data.
- Public pages expose only intentionally public information.

## 3. Staff Management

Test:

- Owner adds an existing account by email.
- Owner adds the same account twice.
- Owner adds a nonexistent email.
- Owner tries to add themselves.
- Owner removes a staff member.
- Non-owner tries to add staff.
- Non-owner tries to remove staff.
- Staff logs in after assignment.
- Staff logs in after removal.
- Staff accesses the dashboard.
- Staff operates a queue.
- Staff attempts to pause/resume a queue.
- Staff attempts to create a business.

Expected:

- Duplicate assignment is idempotent or clearly rejected.
- Staff can operate tickets.
- Only owners can manage business settings and staff.
- Removed staff loses access immediately after session refresh.

## 4. Queue Management

Test:

- Queue is created automatically with a business.
- Pause queue.
- Resume queue.
- Join while active.
- Join while paused.
- Call Next with no waiting tickets.
- Call Next concurrently from two browsers.
- Call Next with ten tickets.
- Queue maximum size.
- Queue with one ticket.
- Queue with multiple simultaneous requests.
- Direct mutation using an invalid queue ID.
- Direct mutation by an unauthorized account.

Expected:

- No duplicate calls.
- No skipped tickets unless explicitly caused by a missed turn.
- Database locking preserves order.
- Paused queues reject new customers.
- Unauthorized requests fail safely.

## 5. Customer Join Flow

Test:

- Valid name.
- Empty name.
- Maximum-length name.
- Overlong name.
- Optional phone number.
- Malformed phone number.
- Party size 1.
- Party size maximum.
- Party size above maximum.
- Rapid repeated submissions.
- Double-click join.
- Queue at capacity.
- Queue paused during submission.
- Public join from another browser.
- Public join from a different origin.
- SQL, HTML, and JavaScript injection strings.

Expected:

- Server-side validation is authoritative.
- No duplicate ticket from one accidental double submission.
- Stored/displayed customer data is escaped.
- Access tokens are unpredictable and not exposed in logs.

## 6. Ticket Page

Test:

- Open a valid ticket URL.
- Open an invalid token.
- Open a completed ticket.
- Refresh ticket page.
- Check position with 0, 1, 2, 3, and 10 people ahead.
- Verify wait estimate.
- Verify live updates after another ticket is called.
- Verify fallback polling.
- Leave queue.
- Leave queue twice.
- Leave after called.
- Leave after served.
- Leave another customer's ticket by changing the token.

Expected:

- Only the bearer of a valid ticket token can see that ticket.
- Completed tickets cannot be mutated through public actions.
- Position and wait estimate reflect current queue state.
- Error messages do not expose SQL, stack traces, or secrets.

## 7. Push Notifications

Test:

- Browser without Push API.
- Browser with notifications blocked.
- Browser permission granted.
- Browser permission denied.
- Missing VAPID public key.
- Missing service-role key.
- Valid subscription.
- Duplicate subscription.
- Expired subscription.
- Staff calls a subscribed ticket.
- Customer reaches 3 groups ahead.
- Customer reaches 2 groups ahead.
- Customer reaches 1 group ahead.
- Repeated queue updates must not spam duplicate alerts.
- Notification click opens the correct ticket.
- Notification from another ticket must not open the wrong ticket.

Expected:

- Push failure never breaks queue mutation.
- Alert levels are deduplicated.
- Expired subscriptions are removed.
- Private ticket URLs are not logged or exposed in notification analytics.

## 8. 120-Second Arrival Window

Test:

- Call a ticket.
- Verify deadline is approximately 120 seconds after call.
- Verify countdown is visible.
- Click “I'm here” before expiry.
- Confirm ticket becomes `READY`.
- Confirm deadline clears.
- Let first deadline expire.
- Confirm ticket returns to `WAITING`.
- Confirm missed count becomes 1.
- Confirm ticket moves two positions backward when enough tickets exist.
- Confirm ticket remains valid when fewer than two tickets are behind it.
- Let the same ticket expire a second time.
- Confirm ticket becomes `NO_SHOW`.
- Confirm completed timestamp exists.
- Try to confirm arrival after expiry.
- Try to expire an already-ready ticket.
- Refresh during countdown.
- Open countdown in two browsers.
- Simulate delayed network requests.
- Repeatedly call the expiration endpoint.

Expected:

- The database, not the browser clock, decides whether the deadline expired.
- Expiration is idempotent.
- Concurrent expiration calls cannot process the same miss twice.
- The customer cannot bypass the second-miss rule.
- Staff cannot manually force an invalid state transition.

## 9. Ticket State Machine

Valid transitions:

```text
WAITING -> CALLED
WAITING -> CANCELLED
CALLED -> READY
CALLED -> SERVED
CALLED -> NO_SHOW
READY -> SERVED
READY -> NO_SHOW
CALLED -> WAITING   system first missed-turn requeue
CALLED -> NO_SHOW   system second missed-turn discard
```

Attempt every invalid transition through:

- UI
- Route handler
- Direct Supabase RPC call
- Repeated concurrent request

Verify every valid mutation creates correct status history.

---

# Security Audit Plan

## Authentication and authorization

- Inspect every route handler for authentication checks.
- Inspect every RPC for authorization checks.
- Verify RLS is enabled on every sensitive table.
- Verify RLS policies do not recurse.
- Verify policy logic does not accidentally expose all active businesses.
- Verify staff assignment checks are owner-only.
- Verify removed staff loses access.
- Verify ownership cannot be changed through client input.
- Verify users cannot supply another user's ID to create ownership.

## IDOR and bearer-token abuse

- Replace business IDs, queue IDs, ticket IDs, assignment IDs, and ticket tokens.
- Attempt read, update, cancel, call, serve, and staff operations.
- Test unauthorized resource access with valid authentication.
- Test public token access with guessed, shortened, altered, and copied tokens.
- Verify access tokens are not sequential.
- Check whether tokens appear in Referer headers, logs, analytics, error messages, or URLs sent to third parties.

## CSRF and origin validation

- Test same-origin requests.
- Test localhost versus `127.0.0.1`.
- Test LAN IP access.
- Test missing `Origin`.
- Test forged `Origin`.
- Test `Origin: null`.
- Test cross-site form submission.
- Test cross-site fetch.
- Verify configured and forwarded host handling does not trust arbitrary attacker-controlled origins.

## Input validation and injection

Test all string inputs with:

- SQL injection
- HTML injection
- Script tags
- Event-handler attributes
- Unicode control characters
- Very long strings
- Null bytes
- Newlines
- JSON type confusion
- Negative numbers
- Floating-point numbers
- Huge integers
- Duplicate JSON properties

Inspect:

- Zod schemas
- PostgreSQL constraints
- RPC validation
- UI-only validation assumptions

## Secrets and sensitive data

- Search tracked files for private keys, passwords, tokens, service-role keys, and `.env` files.
- Inspect browser bundles for server-only variables.
- Inspect public API responses for internal fields.
- Inspect server logs for ticket URLs and credentials.
- Verify `.gitignore`.
- Verify production environment variable separation.

## Rate limiting and abuse

Test:

- Signup abuse.
- Login brute force.
- Public queue join spam.
- Leave spam.
- Ticket check polling.
- Push subscription spam.
- Staff add/remove abuse.
- Call-next spam.
- Status mutation spam.
- Large request bodies.
- Many concurrent requests.

Document that the current in-memory limiter is not safe for multi-instance production deployment unless it has been replaced.

## Headers and browser security

Verify:

- Content Security Policy.
- HSTS in production.
- X-Content-Type-Options.
- Referrer-Policy.
- Frame protection.
- Permissions-Policy.
- Cache-Control for private ticket pages.
- No sensitive page cached by a shared proxy.
- Service worker scope and update behavior.

## Denial of service and reliability

- Large party sizes.
- Large queue sizes.
- Thousands of tickets.
- Many Realtime connections.
- Rapid ticket polling.
- Repeated QR generation.
- Push provider failures.
- Database timeout.
- Supabase unavailable.
- Realtime disconnect.
- Browser offline/online transitions.
- Partial RPC failure.

---

# Database Review

Inspect the live schema, not only migration files.

Verify:

- Every migration applies cleanly to a fresh database.
- Migrations are idempotent where expected.
- Functions have correct `security definer` and `search_path` settings.
- Security-definer functions cannot be abused with arbitrary parameters.
- Foreign keys and delete behavior are intentional.
- Unique constraints match business rules.
- Check constraints match application validation.
- Indexes support queue ordering and active-ticket lookups.
- Ticket status history is complete.
- Alert deduplication is race-safe.
- Arrival expiration is race-safe.
- Requeue ordering cannot create duplicates or negative permanent sequence numbers.
- Old ticket retention/archival is addressed.
- Audit logging is sufficient for a SaaS business.
- Service-role access is limited to server-only operations.

Run query plans for:

- Public ticket lookup.
- Queue waiting-ticket lookup.
- Call Next.
- Dashboard business list.
- Staff list.
- Push subscription lookup.

---

# API Review

For every route, record:

- Authentication requirement
- Authorization rule
- Input schema
- Rate limit
- CSRF/origin protection
- Success response
- Error response
- Idempotency behavior
- Logging behavior
- Sensitive fields returned
- Concurrency behavior

Routes to review:

- `POST /api/businesses`
- `POST /api/businesses/[id]/staff`
- `DELETE /api/businesses/[id]/staff`
- `POST /api/public/join`
- `POST /api/public/leave`
- `POST /api/public/push/subscribe`
- `POST /api/public/ticket/arrive`
- `POST /api/public/ticket/check`
- `POST /api/queues/[id]/call-next`
- `POST /api/queues/[id]/status`
- `POST /api/tickets/[id]/status`

---

# UX and Product Review

Evaluate on desktop and mobile widths:

- 320px
- 375px
- 414px
- 768px
- 1024px
- 1440px

Review:

- Signup and login clarity.
- Error messages.
- Loading states.
- Double-click protection.
- Disabled controls.
- Countdown readability.
- Queue position clarity.
- Push permission explanation.
- QR usability.
- Staff workflow speed.
- Customer recovery after refresh.
- Customer recovery after connection loss.
- Accessibility and keyboard navigation.
- Focus states.
- Color contrast.
- Screen-reader labels.
- Mobile tap targets.
- Empty states.
- Long names and long business names.
- Timezone display.
- Browser compatibility.

Identify every place where a customer or staff member could become confused.

---

# SaaS Production Review

Review the following production requirements:

- Tenant isolation.
- Owner/staff roles.
- Staff invitation lifecycle.
- Account recovery.
- Email verification.
- Password reset.
- Business settings.
- Queue configuration.
- Branding.
- Analytics.
- Queue history.
- Audit logs.
- Data retention.
- Backups and recovery.
- Monitoring.
- Error tracking.
- Rate limiting.
- Distributed deployment.
- Web Push reliability.
- Notification opt-out.
- Privacy policy requirements.
- Terms of service requirements.
- GDPR/data deletion considerations.
- Abuse reporting.
- Billing readiness.
- Multi-location readiness.
- Custom domains.
- Feature flags.
- Database migrations.
- Rollback strategy.
- CI/CD.
- Dependency security.
- Accessibility.
- Support workflow.
- Incident response.

Explicitly identify what is MVP-ready and what is only demo-ready.

---

# Automated Test Requirements

If a test framework is absent, do not silently install one without documenting the decision. Recommend the smallest suitable stack, then create focused tests if authorized.

At minimum, propose or implement:

### Unit tests

- Input schemas.
- Origin validation.
- Rate-limit behavior.
- Queue position calculation.
- Arrival deadline calculation.
- Missed-turn rules.
- Alert-level selection.

### Database/integration tests

- RLS tenant isolation.
- Owner versus staff permissions.
- Queue state transitions.
- Concurrent Call Next.
- Concurrent expiration.
- Requeue ordering.
- Alert deduplication.

### API tests

- Authentication failures.
- Authorization failures.
- Invalid payloads.
- CSRF failures.
- Rate limits.
- Idempotency.
- Safe error responses.

### Browser tests

- Signup/login/logout.
- Owner isolation.
- Customer join.
- Staff operations.
- Push permission flow.
- Arrival countdown.
- First and second missed turn.
- Mobile layout.

---

# Required Evidence

The final report must include:

1. Exact commands executed.
2. Exact test environment.
3. Browser/device details.
4. Database migration state.
5. Screenshots or redacted logs for important failures.
6. Reproduction steps for every confirmed defect.
7. Severity for every finding.
8. Affected file, route, RPC, table, or policy.
9. Security impact.
10. Recommended fix.
11. Whether the issue blocks launch.

Do not report vague concerns without explaining how to verify them.

---

# Severity Definitions

## Critical

Remote compromise, cross-tenant data access, credential compromise, destructive unauthorized action, or a production blocker affecting the core queue.

## High

Reliable authorization bypass, severe data loss, broken core workflow, unsafe payment/privacy behavior, or a major availability issue.

## Medium

Meaningful security weakness, inconsistent business behavior, data integrity risk, or important missing production control.

## Low

Limited-impact defect, usability issue, maintainability concern, or hardening gap.

## Informational

Improvement, documentation mismatch, architectural observation, or future recommendation.

---

# Scoring Rubric

Score each category from 0 to 10 and justify the score with evidence.

| Category | Weight |
|---|---:|
| Functional correctness | 15% |
| Authentication and session security | 10% |
| Authorization and tenant isolation | 15% |
| Database integrity and concurrency | 10% |
| Queue state-machine correctness | 10% |
| Customer UX and accessibility | 8% |
| Staff/operator UX | 7% |
| Notifications and realtime behavior | 7% |
| API quality and validation | 6% |
| Automated test maturity | 5% |
| Performance and scalability | 4% |
| Observability and operations | 3% |

Calculate:

```text
overall_score = sum(category_score * category_weight)
```

Also provide separate launch ratings:

- Local demo readiness: 0–10
- Closed beta readiness: 0–10
- Small-business production readiness: 0–10
- Multi-tenant SaaS readiness: 0–10
- Security confidence: 0–10

Do not inflate scores because the UI looks polished.

---

# Final Report Format

## Executive verdict

State one:

- Do not run
- Prototype only
- Demo-ready
- Closed-beta candidate
- Small-production candidate
- Production-ready with conditions

## Scores

Use the weighted table and justify every score.

## Blocking findings

List Critical and High findings first.

## Security findings

For each:

- ID
- Severity
- Evidence
- Reproduction
- Impact
- Fix
- Launch blocker: yes/no

## Functional findings

Use the same structure.

## Test coverage summary

State what was actually tested and what could not be tested.

## Architecture critique

Discuss:

- What is well designed.
- What is fragile.
- What will fail at scale.
- What should be refactored.
- What should not be changed yet.

## SaaS readiness critique

Evaluate tenancy, operations, privacy, support, retention, observability, and deployment.

## Recommended priority order

Rank fixes as:

1. Immediate security/data-integrity fixes
2. Core workflow fixes
3. Reliability fixes
4. Production hardening
5. UX improvements
6. Future product features

## Final recommendation

Answer clearly:

- Can this be demonstrated?
- Can a real business use it today?
- What must be fixed before a closed beta?
- What must be fixed before production?
- What is the single highest-risk issue?
- What is the strongest part of the system?

Be merciless, specific, and evidence-driven.
