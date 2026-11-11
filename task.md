# QueueLess – Task Backlog

## Phase 0 – Planning
- [ ] Finalize project scope.
- [ ] Finalize user roles.
- [ ] Finalize MVP features.
- [ ] Draw ER diagram.
- [ ] Draw DFD Level 0/1/2.
- [ ] Finalize UI wireframes.

## Phase 1 – Project Setup
- [x] Initialize frontend.
- [x] Initialize backend through Next.js route handlers.
- [x] Configure environment variables.
- [x] Configure database.
- [x] Establish frontend-backend API communication.
- [x] Add basic project error handling.

## Phase 2 – Authentication
- [x] Owner registration.
- [x] Login.
- [x] Logout.
- [x] Password hashing through Supabase Auth.
- [x] Session handling through Supabase SSR cookies.
- [ ] Role middleware.

## Phase 3 – Business Management
- [x] Create business.
- [ ] Business profile.
- [ ] Business slug.
- [ ] Branding settings.
- [ ] Welcome message.
- [ ] Business settings page.

## Phase 4 – Queue Management
- [x] Create queue automatically with a business.
- [ ] Edit queue.
- [x] Activate/pause/resume queue.
- [ ] Configure maximum capacity.
- [ ] Configure average service time.
- [x] Queue status endpoint.

## Phase 5 – QR + Customer Flow
- [x] Generate QR code.
- [x] Public queue page.
- [x] Join form.
- [x] Server-side token generation.
- [x] Customer ticket page.
- [x] Position calculation.
- [x] Wait estimate.
- [x] Leave queue.

## Phase 6 – Staff Operations
- [ ] Add staff.
- [ ] Staff login.
- [x] Live queue screen.
- [x] Call Next.
- [x] Mark Ready.
- [x] Mark Served.
- [x] Mark No Show.
- [x] Cancel ticket.

## Phase 7 – Real-Time
- [x] Add Supabase Realtime connection.
- [x] Broadcast queue changes through Postgres changes.
- [x] Update customer page live.
- [ ] Handle reconnects robustly.

## Phase 8 – Analytics
- [ ] Served count.
- [ ] Average wait.
- [ ] Queue volume.
- [ ] No-show count.
- [ ] Daily/weekly summary.

## Phase 9 – Testing and Security
- [ ] Unit tests.
- [ ] API tests.
- [ ] Integration tests.
- [ ] Authorization tests.
- [ ] Input validation.
- [ ] Rate limiting.
- [ ] Mobile testing.
- [ ] Error-state testing.

## Phase 10 – Deployment and Submission
- [ ] Prepare production build.
- [ ] Deploy frontend.
- [ ] Deploy backend.
- [ ] Deploy/configure database.
- [ ] Configure HTTPS/domain if available.
- [ ] Prepare screenshots.
- [ ] Prepare project report.
- [ ] Prepare presentation.
- [ ] Prepare demonstration script.
- [ ] Prepare GitHub README.

## MVP Priority
**P0 – Must Have:** authentication, business setup, queue, QR, customer join, token, staff queue, status, basic analytics.

**P1 – Should Have:** customization, real-time updates, staff accounts, queue pause, history.

**P2 – Nice to Have:** notifications, advanced prediction, feedback, multi-branch, subscriptions.
