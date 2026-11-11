# QueueLess – Security Requirements

## Authentication
- Hash passwords using a modern password hashing algorithm such as bcrypt/Argon2.
- Do not log passwords or authentication secrets.
- Validate credentials on the server.

## Authorization
Use role-based authorization:
- PLATFORM_ADMIN
- OWNER
- STAFF
- CUSTOMER_PUBLIC

Never rely only on hidden frontend buttons. Backend endpoints must enforce the role.

## Tenant Isolation
A staff member from Business A must not be able to query or modify Business B data by changing an ID in a request URL.

## Input Security
- Validate and sanitize user input.
- Use parameterized queries/ORM protections.
- Validate uploaded file type and size.
- Limit QR/public endpoints against abuse.

## Privacy
- Do not show customer phone numbers publicly.
- Collect only information needed for queue operation.
- Provide a reasonable retention policy for old queue entries.

## Web Security
Consider:
- HTTPS in production.
- CSRF protection where cookie authentication is used.
- Secure cookies.
- Rate limiting on authentication and public join endpoints.
- CORS restricted to known frontend origins.
- Security headers.

## Auditability
Important actions should be timestamped and associated with the user who performed them.
