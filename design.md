# QueueLess – Design Specification

## Product Design Principles
1. **Fast customer entry:** scan, fill minimum details, join.
2. **Business ownership:** each business gets a branded public queue page.
3. **Operational simplicity:** staff actions should be obvious and one-click where safe.
4. **Transparent waiting:** show position and estimate clearly.
5. **No unnecessary app:** use normal web browsers.

## Main Screens
### Public Landing Page
- QueueLess value proposition
- Create Business
- Login
- How It Works

### Business Setup
- Business details
- Branding
- Queue settings
- QR generation

### Owner Dashboard
- Current queues
- Current number waiting
- Queue status
- Staff management
- Analytics
- Settings

### Staff Queue Screen
- Current serving ticket
- Waiting tickets
- Call Next
- Mark Ready
- Mark Served
- No Show
- Cancel
- Pause Queue

### Customer Queue Page
- Business branding
- Queue name
- Join form
- Ticket number
- Current position
- Customers ahead
- Estimated wait
- Current status
- Leave Queue

## Customer Join UX
```text
SCAN QR
  ↓
Business Queue Page
  ↓
Enter Name / Phone / Party Size (as configured)
  ↓
Join Queue
  ↓
Ticket Generated
  ↓
Track Status
```

## Visual Hierarchy
The customer page must prioritize, in this order:
1. Ticket number
2. Status
3. Number ahead
4. Estimated wait
5. Actions

## State Design
Ticket states:
- WAITING
- CALLED
- READY
- SERVED
- NO_SHOW
- CANCELLED

Queue states:
- ACTIVE
- PAUSED
- CLOSED

## Error UX
Errors must say what happened and what the user can do next. Avoid generic messages such as "Something went wrong" when a specific reason is available.
