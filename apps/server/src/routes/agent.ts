import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../lib/trpc.js";
import { runAgentCommandWithLLM, llmErrorMessage } from "../lib/llm.js";
import { z } from "zod";

export const agentRouter = router({
  executeCommand: publicProcedure
    .input(z.object({ command: z.string().min(3) }))
    .mutation(async ({ input }) => {
      try {
        const result = await runAgentCommandWithLLM(input.command);
        return result;
      } catch (err: any) {
        const { code, message } = llmErrorMessage("Gagal menjalankan perintah Agent OS", err);
        throw new TRPCError({ code, message });
      }
    }),
});
