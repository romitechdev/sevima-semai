-- materials table for generated student materials
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  subject text not null,
  grade_level text not null,
  access_code text not null unique,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.materials enable row level security;
create policy "materials_select_own" on public.materials for select using (true);
create policy "materials_insert" on public.materials for insert with check (true);
create policy "materials_delete_own" on public.materials for delete using (true);

-- cascade answers, questions, student_grades when a quiz is deleted
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'fk_quiz_delete_answers') then
    alter table public.answers
      add constraint fk_quiz_delete_answers
      foreign key (quiz_id) references public.quizzes(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fk_quiz_delete_questions') then
    alter table public.questions
      add constraint fk_quiz_delete_questions
      foreign key (quiz_id) references public.quizzes(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fk_quiz_delete_grades') then
    alter table public.student_grades
      add constraint fk_quiz_delete_grades
      foreign key (source_id) references public.quizzes(id) on delete cascade;
  end if;
end
$$;
