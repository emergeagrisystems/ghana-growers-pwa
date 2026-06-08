-- Ghana Growers Supabase Phase 1 learn articles
-- Run after 001_phase_1_core_records.sql if admin Learn Article persistence is needed.

create table if not exists public.learn_articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  category text not null,
  summary text not null,
  author text not null,
  publish_date date not null,
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_learn_articles_updated_at on public.learn_articles;
create trigger set_learn_articles_updated_at
before update on public.learn_articles
for each row execute function public.set_updated_at();

alter table public.learn_articles enable row level security;

create index if not exists learn_articles_category_idx on public.learn_articles(category);
create index if not exists learn_articles_status_idx on public.learn_articles(status);
