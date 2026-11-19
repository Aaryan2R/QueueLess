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
