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
