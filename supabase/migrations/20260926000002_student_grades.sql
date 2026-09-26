CREATE TABLE IF NOT EXISTS public.student_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'KUIS', 'ESAI', 'UNJUK_KERJA', 'P5'
  source_id UUID,
  title TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  max_score NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can manage own student grades" ON public.student_grades;
CREATE POLICY "Teachers can manage own student grades" ON public.student_grades FOR ALL USING (auth.uid() = teacher_id);
