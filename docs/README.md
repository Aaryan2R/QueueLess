# QueueLess documentation

This directory is the maintained project knowledge base. The root `README.md` is the short product and onboarding page; these documents contain the deeper implementation details.

| Guide | Contents |
| --- | --- |
| [Product](product.md) | Problem, solution, roles, scope and user journeys |
| [Architecture](architecture.md) | Runtime design, data flow, routes and database entities |
| [Development](development.md) | Local setup, environment variables, migrations and checks |
| [Security](security.md) | Authorization model, secret handling and production gaps |
| [Operations](operations.md) | End-to-end demo, troubleshooting and deployment checklist |
| [Roadmap](roadmap.md) | Current completion state and prioritized next work |
| [Audits](audits/) | Historical reviews, audit reports and test briefs |

## Documentation rules

- Keep current behavior documented here, not in duplicated root-level notes.
- Update the relevant guide when a feature or security boundary changes.
- Keep audit reports under `docs/audits/` as historical evidence; do not treat them as current implementation truth without verification.
- Use the source code and applied Supabase migrations as the final authority when documentation conflicts with implementation.
