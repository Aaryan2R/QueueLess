# Security guide

## Security boundaries

| Boundary | Enforcement |
| --- | --- |
| Authentication | Supabase Auth session cookies |
| Tenant isolation | PostgreSQL RLS and server-side business authorization |
| Queue mutations | Atomic database functions and validated transitions |
| Public tickets | Strict bearer-token validation and private cache headers |
| Public abuse | Origin checks and request rate limiting |
| Push delivery | Server-only service-role and VAPID credentials |
| Browser hardening | Security headers and disabled `X-Powered-By` |

## Rules

- Treat a ticket URL as a private bearer credential.
- Never expose service-role keys, private VAPID keys, cookies or customer data.
- Do not trust hidden UI controls for authorization.
- Do not let the client choose token numbers, queue order or capacity decisions.
- Keep public views free of unnecessary customer phone data.
- Validate all public input on the server.

## Current controls

- Zod validation for ticket tokens and public input
- RLS policies for business, queue, ticket and staff access
- Security-definer functions with explicit search paths for cross-table authorization
- Atomic call-next and arrival/no-show behavior
- Deduplicated push-alert claiming
- Private no-store response behavior for ticket pages
- Initial Vitest coverage for token validation, rate-limit reset and ticket transitions

## Remaining production hardening

1. Replace in-memory rate limiting with a distributed store such as Upstash Redis.
2. Add structured logging, monitoring, health checks and error tracking.
3. Add audit-log storage for sensitive owner/staff actions.
4. Expand API, RLS and multi-tenant integration tests.
5. Define retention, deletion, privacy and legal policies.
6. Review email verification and abuse prevention before public launch.
7. Revisit the Next.js major-version upgrade separately with a compatibility test.
