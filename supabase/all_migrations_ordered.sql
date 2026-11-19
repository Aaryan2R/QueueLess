
-- ===== 202610230001_initial.sql =====
create extension if not exists pgcrypto;

do $$
begin
  create type public.app_role as enum ('OWNER', 'STAFF', 'PLATFORM_ADMIN');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.queue_status as enum ('ACTIVE', 'PAUSED', 'CLOSED');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.ticket_status as enum ('WAITING', 'CALLED', 'READY', 'SERVED', 'NO_SHOW', 'CANCELLED');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'OWNER',
  created_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  logo_url text,
  primary_color text not null default '#3967e8' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  welcome_message text not null default 'Join our queue and we will let you know when it is your turn.',
  created_at timestamptz not null default now()
);

create table if not exists public.staff_assignments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table if not exists public.queues (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  slug text not null,
  description text,
  max_size integer not null default 50 check (max_size between 1 and 10000),
  average_service_minutes integer not null default 10 check (average_service_minutes between 1 and 240),
  allow_customer_cancel boolean not null default true,
  status public.queue_status not null default 'PAUSED',
  created_at timestamptz not null default now(),
  unique (slug)
);

create table if not exists public.queue_counters (
  queue_id uuid primary key references public.queues(id) on delete cascade,
  next_number integer not null default 1 check (next_number > 0)
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references public.queues(id) on delete cascade,
  access_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  token text not null,
  sequence_number integer not null,
  customer_name text not null check (char_length(customer_name) between 1 and 80),
  customer_phone text,
  party_size integer not null default 1 check (party_size between 1 and 20),
  status public.ticket_status not null default 'WAITING',
  joined_at timestamptz not null default now(),
  called_at timestamptz,
  ready_at timestamptz,
  served_at timestamptz,
  completed_at timestamptz,
  unique (queue_id, sequence_number)
);

