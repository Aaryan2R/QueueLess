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
  ticket_to_swap public.tickets;
  current_sequence integer;
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
    current_sequence := current_ticket.sequence_number;

    select t.*
    into ticket_to_swap
    from public.tickets t
    where t.queue_id = current_ticket.queue_id
      and t.status = 'WAITING'
      and t.sequence_number > current_sequence
    order by t.sequence_number
    offset 1
    limit 1
    for update;

    target_sequence := coalesce(ticket_to_swap.sequence_number, current_sequence);

    update public.tickets
    set sequence_number = -current_sequence
    where id = current_ticket.id;

    if ticket_to_swap.id is not null then
      update public.tickets
      set sequence_number = current_sequence
      where id = ticket_to_swap.id;
    end if;

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
