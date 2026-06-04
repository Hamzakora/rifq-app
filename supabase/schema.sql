create table if not exists public.rifq_user_data (
  user_id text primary key,
  email text,
  name text,
  favorites jsonb not null default '[]'::jsonb,
  khatma jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists rifq_user_data_email_idx
on public.rifq_user_data (email);

alter table public.rifq_user_data enable row level security;

-- The app uses SUPABASE_SERVICE_ROLE_KEY from a protected server route.
-- Do not expose the service role key in the browser.


create table if not exists public.rifq_reports (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  section text not null,
  priority text not null default 'متوسطة',
  title text not null,
  details text not null,
  contact text,
  page_url text,
  device_info text,
  user_agent text,
  forwarded_for text,
  report_text text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists rifq_reports_created_at_idx
on public.rifq_reports (created_at desc);

create index if not exists rifq_reports_status_idx
on public.rifq_reports (status);

alter table public.rifq_reports enable row level security;
