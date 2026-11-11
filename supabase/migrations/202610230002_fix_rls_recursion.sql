-- Fix infinite recursion in RLS policies.
-- The problem: inline subqueries in policies trigger RLS on other tables,
-- which have policies that query back, creating cycles.
-- The fix: wrap all cross-table checks in SECURITY DEFINER functions
-- (which bypass RLS), breaking the cycle.

-- 1. Helper: current user owns this business? (bypasses RLS)
create or replace function public.is_business_owner(target_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.businesses b
    where b.id = target_business_id and b.owner_id = auth.uid()
  );
$$;

-- 2. Helper: can current user read tickets in this queue? (bypasses RLS)
create or replace function public.is_queue_member(target_queue_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.queues q
    where q.id = target_queue_id
      and public.is_business_member(q.business_id)
  );
$$;

-- 3. Helper: can current user read this ticket's history? (bypasses RLS)
create or replace function public.is_ticket_member(target_ticket_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tickets t
    join public.queues q on q.id = t.queue_id
    where t.id = target_ticket_id
      and public.is_business_member(q.business_id)
  );
$$;

-- Drop the problematic policies
drop policy if exists "owners manage queues" on public.queues;
drop policy if exists "owners manage staff" on public.staff_assignments;
drop policy if exists "members read tickets" on public.tickets;
drop policy if exists "members read history" on public.ticket_status_history;

-- Recreate with SECURITY DEFINER function calls instead of inline subqueries
create policy "owners manage queues" on public.queues
  for all
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

create policy "owners manage staff" on public.staff_assignments
  for all
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

create policy "members read tickets" on public.tickets
  for select
  using (public.is_queue_member(queue_id));

create policy "members read history" on public.ticket_status_history
  for select
  using (public.is_ticket_member(ticket_id));

