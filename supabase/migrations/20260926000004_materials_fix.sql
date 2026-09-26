-- idempotent: create materials table if missing, drop legacy access_code column if present
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  subject text not null,
  grade_level text not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.materials enable row level security;
drop policy if exists "materials_select_own" on public.materials;
drop policy if exists "materials_insert" on public.materials;
drop policy if exists "materials_delete_own" on public.materials;
drop policy if exists "materials_select_all" on public.materials;
drop policy if exists "materials_delete" on public.materials;
create policy "materials_select_all" on public.materials for select using (true);
create policy "materials_insert" on public.materials for insert with check (true);
create policy "materials_delete" on public.materials for delete using (true);

-- drop legacy access_code column if a previous version of the table had it
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'materials'
      and column_name = 'access_code'
  ) then
    alter table public.materials drop column access_code;
  end if;
end
$$;
