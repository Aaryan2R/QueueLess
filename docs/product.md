# Product guide

## Purpose

QueueLess is a multi-business virtual queue SaaS for small businesses. It reduces physical crowding while giving staff a simple operating screen and customers a clear view of their place in line.

## The core experience

```text
Business signup
  -> Create business and queue
  -> Configure capacity and service-time estimate
  -> Display queue QR code
  -> Customer scans and joins without an account
  -> Private ticket shows position and estimated wait
  -> Staff calls and serves the next eligible ticket
  -> Customer receives proximity/call alerts
  -> History and analytics record the result
```

## Roles

| Role | Responsibility |
| --- | --- |
| Owner | Owns the business, queue settings, staff assignments and analytics |
| Staff | Operates queues for businesses to which they are assigned |
| Customer | Joins and tracks a queue through a private ticket link |
| Platform administrator | Planned platform-level administration; not part of the current MVP |

## Implemented scope

- Supabase Auth login, signup, logout and password recovery
- Business and queue creation
- Queue pause/resume and owner-only queue settings
- QR/public queue pages
- Customer join, position tracking and leave-queue flow
- Staff assignment and queue operations
- Ticket states: `WAITING`, `CALLED`, `READY`, `SERVED`, `NO_SHOW`, `CANCELLED`
- Push notifications and proximity alerts when configured
- 120-second arrival window, first-miss requeue and second-miss no-show
- Queue history and basic analytics
- RLS-backed tenant isolation and initial security tests

## Deliberately deferred

Native mobile apps, billing, SMS/WhatsApp/email integrations, multi-branch administration, advanced forecasting, customer accounts, POS integration, file uploads and a full platform-admin console.

## Success scenario

An owner can create a queue and display its QR code; a customer can join and receive a token; staff can call and serve the customer; the customer view updates; and analytics reflect the completed ticket.
