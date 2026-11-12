# Architecture

## Runtime shape

```mermaid
flowchart TB
    Browser[Customer / owner / staff browser]
    Next[Next.js 15 application]
    Auth[Supabase Auth]
    DB[(Supabase PostgreSQL)]
    Realtime[Supabase Realtime]
    Push[Web Push service]

    Browser --> Next
    Next --> Auth
    Next --> DB
    Browser -. live refresh .-> Realtime
    Realtime --> DB
    Next --> Push
```

QueueLess is a single full-stack Next.js application. Next.js pages, server components, client components and route handlers share one deployment. Supabase is the source of truth for identity, authorization, queue state and history.

## Queue lifecycle

```mermaid
stateDiagram-v2
    [*] --> WAITING
    WAITING --> CALLED
    WAITING --> CANCELLED
    CALLED --> READY
    CALLED --> SERVED
    CALLED --> NO_SHOW
    READY --> SERVED
    READY --> NO_SHOW
    SERVED --> [*]
    NO_SHOW --> [*]
    CANCELLED --> [*]
```

The database and server-side validation enforce transitions. The browser never decides queue order, capacity, token generation or authorization.

## Source layout

| Path | Responsibility |
| --- | --- |
| `src/app/` | Routes, pages, forms, dashboard and customer experience |
| `src/app/api/` | Authenticated and public route handlers |
| `src/lib/services/` | Business, queue and push service logic |
| `src/lib/security.ts` | Token validation, origin checks and rate limiting |
| `src/lib/database.types.ts` | Supabase-generated database types |
| `supabase/migrations/` | Ordered schema, RLS and queue business functions |
| `tests/` | Focused Vitest unit tests |
| `public/sw.js` | Push notification service worker |

## Data model

| Entity | Purpose |
| --- | --- |
| `businesses` | Tenant and owner-owned business profile |
| `queues` | Queue configuration and status |
| `tickets` | Customer queue entries and lifecycle timestamps |
| `ticket_status_history` | State transition history |
| `staff_assignments` | Owner-managed staff access |
| `push_subscriptions` | Browser push endpoints |
| `ticket_alerts` | Deduplicated proximity/call alert claims |

RLS policies and security-definer database functions enforce tenant boundaries and atomic queue mutations.

## API areas

| Area | Routes |
| --- | --- |
| Business | `/api/businesses`, `/api/businesses/[id]/staff` |
| Public customer | `/api/public/join`, `/api/public/leave`, `/api/public/ticket/*`, `/api/public/push/subscribe` |
| Queue operations | `/api/queues/[id]`, `/api/queues/[id]/call-next`, `/api/queues/[id]/status` |
| Ticket operations | `/api/tickets/[id]/status` |

## Data flow: customer arrival

```mermaid
sequenceDiagram
    participant C as Customer
    participant N as Next.js
    participant D as Supabase
    participant S as Staff

    C->>N: Open private ticket
    N->>D: Read ticket by validated token
    S->>N: Call next
    N->>D: Atomically mark CALLED
    N-->>C: Push/call alert
    C->>N: Confirm arrival
    N->>D: Mark READY within 120 seconds
    D-->>S: Queue state update
```
