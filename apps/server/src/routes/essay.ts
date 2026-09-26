import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../lib/trpc.js";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { evaluateEssayWithLLM } from "../lib/llm.js";
import { z } from "zod";

export const essayRouter = router({
  evaluate: publicProcedure
    .input(
      z.object({
        question: z.string().min(3),
        rubricOrKey: z.string().min(3),
        studentAnswer: z.string().min(1),
        studentName: z.string().optional(),
        teacherId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await evaluateEssayWithLLM(input);

        if (input.teacherId && input.studentName) {
          const supabase = getSupabaseAdmin();
          await supabase.from("student_grades").insert({
            teacher_id: input.teacherId,
            student_name: input.studentName,
            source_type: "ESAI",
            title: `Koreksi Esai: ${input.question.substring(0, 40)}...`,
            score: result.score,
            max_score: result.maxScore,
            feedback: result.feedback,
          });
        }

        return result;
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal menilai jawaban esai: ${err.message}`,
        });
      }
    }),
});