create table if not exists public.ticket_status_history (
  id bigint generated always as identity primary key,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  old_status public.ticket_status,
  new_status public.ticket_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.is_business_member(target_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.businesses b where b.id = target_business_id and b.owner_id = auth.uid()
  ) or exists (
    select 1 from public.staff_assignments sa where sa.business_id = target_business_id and sa.user_id = auth.uid()
  );
$$;

create or replace function public.join_queue(
  target_queue_id uuid,
  input_name text,
  input_phone text default null,
  input_party_size integer default 1
)
returns public.tickets language plpgsql security definer set search_path = public as $$
declare
  target_queue public.queues;
  next_seq integer;
  created_ticket public.tickets;
begin
  if char_length(trim(input_name)) not between 1 and 80 then
    raise exception 'Please enter a name between 1 and 80 characters.';
  end if;
  select * into target_queue from public.queues where id = target_queue_id for update;
  if target_queue.id is null or target_queue.status <> 'ACTIVE' then
    raise exception 'This queue is not accepting new customers.';
  end if;
  if input_party_size < 1 or input_party_size > 20 then
    raise exception 'Party size must be between 1 and 20.';
  end if;
  if (select count(*) from public.tickets where queue_id = target_queue_id and status in ('WAITING', 'CALLED', 'READY')) >= target_queue.max_size then
    raise exception 'This queue is currently full.';
  end if;
  insert into public.queue_counters(queue_id) values (target_queue_id) on conflict (queue_id) do nothing;
  update public.queue_counters set next_number = next_number + 1 where queue_id = target_queue_id returning next_number - 1 into next_seq;
  insert into public.tickets(queue_id, token, sequence_number, customer_name, customer_phone, party_size)
    values (target_queue_id, 'A' || next_seq, next_seq, trim(input_name), nullif(trim(input_phone), ''), input_party_size)
    returning * into created_ticket;
  insert into public.ticket_status_history(ticket_id, new_status) values (created_ticket.id, 'WAITING');
  return created_ticket;
end;
$$;

create or replace function public.change_ticket_status(target_ticket_id uuid, next_status public.ticket_status)
returns public.tickets language plpgsql security definer set search_path = public as $$
declare
  current_ticket public.tickets;
  allowed boolean := false;
  updated_ticket public.tickets;
begin
  select t.* into current_ticket from public.tickets t join public.queues q on q.id = t.queue_id
    where t.id = target_ticket_id and public.is_business_member(q.business_id) for update;
  if current_ticket.id is null then raise exception 'Ticket not found or access denied.'; end if;
  allowed := (current_ticket.status = 'WAITING' and next_status in ('CALLED', 'CANCELLED'))
    or (current_ticket.status = 'CALLED' and next_status in ('READY', 'SERVED', 'NO_SHOW'))
    or (current_ticket.status = 'READY' and next_status in ('SERVED', 'NO_SHOW'));
  if not allowed then raise exception 'That ticket cannot move from % to %.', current_ticket.status, next_status; end if;
  update public.tickets set
    status = next_status,
    called_at = case when next_status = 'CALLED' then now() else called_at end,
    ready_at = case when next_status = 'READY' then now() else ready_at end,
    served_at = case when next_status = 'SERVED' then now() else served_at end,
    completed_at = case when next_status in ('SERVED', 'NO_SHOW', 'CANCELLED') then now() else completed_at end
    where id = target_ticket_id returning * into updated_ticket;
  insert into public.ticket_status_history(ticket_id, old_status, new_status, changed_by)
    values (target_ticket_id, current_ticket.status, next_status, auth.uid());
  return updated_ticket;
end;
$$;

create or replace function public.call_next(target_queue_id uuid)
returns public.tickets language plpgsql security definer set search_path = public as $$
declare
  next_ticket public.tickets;
  target_queue public.queues;
begin
  if not exists (select 1 from public.queues q where q.id = target_queue_id and public.is_business_member(q.business_id)) then
    raise exception 'Queue not found or access denied.';
  end if;
  select q.* into target_queue
  from public.queues q
  where q.id = target_queue_id
  for update;

  if target_queue.id is null then
    raise exception 'Queue not found or access denied.';
  end if;
  if target_queue.status <> 'ACTIVE' then
    raise exception 'This queue is not accepting calls.';
  end if;
  select t.* into next_ticket from public.tickets t where t.queue_id = target_queue_id and t.status = 'WAITING'
    order by t.sequence_number for update skip locked limit 1;
  if next_ticket.id is null then raise exception 'There are no waiting customers.'; end if;
  return public.change_ticket_status(next_ticket.id, 'CALLED');
end;
$$;

create or replace function public.get_public_ticket(input_token text)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'token', t.token,
    'customer_name', t.customer_name,
    'status', t.status,
    'joined_at', t.joined_at,
    'sequence_number', t.sequence_number,
    'queue_id', t.queue_id,
    'queue_name', q.name,
    'average_service_minutes', q.average_service_minutes,
    'business_name', b.name,
    'ahead', (select count(*) from public.tickets ahead where ahead.queue_id = t.queue_id and ahead.status = 'WAITING' and ahead.sequence_number < t.sequence_number)
  )
  from public.tickets t
  join public.queues q on q.id = t.queue_id
  join public.businesses b on b.id = q.business_id
  where t.access_token = input_token;
$$;

create or replace function public.is_business_public(target_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.queues q
    where q.business_id = target_business_id
      and q.status = 'ACTIVE'
  );
$$;

create or replace function public.is_business_owner(target_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.businesses b
    where b.id = target_business_id and b.owner_id = auth.uid()
  );
$$;

create or replace function public.is_queue_member(target_queue_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.queues q
    where q.id = target_queue_id
      and public.is_business_member(q.business_id)
  );
$$;

create or replace function public.is_ticket_member(target_ticket_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tickets t
    join public.queues q on q.id = t.queue_id
    where t.id = target_ticket_id
      and public.is_business_member(q.business_id)
  );
$$;

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.staff_assignments enable row level security;
alter table public.queues enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_status_history enable row level security;

drop policy if exists "profiles own profile" on public.profiles;
drop policy if exists "owners manage businesses" on public.businesses;
drop policy if exists "members read queues" on public.queues;
drop policy if exists "public read active queues" on public.queues;
drop policy if exists "owners manage queues" on public.queues;
drop policy if exists "public read business branding" on public.businesses;
drop policy if exists "owners manage staff" on public.staff_assignments;
drop policy if exists "members read tickets" on public.tickets;
drop policy if exists "members read history" on public.ticket_status_history;

