# QueueLess – Acceptance Criteria

## Business Setup
- Owner can register/login.
- Owner can create a business.
- Owner can save branding and queue settings.
- Owner can publish/activate a queue.

## QR Flow
- A QR code is generated for an active public queue.
- Scanning/opening the URL shows the correct business/queue.
- The QR URL does not expose private admin pages.

## Customer Flow
- Customer can join an active queue.
- Invalid/missing information is rejected with a useful message.
- Each active entry receives a unique token.
- Customer can view token, position, wait estimate, and status.
- Customer can leave the queue if allowed.

## Staff Flow
- Authorized staff can view the active queue.
- Call Next selects the correct next eligible ticket.
- A ticket cannot be served twice.
- No-show and cancellation states remove a ticket from active waiting position.

## Real-Time Flow
- When staff changes ticket state, connected customer views reflect the new status without a manual refresh where real-time features are enabled.

## Analytics
- Served count is correct.
- Average wait is calculated from stored timestamps.
- No-show/cancelled counts are based on final ticket status.

## Security
- Customers cannot access owner/staff actions.
- Staff cannot manage businesses they are not assigned to.
- Passwords are never stored as plain text.
