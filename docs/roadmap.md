# Roadmap

## Completed foundation

- Full-stack Next.js/Supabase application
- Authentication and session handling
- Multi-business owner/staff access model
- QR-based customer join and private ticket pages
- Queue lifecycle and atomic status transitions
- Queue settings, history and analytics
- Push notifications and arrival-window behavior
- Security headers, validation, RLS hardening and initial tests

## Next priorities

| Priority | Work | Why |
| --- | --- | --- |
| P0 | Distributed rate limiting | Required for multi-instance production deployment |
| P0 | API/RLS integration tests | Prove tenant isolation and mutation authorization |
| P1 | Structured logs and monitoring | Detect failures in real deployments |
| P1 | Audit logs and retention policy | Improve accountability and privacy readiness |
| P1 | Accessibility pass | Improve keyboard, focus and screen-reader behavior |
| P2 | Email verification and profile management | Improve account lifecycle |
| P2 | Billing, branches and advanced analytics | Product expansion after core operations mature |

## Release principle

Do not add optional product features at the expense of queue correctness, tenant isolation, observability or test coverage.
