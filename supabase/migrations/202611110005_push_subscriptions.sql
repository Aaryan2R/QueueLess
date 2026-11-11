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