create policy "profiles own profile" on public.profiles for select using (id = auth.uid());
create policy "owners manage businesses" on public.businesses for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "members read queues" on public.queues for select using (public.is_business_member(business_id));
create policy "public read active queues" on public.queues for select using (status = 'ACTIVE');
create policy "owners manage queues" on public.queues for all using (public.is_business_owner(business_id)) with check (public.is_business_owner(business_id));
create policy "public read business branding" on public.businesses for select using (public.is_business_public(id));
create policy "owners manage staff" on public.staff_assignments for all using (public.is_business_owner(business_id)) with check (public.is_business_owner(business_id));
create policy "members read tickets" on public.tickets for select using (public.is_queue_member(queue_id));
create policy "members read history" on public.ticket_status_history for select using (public.is_ticket_member(ticket_id));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

do $$
begin
  alter publication supabase_realtime add table public.tickets;
exception
  when duplicate_object then null;
end
$$;



-- ===== 202610230002_fix_rls_recursion.sql =====
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




-- ===== 202611110002_queue_hardening.sql =====
create index if not exists idx_tickets_queue_status
  on public.tickets(queue_id, status);

drop policy if exists "public read business branding" on public.businesses;

create or replace function public.is_business_public(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.queues q
    where q.business_id = target_business_id
      and q.status = 'ACTIVE'
  );
$$;

create policy "public read business branding"
on public.businesses
for select
using (public.is_business_public(id));



-- ===== 202611110003_atomic_business_creation.sql =====
create or replace function public.create_business_with_queue(input_name text, input_slug text)
returns public.businesses
language plpgsql
security invoker
set search_path = public
as $$
declare
  created_business public.businesses;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in.';
  end if;

  insert into public.businesses(owner_id, name, slug)
  values (auth.uid(), trim(input_name), lower(trim(input_slug)))
  returning * into created_business;

  insert into public.queues(business_id, name, slug, status)
  values (created_business.id, 'Main queue', lower(trim(input_slug)) || '-main', 'ACTIVE');

  return created_business;
end;
$$;



-- ===== 202611110004_customer_leave_queue.sql =====
create or replace function public.leave_queue(input_token text)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  current_ticket public.tickets;
  updated_ticket public.tickets;
begin
  select t.*
  into current_ticket
  from public.tickets t
  join public.queues q on q.id = t.queue_id
  where t.access_token = input_token
    and q.allow_customer_cancel
  for update;

  if current_ticket.id is null then
    raise exception 'Ticket not found or customer cancellation is disabled.';
  end if;

  if current_ticket.status not in ('WAITING', 'CALLED', 'READY') then
    raise exception 'This ticket is already complete.';
  end if;

  update public.tickets
  set status = 'CANCELLED',
      completed_at = now()
  where id = current_ticket.id
  returning * into updated_ticket;

  insert into public.ticket_status_history(ticket_id, old_status, new_status)
  values (current_ticket.id, current_ticket.status, 'CANCELLED');

  return updated_ticket;
end;
$$;



