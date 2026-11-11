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
