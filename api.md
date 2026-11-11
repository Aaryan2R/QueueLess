# QueueLess – API Specification

## Authentication
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register owner/staff account where allowed |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |

## Businesses
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/businesses` | Create business |
| GET | `/api/businesses/:id` | Get business |
| PATCH | `/api/businesses/:id` | Update business |
| PATCH | `/api/businesses/:id/settings` | Update branding/settings |

## Queues
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/businesses/:businessId/queues` | Create queue |
| GET | `/api/businesses/:businessId/queues` | List queues |
| GET | `/api/queues/:queueId` | Get queue |
| PATCH | `/api/queues/:queueId` | Update queue |
| POST | `/api/queues/:queueId/pause` | Pause queue |
| POST | `/api/queues/:queueId/resume` | Resume queue |
| GET | `/api/queues/:queueId/qr` | Get/generate QR information |

## Public Customer Endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/public/queues/:slug` | Public queue details |
| POST | `/api/public/queues/:slug/join` | Join queue |
| GET | `/api/public/tickets/:ticketId` | Ticket status |
| POST | `/api/public/tickets/:ticketId/leave` | Leave queue |

## Staff Endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/queues/:queueId/entries` | Live entries |
| POST | `/api/queues/:queueId/call-next` | Call next eligible customer |
| PATCH | `/api/queue-entries/:entryId/status` | Change ticket status |
| GET | `/api/queues/:queueId/history` | Queue history |

## Analytics
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/businesses/:businessId/analytics` | Business analytics |
| GET | `/api/queues/:queueId/analytics` | Queue analytics |

## API Conventions
- JSON request/response bodies.
- Meaningful HTTP status codes.
- Consistent error shape.
- Authentication required for private routes.
- Business/role authorization on every private resource.
- Server-side validation on every write operation.
