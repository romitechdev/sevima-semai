import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../lib/trpc.js";
import { evaluateEssayWithLLM } from "../lib/llm.js";
import { z } from "zod";

export const essayRouter = router({
  evaluate: publicProcedure
    .input(
      z.object({
        question: z.string().min(3),
        rubricOrKey: z.string().min(3),
        studentAnswer: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await evaluateEssayWithLLM(input);
        return result;
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal menilai jawaban esai: ${err.message}`,
        });
      }
    }),
});
