# QueueLess – Testing Plan

## Unit Tests
- Token generator creates unique valid tokens.
- Queue position is calculated correctly.
- Wait estimate is calculated correctly.
- Invalid status transitions are rejected.
- Capacity limits are enforced.

## API Tests
- Owner can create a business.
- Owner can create a queue.
- Unauthenticated user cannot access private dashboard routes.
- Staff can only access assigned businesses.
- Customer can join active queue.
- Customer cannot join paused queue.
- Customer can leave when allowed.

## Integration Tests
### Scenario 1: Normal Queue
1. Create queue.
2. Join Customer A.
3. Join Customer B.
4. Call Next.
5. Verify A is called before B.
6. Serve A.
7. Verify B becomes next eligible customer.

### Scenario 2: No Show
1. Join A and B.
2. Call A.
3. Mark A no-show.
4. Verify A is excluded from waiting count.
5. Call Next.
6. Verify B is called.

### Scenario 3: Queue Capacity
1. Set max size to 2.
2. Join two customers.
3. Attempt third join.
4. Verify request is rejected.

### Scenario 4: Tenant Security
1. Create Business A and Business B.
2. Authenticate as staff for A.
3. Attempt to modify a queue from B.
4. Verify authorization fails.

### Scenario 5: Real-Time Update
1. Open customer page in Browser 1.
2. Open staff queue in Browser 2.
3. Call Next from Browser 2.
4. Verify Browser 1 updates automatically.

## UI Tests
- Mobile layout.
- Form validation.
- Loading/error states.
- Empty queue state.
- Paused queue state.
- Closed queue state.
- Accessibility basics.

## Performance Checks
Test normal project load with multiple concurrent simulated queue joins and verify no duplicate tokens or incorrect ordering.
