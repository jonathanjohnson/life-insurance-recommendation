-- 0001_initial_schema.sql
-- Initial schema for the life insurance lead-gen site: leads, contractors,
-- lead_routing_log, content_overrides. RLS is enabled on every table; only
-- the service role can read/write leads/contractors/routing-log. Anonymous
-- visitors can read content_overrides so that page templates can fetch
-- per-city customization at request time.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id                          uuid primary key default gen_random_uuid(),
  created_at                  timestamptz not null default now(),

  zip                         text not null,
  city_slug                   text not null,
  state_slug                  text not null,

  service_type                text,
  urgency                     text,
  property_type               text,
  system_details              jsonb,

  first_name                  text,
  last_name                   text,
  phone                       text not null,
  email                       text not null,

  tcpa_consent                boolean not null default false,
  tcpa_consent_text           text not null,
  tcpa_consent_ip             text,
  tcpa_consent_user_agent     text,

  source_url                  text,
  utm_source                  text,
  utm_medium                  text,
  utm_campaign                text,
  utm_term                    text,
  utm_content                 text,

  routing_status              text default 'pending',
  routing_destination         text,
  routing_response            jsonb,

  partial                     boolean default false
);

create index if not exists leads_zip_idx         on public.leads (zip);
create index if not exists leads_city_slug_idx   on public.leads (city_slug);
create index if not exists leads_email_idx       on public.leads (email);
create index if not exists leads_created_at_idx  on public.leads (created_at desc);

-- ---------------------------------------------------------------------------
-- contractors
-- ---------------------------------------------------------------------------
create table if not exists public.contractors (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  business_name       text not null,
  contact_email       text,
  contact_phone       text,
  service_types       text[],
  service_zips        text[],
  service_states      text[],
  webhook_url         text,
  max_leads_per_day   int default 10,
  status              text default 'active'
);

create index if not exists contractors_service_zips_idx
  on public.contractors using gin (service_zips);

-- ---------------------------------------------------------------------------
-- lead_routing_log
-- ---------------------------------------------------------------------------
create table if not exists public.lead_routing_log (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  lead_id           uuid references public.leads(id) on delete cascade,
  destination_type  text,
  destination_id    text,
  endpoint          text,
  request_payload   jsonb,
  response_status   int,
  response_body     text,
  duration_ms       int
);

create index if not exists lead_routing_log_lead_id_idx
  on public.lead_routing_log (lead_id);
create index if not exists lead_routing_log_created_at_idx
  on public.lead_routing_log (created_at desc);

-- ---------------------------------------------------------------------------
-- content_overrides
-- ---------------------------------------------------------------------------
create table if not exists public.content_overrides (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  city_slug           text unique,
  state_slug          text,
  custom_intro        text,
  custom_data_block   jsonb,
  notes               text
);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.leads             enable row level security;
alter table public.contractors       enable row level security;
alter table public.lead_routing_log  enable row level security;
alter table public.content_overrides enable row level security;

-- leads: service_role only (insert + select)
drop policy if exists "leads service_role insert" on public.leads;
create policy "leads service_role insert"
  on public.leads
  for insert
  to service_role
  with check (true);

drop policy if exists "leads service_role select" on public.leads;
create policy "leads service_role select"
  on public.leads
  for select
  to service_role
  using (true);

drop policy if exists "leads service_role update" on public.leads;
create policy "leads service_role update"
  on public.leads
  for update
  to service_role
  using (true)
  with check (true);

-- contractors: service_role only (insert/select/update)
drop policy if exists "contractors service_role select" on public.contractors;
create policy "contractors service_role select"
  on public.contractors
  for select
  to service_role
  using (true);

drop policy if exists "contractors service_role insert" on public.contractors;
create policy "contractors service_role insert"
  on public.contractors
  for insert
  to service_role
  with check (true);

drop policy if exists "contractors service_role update" on public.contractors;
create policy "contractors service_role update"
  on public.contractors
  for update
  to service_role
  using (true)
  with check (true);

-- lead_routing_log: service_role only
drop policy if exists "lead_routing_log service_role select" on public.lead_routing_log;
create policy "lead_routing_log service_role select"
  on public.lead_routing_log
  for select
  to service_role
  using (true);

drop policy if exists "lead_routing_log service_role insert" on public.lead_routing_log;
create policy "lead_routing_log service_role insert"
  on public.lead_routing_log
  for insert
  to service_role
  with check (true);

-- content_overrides: anon can read, service_role can write
drop policy if exists "content_overrides anon select" on public.content_overrides;
create policy "content_overrides anon select"
  on public.content_overrides
  for select
  to anon, authenticated
  using (true);

drop policy if exists "content_overrides service_role insert" on public.content_overrides;
create policy "content_overrides service_role insert"
  on public.content_overrides
  for insert
  to service_role
  with check (true);

drop policy if exists "content_overrides service_role update" on public.content_overrides;
create policy "content_overrides service_role update"
  on public.content_overrides
  for update
  to service_role
  using (true)
  with check (true);
