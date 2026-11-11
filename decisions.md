# QueueLess – Architecture Decision Log

## ADR-001: Web Platform Instead of Native App
**Decision:** Build QueueLess as a browser-based platform.

**Reason:** Customers should be able to scan a QR code and join immediately without app installation.

## ADR-002: Business-Specific Public URL
**Decision:** Each business receives a unique public slug/queue URL.

**Reason:** Makes each queue easy to brand, share and represent as the business's own service.

## ADR-003: Server-Side Queue Ordering
**Decision:** The backend is the authority for token numbering and queue order.

**Reason:** Prevents client-side manipulation and inconsistent ordering.

## ADR-004: Real-Time Updates
**Decision:** Use WebSockets/Socket.IO for live queue changes when available.

**Reason:** A queue is an operational system; customer position should update promptly without manual refresh.

## ADR-005: MVP First
**Decision:** Prioritize the complete queue lifecycle over optional integrations.

**Reason:** A reliable end-to-end workflow is more valuable for a semester project than many unfinished features.
