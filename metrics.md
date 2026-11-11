# QueueLess – Project Metrics

## Core Operational Metrics
### Customers Served
Count of tickets with final status `SERVED` during the selected period.

### Average Wait Time
For served tickets:
`served/called (or ready) timestamp – joined timestamp`, depending on the agreed project definition.

### Average Service Time
For served tickets:
`served timestamp – service start timestamp`.

### No-Show Rate
`NO_SHOW tickets / all completed tickets × 100`

### Queue Completion Rate
`SERVED tickets / all completed tickets × 100`

## Product Metrics
- Queue creation success rate.
- Customer join success rate.
- Average time to join.
- Number of businesses created.
- Number of active queues.

## Academic Demo Metrics
At minimum, demonstrate:
- Correct queue ordering.
- Correct status transitions.
- Correct wait estimation.
- Role-based access.
- Real-time customer update.
