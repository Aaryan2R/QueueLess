# Operations and demo guide

## End-to-end demonstration

Use two browser windows: one owner/staff window and one customer window.

| Step | Owner/staff window | Customer window |
| --- | --- | --- |
| 1 | Sign in and create/select a business | — |
| 2 | Configure the queue and display its QR/link | Scan/open the public queue |
| 3 | — | Enter name and party size; join |
| 4 | Confirm the ticket appears in the live queue | Confirm token, position and estimate |
| 5 | Call next | Confirm called/proximity update |
| 6 | — | Confirm arrival within 120 seconds |
| 7 | Mark ready/served | Confirm final status |
| 8 | Open analytics | — |

Also test the first missed arrival (requeue) and second missed arrival (no-show).

## Deployment checklist

- Apply every migration in order.
- Configure all required environment variables in the deployment platform.
- Keep secret/service-role and private VAPID values server-only.
- Add the production URL to Supabase Auth redirect/site configuration.
- Verify HTTPS before testing Web Push.
- Run `npm run test`, `npm run lint`, `npm run typecheck` and `npm run build`.
- Test two separate businesses and accounts for tenant isolation.
- Verify queue capacity, pause/resume, leave, no-show and duplicate-action behavior.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `Failed to fetch` | Supabase URL DNS/project status and `.env.local` values |
| Push does not arrive | VAPID values, service-role key, browser permission and HTTPS |
| Password reset fails | Supabase Auth redirect URL includes `/reset-password` |
| Staff cannot operate a queue | Assignment exists and the latest staff migration is applied |
| New customers cannot join | Queue status, capacity and public URL |
