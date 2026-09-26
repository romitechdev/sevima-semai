CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'materi', -- 'materi' atau 'tugas'
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can manage own documents" ON public.documents;
CREATE POLICY "Teachers can manage own documents" ON public.documents FOR ALL USING (auth.uid() = teacher_id);