-- ===== 202611110005_push_subscriptions.sql =====
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create or replace function public.save_push_subscription(
  input_token text,
  input_endpoint text,
  input_p256dh text,
  input_auth text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_ticket_id uuid;
begin
  select id into target_ticket_id
  from public.tickets
  where access_token = input_token
    and status in ('WAITING', 'CALLED', 'READY');

  if target_ticket_id is null then
    raise exception 'Ticket not found or no longer active.';
  end if;

  insert into public.push_subscriptions(ticket_id, endpoint, p256dh, auth)
  values (target_ticket_id, input_endpoint, input_p256dh, input_auth)
  on conflict (endpoint) do update
  set ticket_id = excluded.ticket_id,
      p256dh = excluded.p256dh,
      auth = excluded.auth,
      last_seen_at = now();
end;
$$;



-- ===== 202611110006_arrival_alerts_staff.sql =====
alter table public.tickets
  add column if not exists missed_turn_count integer not null default 0
    check (missed_turn_count between 0 and 2),
  add column if not exists arrival_deadline_at timestamptz;

do $$
begin
  create type public.ticket_alert_level as enum ('AHEAD_3', 'AHEAD_2', 'AHEAD_1', 'CALLED');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.ticket_alerts (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  alert_level public.ticket_alert_level not null,
  sent_at timestamptz not null default now(),
  unique (ticket_id, alert_level)
);

alter table public.ticket_alerts enable row level security;

drop policy if exists "members read businesses" on public.businesses;
create policy "members read businesses"
on public.businesses
for select
using (public.is_business_member(id));

drop policy if exists "staff read own assignments" on public.staff_assignments;
create policy "staff read own assignments"
on public.staff_assignments
for select
using (user_id = auth.uid());

create or replace function public.change_ticket_status(
  target_ticket_id uuid,
  next_status public.ticket_status
)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  current_ticket public.tickets;
  updated_ticket public.tickets;
  allowed boolean := false;
begin
  select t.*
  into current_ticket
  from public.tickets t
  join public.queues q on q.id = t.queue_id
  where t.id = target_ticket_id
    and public.is_business_member(q.business_id)
  for update;

  if current_ticket.id is null then
    raise exception 'Ticket not found or access denied.';
  end if;

  allowed := (current_ticket.status = 'WAITING' and next_status in ('CALLED', 'CANCELLED'))
    or (current_ticket.status = 'CALLED' and next_status in ('READY', 'SERVED', 'NO_SHOW'))
    or (current_ticket.status = 'READY' and next_status in ('SERVED', 'NO_SHOW'));

  if not allowed then
    raise exception 'That ticket cannot move from % to %.', current_ticket.status, next_status;
  end if;

  update public.tickets
  set status = next_status,
      called_at = case when next_status = 'CALLED' then now() else called_at end,
      arrival_deadline_at = case
        when next_status = 'CALLED' then now() + interval '120 seconds'
        when next_status in ('READY', 'SERVED', 'NO_SHOW', 'CANCELLED') then null
        else arrival_deadline_at
      end,
      ready_at = case when next_status = 'READY' then now() else ready_at end,
      served_at = case when next_status = 'SERVED' then now() else served_at end,
      completed_at = case when next_status in ('SERVED', 'NO_SHOW', 'CANCELLED') then now() else completed_at end
  where id = target_ticket_id
  returning * into updated_ticket;

  insert into public.ticket_status_history(ticket_id, old_status, new_status, changed_by)
  values (target_ticket_id, current_ticket.status, next_status, auth.uid());

  return updated_ticket;
end;
$$;

create or replace function public.expire_ticket_if_needed(input_token text)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  current_ticket public.tickets;
  updated_ticket public.tickets;
  target_sequence integer;
begin
  select t.*
  into current_ticket
  from public.tickets t
  where t.access_token = input_token
  for update;

  if current_ticket.id is null
    or current_ticket.status <> 'CALLED'
    or current_ticket.arrival_deadline_at is null
    or current_ticket.arrival_deadline_at > now() then
    return current_ticket;
  end if;

  if current_ticket.missed_turn_count = 0 then
    insert into public.queue_counters(queue_id)
    values (current_ticket.queue_id)
    on conflict (queue_id) do nothing;

    update public.queue_counters
    set next_number = next_number + 1
    where queue_id = current_ticket.queue_id
    returning next_number - 1 into target_sequence;

    update public.tickets
    set sequence_number = target_sequence,
        status = 'WAITING',
        missed_turn_count = 1,
        called_at = null,
        arrival_deadline_at = null
    where id = current_ticket.id
    returning * into updated_ticket;

    insert into public.ticket_status_history(ticket_id, old_status, new_status, changed_by)
    values (current_ticket.id, 'CALLED', 'WAITING', null);
  else
    update public.tickets
    set status = 'NO_SHOW',
        missed_turn_count = 2,
        arrival_deadline_at = null,
        completed_at = now()
    where id = current_ticket.id
    returning * into updated_ticket;

    insert into public.ticket_status_history(ticket_id, old_status, new_status, changed_by)
    values (current_ticket.id, 'CALLED', 'NO_SHOW', null);
  end if;

  return updated_ticket;
end;
$$;

create or replace function public.confirm_ticket_arrival(input_token text)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  current_ticket public.tickets;
  updated_ticket public.tickets;
begin
  select t.*
  into current_ticket
  from public.tickets t
  where t.access_token = input_token
    and t.status = 'CALLED'
  for update;

  if current_ticket.id is null then
    raise exception 'Ticket is not currently awaiting arrival.';
  end if;

  if current_ticket.arrival_deadline_at is null or current_ticket.arrival_deadline_at <= now() then
    perform public.expire_ticket_if_needed(input_token);
    raise exception 'The 120-second arrival window has expired.';
  end if;

  update public.tickets
  set status = 'READY',
      ready_at = now(),
      arrival_deadline_at = null
  where id = current_ticket.id
  returning * into updated_ticket;

  insert into public.ticket_status_history(ticket_id, old_status, new_status)
  values (current_ticket.id, 'CALLED', 'READY');

  return updated_ticket;
end;
$$;

create or replace function public.add_staff_member(input_business_id uuid, input_email text)
returns table (id uuid, user_id uuid, email text, created_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
begin
  if not exists (
    select 1 from public.businesses
    where businesses.id = input_business_id
      and businesses.owner_id = auth.uid()
  ) then
    raise exception 'Business not found or access denied.';
  end if;

  select users.id
  into target_user_id
  from auth.users
  where lower(users.email) = lower(trim(input_email));

  if target_user_id is null then
    raise exception 'No account exists for that email address.';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'The business owner is already a manager.';
  end if;

  insert into public.staff_assignments(business_id, user_id)
  values (input_business_id, target_user_id)
  on conflict (business_id, user_id) do nothing;

  return query
  select sa.id, sa.user_id, users.email, sa.created_at
  from public.staff_assignments sa
  join auth.users users on users.id = sa.user_id
  where sa.business_id = input_business_id
  order by sa.created_at;
end;
$$;

create or replace function public.list_business_staff(input_business_id uuid)
returns table (id uuid, user_id uuid, email text, created_at timestamptz)
language sql
security definer
set search_path = public, auth
as $$
  select sa.id, sa.user_id, users.email, sa.created_at
  from public.staff_assignments sa
  join auth.users users on users.id = sa.user_id
  where sa.business_id = input_business_id
    and exists (
      select 1 from public.businesses b
      where b.id = input_business_id
        and b.owner_id = auth.uid()
    )
  order by sa.created_at;
$$;

create or replace function public.remove_staff_member(input_assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.staff_assignments sa
  using public.businesses b
  where sa.id = input_assignment_id
    and b.id = sa.business_id
    and b.owner_id = auth.uid();
end;
$$;

create or replace function public.get_public_ticket(input_token text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'token', t.token,
    'customer_name', t.customer_name,
    'status', t.status,
    'joined_at', t.joined_at,
    'sequence_number', t.sequence_number,
    'queue_id', t.queue_id,
    'queue_name', q.name,
    'average_service_minutes', q.average_service_minutes,
    'business_name', b.name,
    'ahead', (
      select count(*)
      from public.tickets ahead
      where ahead.queue_id = t.queue_id
        and ahead.status = 'WAITING'
        and ahead.sequence_number < t.sequence_number
    ),
    'arrival_deadline_at', t.arrival_deadline_at,
    'missed_turn_count', t.missed_turn_count
  )
  from public.tickets t
  join public.queues q on q.id = t.queue_id
  join public.businesses b on b.id = q.business_id
  where t.access_token = input_token;
$$;



-- ===== 202611190001_security_queue_fixes.sql =====
create or replace function public.call_next(target_queue_id uuid)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  next_ticket public.tickets;
  target_queue public.queues;
begin
  if not exists (
    select 1
    from public.queues q
    where q.id = target_queue_id
      and public.is_business_member(q.business_id)
  ) then
    raise exception 'Queue not found or access denied.';
  end if;

  select q.*
  into target_queue
  from public.queues q
  where q.id = target_queue_id
  for update;

  if target_queue.status <> 'ACTIVE' then
    raise exception 'This queue is not accepting calls.';
  end if;

  select t.*
  into next_ticket
  from public.tickets t
  where t.queue_id = target_queue_id
    and t.status = 'WAITING'
  order by t.sequence_number
  for update skip locked
  limit 1;

  if next_ticket.id is null then
    raise exception 'There are no waiting customers.';
  end if;

  return public.change_ticket_status(next_ticket.id, 'CALLED');
end;
$$;

create or replace function public.expire_ticket_if_needed(input_token text)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  current_ticket public.tickets;
  updated_ticket public.tickets;
  target_sequence integer;
begin
  select t.*
  into current_ticket
  from public.tickets t
  where t.access_token = input_token
  for update;

  if current_ticket.id is null
    or current_ticket.status <> 'CALLED'
    or current_ticket.arrival_deadline_at is null
    or current_ticket.arrival_deadline_at > now() then
    return current_ticket;
  end if;

  if current_ticket.missed_turn_count = 0 then
    insert into public.queue_counters(queue_id)
    values (current_ticket.queue_id)
    on conflict (queue_id) do nothing;

    update public.queue_counters
    set next_number = next_number + 1
    where queue_id = current_ticket.queue_id
    returning next_number - 1 into target_sequence;

    update public.tickets
    set sequence_number = target_sequence,
        status = 'WAITING',
        missed_turn_count = 1,
        called_at = null,
        arrival_deadline_at = null
    where id = current_ticket.id
    returning * into updated_ticket;

    insert into public.ticket_status_history(ticket_id, old_status, new_status, changed_by)
    values (current_ticket.id, 'CALLED', 'WAITING', null);
  else
    update public.tickets
    set status = 'NO_SHOW',
        missed_turn_count = 2,
        arrival_deadline_at = null,
        completed_at = now()
    where id = current_ticket.id
    returning * into updated_ticket;

    insert into public.ticket_status_history(ticket_id, old_status, new_status, changed_by)
    values (current_ticket.id, 'CALLED', 'NO_SHOW', null);
  end if;

  return updated_ticket;
end;
$$;



-- ===== 202611190002_join_idempotency.sql =====
create table if not exists public.join_idempotency (
  idempotency_key uuid primary key,
  queue_id uuid not null references public.queues(id) on delete cascade,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.join_idempotency enable row level security;
revoke all on table public.join_idempotency from anon, authenticated;

drop function if exists public.join_queue(uuid, text, text, integer);

create or replace function public.join_queue(
  target_queue_id uuid,
  input_name text,
  input_phone text default null,
  input_party_size integer default 1,
  input_idempotency_key uuid default null
)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  target_queue public.queues;
  next_seq integer;
  created_ticket public.tickets;
  existing_ticket public.tickets;
  existing_idempotency public.join_idempotency;
begin
  if char_length(trim(input_name)) not between 1 and 80 then
    raise exception 'Please enter a name between 1 and 80 characters.';
  end if;

  if input_idempotency_key is not null then
    perform pg_advisory_xact_lock(hashtext(input_idempotency_key::text));

    select ji.*
    into existing_idempotency
    from public.join_idempotency ji
    where ji.idempotency_key = input_idempotency_key;

    if existing_idempotency.idempotency_key is not null then
      if existing_idempotency.queue_id <> target_queue_id then
        raise exception 'Unable to join this queue.';
      end if;

      select t.*
      into existing_ticket
      from public.tickets t
      where t.id = existing_idempotency.ticket_id;
      return existing_ticket;
    end if;
  end if;

  select *
  into target_queue
  from public.queues
  where id = target_queue_id
  for update;

  if target_queue.id is null or target_queue.status <> 'ACTIVE' then
    raise exception 'This queue is not accepting new customers.';
  end if;

  if input_party_size < 1 or input_party_size > 20 then
    raise exception 'Party size must be between 1 and 20.';
  end if;

  if (
    select count(*)
    from public.tickets
    where queue_id = target_queue_id
      and status in ('WAITING', 'CALLED', 'READY')
  ) >= target_queue.max_size then
    raise exception 'This queue is currently full.';
  end if;

  insert into public.queue_counters(queue_id)
  values (target_queue_id)
  on conflict (queue_id) do nothing;

  update public.queue_counters
  set next_number = next_number + 1
  where queue_id = target_queue_id
  returning next_number - 1 into next_seq;

  insert into public.tickets(queue_id, token, sequence_number, customer_name, customer_phone, party_size)
  values (
    target_queue_id,
    'A' || next_seq,
    next_seq,
    trim(input_name),
    nullif(trim(input_phone), ''),
    input_party_size
  )
  returning * into created_ticket;

  insert into public.ticket_status_history(ticket_id, new_status)
  values (created_ticket.id, 'WAITING');

  if input_idempotency_key is not null then
    insert into public.join_idempotency(idempotency_key, queue_id, ticket_id)
    values (input_idempotency_key, target_queue_id, created_ticket.id);
  end if;

  return created_ticket;
end;
$$;
