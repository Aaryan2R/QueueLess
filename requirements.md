# QueueLess – Requirements

## Functional Requirements

### FR-01 Authentication
The system shall allow business owners and staff to securely authenticate.

### FR-02 Business Creation
An authenticated owner shall be able to create a business profile.

### FR-03 Business Customization
The owner shall be able to configure business name, logo, theme, welcome message, contact details, and queue behavior.

### FR-04 Queue Creation
The owner shall be able to create one or more queue definitions according to the subscription/scope configured for the project.

### FR-05 Queue Configuration
The owner shall be able to set queue name, opening/closing time, maximum queue size, estimated service time, cancellation rules, and no-show grace period.

### FR-06 QR Generation
The system shall generate a QR code that points to the public queue page.

### FR-07 Customer Join
A customer shall be able to join an active queue using the public page.

### FR-08 Ticket Generation
The system shall create a unique ticket number and store the customer's queue entry.

### FR-09 Queue Position
The customer shall be able to view current position, number of customers ahead, status, and estimated wait.

### FR-10 Staff Queue Control
Staff shall be able to call next, mark ready, seat/serve, cancel, and mark no-show according to permissions.

### FR-11 Real-Time Update
Queue changes made by authorized staff shall be reflected on connected customer pages without requiring a full page refresh where real-time technology is enabled.

### FR-12 Leave Queue
A customer shall be able to leave an active waiting queue when the business allows cancellation.

### FR-13 Queue Pause
Authorized business users shall be able to pause and resume queue joining.

### FR-14 Queue History
The system shall retain completed queue tickets and their status history for reporting.

### FR-15 Analytics
The system shall calculate basic statistics such as customers served, average wait, no-shows, and queue volume.

### FR-16 Staff Management
The owner shall be able to add, deactivate, and manage staff access.

### FR-17 Platform Administration
Platform admins shall be able to view and manage businesses and platform-level records.

## Non-Functional Requirements
- **Usability:** Customer joining should require minimal steps.
- **Performance:** Queue actions should complete quickly under normal project load.
- **Reliability:** Ticket numbers and queue ordering must not be duplicated or corrupted.
- **Security:** Role-based authorization and protected credentials are mandatory.
- **Maintainability:** Business logic must be separated from UI logic where practical.
- **Responsiveness:** Public queue pages and dashboards must work on desktop and mobile browsers.
- **Scalability:** Data model should support multiple businesses.
- **Accessibility:** Buttons, labels, contrast, keyboard navigation, and status messages should be reasonably accessible.
