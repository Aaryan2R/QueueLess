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
