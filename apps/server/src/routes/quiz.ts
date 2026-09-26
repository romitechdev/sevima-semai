import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../lib/trpc.js";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { createQuizSchema, submitAnswerSchema, getQuizByCodeSchema } from "@formatiflive/shared";
import { generateQuizWithLLM } from "../lib/llm.js";
import { broadcastQuizUpdate } from "../lib/ws-broadcast.js";
import { z } from "zod";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const quizRouter = router({
  create: publicProcedure
    .input(
      createQuizSchema.extend({
        teacherId: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      const supabase = getSupabaseAdmin();
      const code = generateCode();

      // Ensure teacher profile exists
      const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", input.teacherId).single();
      if (!existingProfile) {
        const { data: authUser } = await supabase.auth.admin.getUserById(input.teacherId);
        const email = authUser?.user?.email || `guru_${input.teacherId.slice(0, 6)}@semai.id`;
        const name = authUser?.user?.user_metadata?.name || email.split("@")[0];
        await supabase.from("profiles").upsert({
          id: input.teacherId,
          email,
          name,
          role: "teacher",
        });
      }

      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          teacher_id: input.teacherId,
          title: input.title,
          subject: input.subject,
          grade_level: input.gradeLevel,
          code,
        })
        .select()
        .single();

      if (quizError || !quiz) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create quiz: ${quizError?.message}`,
        });
      }

      const questionsToInsert = input.questions.map((q, idx) => ({
        quiz_id: quiz.id,
        text: q.text,
        options: q.options,
        correct_index: q.correctIndex,
        order: idx + 1,
      }));

      const { data: questions, error: qError } = await supabase
        .from("questions")
        .insert(questionsToInsert)
        .select();

      if (qError || !questions) {
        await supabase.from("quizzes").delete().eq("id", quiz.id);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create questions: ${qError?.message}`,
        });
      }

      return {
        quiz,
        questions,
      };
    }),

  getByCode: publicProcedure
    .input(getQuizByCodeSchema)
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .select("id, title, subject, grade_level, code, created_at")
        .eq("code", input.code.toUpperCase())
        .single();

      if (quizError || !quiz) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quiz not found with code provided",
        });
      }

      const { data: questions, error: qError } = await supabase
        .from("questions")
        .select("id, text, options, order")
        .eq("quiz_id", quiz.id)
        .order("order", { ascending: true });

      if (qError || !questions) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch quiz questions",
        });
      }

      return {
        quiz,
        questions,
      };
    }),

  submitAnswers: publicProcedure
    .input(submitAnswerSchema)
    .mutation(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .select("id, teacher_id")
        .eq("code", input.quizCode.toUpperCase())
        .single();

      if (quizError || !quiz) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quiz not found",
        });
      }

      const { data: questions, error: qError } = await supabase
        .from("questions")
        .select("id, correct_index")
        .eq("quiz_id", quiz.id);

      if (qError || !questions) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to validate questions",
        });
      }

      const correctMap = new Map<string, number>();
      for (const q of questions) {
        correctMap.set(q.id, q.correct_index);
      }

      const answersToInsert = input.answers.map((ans) => {
        const correctIndex = correctMap.get(ans.questionId);
        const isCorrect = correctIndex !== undefined && correctIndex === ans.selectedIndex;
        return {
          quiz_id: quiz.id,
          question_id: ans.questionId,
          student_name: input.studentName,
          selected_index: ans.selectedIndex,
          is_correct: isCorrect,
        };
      });

      const { data: inserted, error: insertError } = await supabase
        .from("answers")
        .insert(answersToInsert)
        .select();

      if (insertError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to submit answers: ${insertError.message}`,
        });
      }

      // Broadcast real-time update to monitor
      broadcastQuizUpdate(quiz.id, {
        type: "new_submission",
        studentName: input.studentName,
        answers: inserted,
        timestamp: new Date().toISOString(),
      });

      const totalQuestions = questions.length;
      const correctCount = answersToInsert.filter((a) => a.is_correct).length;
      const score = Math.round((correctCount / totalQuestions) * 100);

      // Auto Integrate to student_grades table
      try {
        await supabase.from("student_grades").insert({
          teacher_id: quiz.teacher_id,
          student_name: input.studentName,
          source_type: "KUIS",
          source_id: quiz.id,
          title: `Kuis Formatif (Kode: ${input.quizCode.toUpperCase()})`,
          score,
          max_score: 100,
          feedback: `Jawaban benar: ${correctCount} dari ${totalQuestions} soal`,
        });
      } catch (_e) {
        // silent fail if grade recording fails, don't block student submission response
      }

      return {
        submitted: inserted.length,
        studentName: input.studentName,
        correctCount,
        totalQuestions,
        score,
      };
    }),

  getProgress: publicProcedure
    .input(z.object({ quizId: z.string().uuid() }))
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { data: quiz } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", input.quizId)
        .single();

      if (!quiz) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quiz not found" });
      }

      const { data: questions } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", input.quizId)
        .order("order", { ascending: true });

      const { data: answers } = await supabase
        .from("answers")
        .select("*")
        .eq("quiz_id", input.quizId);

      const allAnswers = answers || [];
      const studentNames = new Set(allAnswers.map((a) => a.student_name));
      const totalStudents = studentNames.size;

      const questionStats = (questions || []).map((q) => {
        const qAnswers = allAnswers.filter((a) => a.question_id === q.id);
        const totalAnswers = qAnswers.length;
        const correctAnswers = qAnswers.filter((a) => a.is_correct).length;
        const correctPercentage = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

        const optionCounts = [0, 0, 0, 0];
        for (const a of qAnswers) {
          if (a.selected_index >= 0 && a.selected_index <= 3) {
            optionCounts[a.selected_index]++;
          }
        }

        return {
          questionId: q.id,
          text: q.text,
          options: q.options,
          correctIndex: q.correct_index,
          totalAnswers,
          correctAnswers,
          correctPercentage,
          optionCounts,
          needsIntervention: totalAnswers >= 3 && correctPercentage < 60,
        };
      });

      return {
        quiz,
        totalStudents,
        totalSubmissions: allAnswers.length,
        questions: questionStats,
      };
    }),

  listByTeacher: publicProcedure
    .input(z.object({ teacherId: z.string().uuid() }))
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { data: quizzes, error } = await supabase
        .from("quizzes")
        .select("*, questions(count), answers(student_name)")
        .eq("teacher_id", input.teacherId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return (quizzes || []).map((q: any) => {
        const studentSet = new Set((q.answers || []).map((a: any) => a.student_name));
        return {
          id: q.id,
          title: q.title,
          subject: q.subject,
          gradeLevel: q.grade_level,
          code: q.code,
          createdAt: q.created_at,
          totalQuestions: q.questions?.[0]?.count || 0,
          totalStudents: studentSet.size,
        };
      });
    }),

  generateWithAI: publicProcedure
    .input(z.object({ prompt: z.string().min(5), numQuestions: z.number().min(1).max(20).optional().default(5) }))
    .mutation(async ({ input }) => {
      try {
        const result = await generateQuizWithLLM(input.prompt, input.numQuestions);
        return result;
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal generate kuis otomatis: ${err.message}`,
        });
      }
    }),

  update: publicProcedure
    .input(
      z.object({
        quizId: z.string().uuid(),
        title: z.string().min(1).optional(),
        subject: z.string().min(1).optional(),
        gradeLevel: z.string().min(1).optional(),
        code: z.string().min(4).max(10).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const supabase = getSupabaseAdmin();
      const { quizId, ...fields } = input;

      const updates: Record<string, string> = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.subject !== undefined) updates.subject = input.subject;
      if (input.gradeLevel !== undefined) updates.grade_level = input.gradeLevel;
      if (input.code !== undefined) updates.code = input.code.toUpperCase();

      const { data: quiz, error } = await supabase
        .from("quizzes")
        .update(updates)
        .eq("id", quizId)
        .select()
        .single();

      if (error || !quiz) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Gagal mengupdate kuis: ${error?.message}` });
      }
      return quiz;
    }),

  delete: publicProcedure
    .input(z.object({ quizId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { error } = await supabase.from("quizzes").delete().eq("id", input.quizId);
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Gagal menghapus kuis: ${error.message}` });
      }
      return { deleted: true };
    }),
});
