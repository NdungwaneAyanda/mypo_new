-- Consolidated idempotent schema for PO funding app
create extension if not exists pgcrypto;
create extension if not exists pg_net;

-- Cleanup legacy/public objects only
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_funding_applications_updated_at ON public.funding_applications;
DROP TRIGGER IF EXISTS trigger_notify_funders_on_new_application ON public.funding_applications;

DROP FUNCTION IF EXISTS public.notify_funders_on_new_application() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;

DROP TABLE IF EXISTS public.funder_offers CASCADE;
DROP TABLE IF EXISTS public.access_tokens CASCADE;
DROP TABLE IF EXISTS public.application_documents CASCADE;
DROP TABLE IF EXISTS public.unsubscribed_funders CASCADE;
DROP TABLE IF EXISTS public.registered_funders CASCADE;
DROP TABLE IF EXISTS public.funding_applications CASCADE;
DROP TABLE IF EXISTS public.funders CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.po_application_documents CASCADE;
DROP TABLE IF EXISTS public.po_applications CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key,
  company_name text,
  contact_name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users view own profile" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);
create policy "Users insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);
create policy "Users update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

create type public.app_role as enum ('supplier', 'funder');

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

drop policy if exists "Users view own roles" on public.user_roles;
drop policy if exists "Users insert own roles" on public.user_roles;
create policy "Users view own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users insert own roles"
on public.user_roles
for insert
to authenticated
with check (auth.uid() = user_id);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  industry text,
  created_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists idx_suppliers_user_id on public.suppliers(user_id);
alter table public.suppliers enable row level security;

drop policy if exists "Users view own supplier" on public.suppliers;
drop policy if exists "Users insert own supplier" on public.suppliers;
drop policy if exists "Users update own supplier" on public.suppliers;
create policy "Users view own supplier"
on public.suppliers
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users insert own supplier"
on public.suppliers
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "Users update own supplier"
on public.suppliers
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.funders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  typical_funding_range text,
  preferred_industries text[],
  created_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists idx_funders_user_id on public.funders(user_id);
alter table public.funders enable row level security;

drop policy if exists "Users view own funder" on public.funders;
drop policy if exists "Users insert own funder" on public.funders;
drop policy if exists "Users update own funder" on public.funders;
create policy "Users view own funder"
on public.funders
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users insert own funder"
on public.funders
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "Users update own funder"
on public.funders
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.registered_funders (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  funding_capacity text,
  industries text[],
  min_po_amount numeric,
  max_po_amount numeric,
  is_active boolean not null default true,
  unsubscribe_token text not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now()
);

create index if not exists idx_registered_funders_email on public.registered_funders(email);
alter table public.registered_funders enable row level security;

drop policy if exists "Anyone can register as a funder" on public.registered_funders;
drop policy if exists "Anyone can view funders" on public.registered_funders;
create policy "Anyone can register as a funder"
on public.registered_funders
for insert
to public
with check (true);
create policy "Anyone can view funders"
on public.registered_funders
for select
to public
using (true);

create table if not exists public.funding_applications (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  industry text not null,
  po_amount numeric not null,
  cost_of_delivery numeric,
  amount_needed numeric,
  customer_name text not null,
  payment_terms text not null,
  description text,
  status text not null default 'pending',
  assigned_funder_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_funding_applications_status on public.funding_applications(status);
create index if not exists idx_funding_applications_created_at on public.funding_applications(created_at desc);
create index if not exists idx_funding_applications_assigned_funder_id on public.funding_applications(assigned_funder_id);
alter table public.funding_applications enable row level security;

drop policy if exists "Anyone can submit funding applications" on public.funding_applications;
drop policy if exists "Anyone can view funding applications" on public.funding_applications;
drop policy if exists "Anyone can update funding applications" on public.funding_applications;
create policy "Anyone can submit funding applications"
on public.funding_applications
for insert
to public
with check (true);
create policy "Anyone can view funding applications"
on public.funding_applications
for select
to public
using (true);
create policy "Anyone can update funding applications"
on public.funding_applications
for update
to public
using (true)
with check (true);

create trigger update_funding_applications_updated_at
before update on public.funding_applications
for each row
execute function public.update_updated_at_column();

create table if not exists public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.funding_applications(id) on delete cascade,
  document_type text not null,
  file_name text not null,
  file_path text not null,
  file_size bigint,
  created_at timestamptz not null default now()
);

create index if not exists idx_application_documents_application_id on public.application_documents(application_id);
alter table public.application_documents enable row level security;

drop policy if exists "Anyone can insert application documents" on public.application_documents;
drop policy if exists "Anyone can view application documents" on public.application_documents;
create policy "Anyone can insert application documents"
on public.application_documents
for insert
to public
with check (true);
create policy "Anyone can view application documents"
on public.application_documents
for select
to public
using (true);

create table if not exists public.unsubscribed_funders (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  funder_id uuid references public.registered_funders(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_unsubscribed_funders_email on public.unsubscribed_funders(email);
alter table public.unsubscribed_funders enable row level security;

drop policy if exists "Anyone can unsubscribe" on public.unsubscribed_funders;
drop policy if exists "Anyone can view unsubscribed" on public.unsubscribed_funders;
create policy "Anyone can unsubscribe"
on public.unsubscribed_funders
for insert
to public
with check (true);
create policy "Anyone can view unsubscribed"
on public.unsubscribed_funders
for select
to public
using (true);

create table if not exists public.access_tokens (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.funding_applications(id) on delete cascade,
  funder_id uuid references public.registered_funders(id) on delete cascade,
  token text not null default encode(gen_random_bytes(32), 'hex'),
  token_type text not null,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

create index if not exists idx_access_tokens_token on public.access_tokens(token);
create index if not exists idx_access_tokens_application_id on public.access_tokens(application_id);
alter table public.access_tokens enable row level security;

drop policy if exists "System can insert tokens" on public.access_tokens;
drop policy if exists "Tokens are publicly readable" on public.access_tokens;
create policy "System can insert tokens"
on public.access_tokens
for insert
to public
with check (true);
create policy "Tokens are publicly readable"
on public.access_tokens
for select
to public
using (true);

create table if not exists public.funder_offers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.funding_applications(id) on delete cascade,
  funder_id uuid not null references public.registered_funders(id) on delete cascade,
  access_token_id uuid not null references public.access_tokens(id) on delete cascade,
  funding_amount numeric not null,
  interest_rate numeric,
  terms text,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists idx_funder_offers_application_id on public.funder_offers(application_id);
alter table public.funder_offers enable row level security;

drop policy if exists "Anyone can insert offers" on public.funder_offers;
drop policy if exists "Anyone can view offers" on public.funder_offers;
drop policy if exists "System can update offers" on public.funder_offers;
create policy "Anyone can insert offers"
on public.funder_offers
for insert
to public
with check (true);
create policy "Anyone can view offers"
on public.funder_offers
for select
to public
using (true);
create policy "System can update offers"
on public.funder_offers
for update
to public
using (true)
with check (true);

create or replace function public.notify_funders_on_new_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  request_id bigint;
begin
  select net.http_post(
    url := 'https://zoefwpwayxumvggfkisz.supabase.co/functions/v1/notify-funders-on-new-opportunity',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := jsonb_build_object('record', row_to_json(new))
  ) into request_id;

  return new;
exception when others then
  raise warning 'Failed to call notify-funders edge function: %', sqlerrm;
  return new;
end;
$$;

create trigger trigger_notify_funders_on_new_application
after insert on public.funding_applications
for each row
execute function public.notify_funders_on_new_application();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'funding_applications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.funding_applications;
  END IF;
END $$;