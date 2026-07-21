create table if not exists public.success_stories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text not null check (category in ('Farmers', 'Buyers', 'Suppliers')),
  person_business_name text not null,
  region text not null,
  summary text not null,
  outcome text not null,
  story_date date not null,
  image_url text,
  status text not null default 'Draft' check (status in ('Draft', 'Published', 'Archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists success_stories_status_idx on public.success_stories(status);
create index if not exists success_stories_category_idx on public.success_stories(category);
create index if not exists success_stories_story_date_idx on public.success_stories(story_date desc);

create or replace function public.set_success_stories_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists success_stories_updated_at on public.success_stories;
create trigger success_stories_updated_at
before update on public.success_stories
for each row
execute function public.set_success_stories_updated_at();
