import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../lib/trpc.js";
import { generateSpecialAssessmentWithLLM } from "../lib/llm.js";
import { z } from "zod";

export const assessmentRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        title: z.string().min(3),
        assessmentType: z.enum(["P5_KARAKTER", "UNJUK_KERJA", "DIAGNOSTIK"]),
        targetGrade: z.string().min(1),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await generateSpecialAssessmentWithLLM(input);
        return result;
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal membuat modul penilaian khusus: ${err.message}`,
        });
      }
    }),
});
