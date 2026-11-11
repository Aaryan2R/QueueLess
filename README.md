# QueueLess

**QueueLess – A customizable web-based virtual queue platform for small businesses.**

## 1. Project Overview
QueueLess allows cafés, restaurants, salons, clinics, and similar service-based businesses to create their own digital queue space online. A business owner creates and customizes a queue, generates a QR code, and places it at the business entrance or service point. Customers scan the QR code, enter basic details, receive a queue token, and track their position without standing in a physical line or installing a mobile application.

## 2. Core Value
- No customer app installation.
- Business-specific branded queue page.
- QR-based queue joining.
- Live queue position and status.
- Estimated waiting time.
- Staff controls for calling and completing customers.
- Basic business analytics.

## 3. Primary Roles
- **Platform Admin:** manages the QueueLess platform and businesses.
- **Business Owner:** creates the business space, customizes queues, manages staff and settings.
- **Staff:** operates live queues and updates customer status.
- **Customer:** joins and tracks a queue without creating a full platform account.

## 4. Implemented Stack
- Next.js + TypeScript (one full-stack web application).
- Supabase PostgreSQL for relational data and queue-safe database functions.
- Supabase Auth for owner/staff authentication.
- Supabase Realtime for live dashboard updates, with refresh/polling-safe pages.
- Vercel for the web deployment.
- QR links generated from public queue URLs.

This intentionally avoids a separately deployed API, custom auth server, and standalone WebSocket service. Those can be added later only if the product genuinely needs them.

## 5. MVP Scope
1. Business registration/login.
2. Business profile and branding customization.
3. Queue creation and configuration.
4. QR code generation.
5. Customer queue joining.
6. Unique ticket generation.
7. Live queue management.
8. Customer status page.
9. Estimated wait time.
10. Staff role.
11. Queue history.
12. Basic analytics.

## 6. Future / Optional Features
- Email/SMS/WhatsApp notifications.
- Multiple branches.
- Multiple concurrent queues.
- Advanced wait-time prediction.
- Customer feedback.
- Subscription billing.
- PWA support.
- Advanced analytics.

The first implementation intentionally defers customer accounts, billing, external notifications, file uploads, custom domains, and a full platform-admin console.

## 7. Success Criteria
A reviewer should be able to complete this demonstration:

`Create Business → Customize Queue → Generate QR → Scan/Join → Receive Token → Staff Calls Next → Customer Status Updates → Mark Served → Analytics/History Updated`

## 8. Documentation Index
- [Project Brief](project-brief.md)
- [Context](context.md)
- [Requirements](requirements.md)
- [User Stories](user-stories.md)
- [Acceptance Criteria](acceptance-criteria.md)
- [Design](design.md)
- [Architecture](architecture.md)
- [DFD](dfd.md)
- [Database](database.md)
- [API](api.md)
- [Business Rules](rule.md)
- [UI Specification](ui.md)
- [Security](security.md)
- [Testing](testing.md)
- [Tasks](task.md)
- [Roadmap](roadmap.md)
- [Decisions](decisions.md)
- [Glossary](glossary.md)
- [Folder Structure](folder-structure.md)
- [AI Coding Rules](AI_RULES.md)
