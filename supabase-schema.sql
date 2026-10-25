-- Run this once in Supabase Dashboard → SQL Editor.
-- Each signed-in user can read/write ONLY their own single backup row.
create table if not exists public.orbit_study_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.orbit_study_progress enable row level security;

-- Remove these two policies first if re-running this setup script:
drop policy if exists "Users read their own Orbit backup" on public.orbit_study_progress;
drop policy if exists "Users insert their own Orbit backup" on public.orbit_study_progress;
drop policy if exists "Users update their own Orbit backup" on public.orbit_study_progress;

create policy "Users read their own Orbit backup"
  on public.orbit_study_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users insert their own Orbit backup"
  on public.orbit_study_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update their own Orbit backup"
  on public.orbit_study_progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
