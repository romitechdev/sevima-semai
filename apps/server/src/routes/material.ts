import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../lib/trpc.js";
import { generateMaterialWithLLM } from "../lib/llm.js";
import { z } from "zod";

export const materialRouter = router({
  generate: publicProcedure
    .input(z.object({ topic: z.string().min(3) }))
    .mutation(async ({ input }) => {
      try {
        const material = await generateMaterialWithLLM(input.topic);
        return material;
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal menyusun materi pembelajaran: ${err.message}`,
        });
      }
    }),
});
