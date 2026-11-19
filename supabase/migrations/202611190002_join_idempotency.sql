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
