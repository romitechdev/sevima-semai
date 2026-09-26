import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../lib/trpc.js";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { createQuizSchema, submitAnswerSchema, getQuizByCodeSchema } from "@formatiflive/shared";
import { generateQuizWithLLM } from "../lib/llm.js";
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
        .select("id")
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

      const totalQuestions = questions.length;
      const correctCount = answersToInsert.filter((a) => a.is_correct).length;
      const score = Math.round((correctCount / totalQuestions) * 100);

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
    .input(z.object({ prompt: z.string().min(5) }))
    .mutation(async ({ input }) => {
      try {
        const result = await generateQuizWithLLM(input.prompt);
        return result;
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal generate kuis otomatis: ${err.message}`,
        });
      }
    }),
});
