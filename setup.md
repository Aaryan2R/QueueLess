# QueueLess – Development Setup

## Prerequisites
Install:
- Node.js LTS
- npm
- A Supabase project
- A Vercel account for hosted deployment

Optional:
- VS Code
- Postman

## Suggested Repository Setup
```bash
git clone <repository-url>
cd queueless
```

## Local Setup
```bash
npm install
Copy-Item .env.example .env.local
```

Add the Supabase project URL and anon key to `.env.local`. Do not put the service-role key in browser code.

Example variables:
```text
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Start development server:
```bash
npm run dev
```

## Database Setup
1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `supabase/migrations/202610230001_initial.sql`.
4. Create an owner through QueueLess signup.
5. Never commit production credentials.

## Local URLs
Suggested defaults:
- Application: `http://localhost:3000`

## First Demo Data
Create one owner through `/signup`, then create a business from `/dashboard`. The first active queue is created automatically.

## Free online deployment
1. Push this folder to a GitHub repository.
2. Import the repository into Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_APP_URL` in Vercel project environment variables.
4. Run the migration in the Supabase SQL editor before opening the deployed site.
5. In Supabase Auth URL configuration, add the Vercel deployment URL as the site URL.
6. Enable Realtime for the `tickets` table if it is not enabled automatically by the migration.

The app remains usable through normal page refreshes and a 30-second polling fallback if a free-tier realtime connection is interrupted.

## Current operational boundaries
- Customers do not create accounts; their ticket URL is the private recovery link.
- No SMS, email, billing, custom domains, or file uploads are required for the first release.
- Keep the Supabase anon key public as intended; never expose the service-role key in the browser or commit it.

Then test the full QR/customer/staff flow.
