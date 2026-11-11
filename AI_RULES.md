# QueueLess – AI Coding Rules

These rules apply when using AI coding assistants on QueueLess.

## Core Rules
1. Do not invent requirements outside the project documentation.
2. Treat `requirements.md`, `rule.md`, `design.md`, and `task.md` as the main project sources of truth.
3. Complete the smallest useful change before adding optional features.
4. Do not change queue business rules silently.
5. Never trust the frontend for authorization, queue order, token generation, or capacity enforcement.
6. Keep customer-facing pages simple and mobile-friendly.
7. Use reusable components/services instead of duplicating business logic.
8. Validate all input on the backend even when frontend validation exists.
9. Do not hard-code secrets, database passwords, API keys, or JWT secrets.
10. Do not expose internal IDs or private customer information unnecessarily.

## Queue Logic Rules
- Server decides who is next.
- Server generates token/sequence values.
- Invalid ticket state transitions must be rejected.
- Cancelled/no-show/served tickets must not be counted as waiting.
- A queue at maximum capacity must reject new entries.

## Code Quality
- Prefer readable names over clever one-liners.
- Keep controllers thin; put queue/business logic into services.
- Return predictable API responses.
- Add tests for meaningful business logic.
- Do not mark a task complete without verifying it.

## Change Workflow
Before implementing a feature:
1. Read relevant requirements and rules.
2. Update `task.md` if scope changes.
3. Implement backend rules first for security-sensitive behavior.
4. Implement frontend flow.
5. Test happy path and important failure cases.
6. Update documentation when behavior changes.
