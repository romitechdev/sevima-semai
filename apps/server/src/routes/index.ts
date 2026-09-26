import { publicProcedure, router } from "../lib/trpc.js";
import { quizRouter } from "./quiz.js";
import { materialRouter } from "./material.js";
import { essayRouter } from "./essay.js";
import { documentRouter } from "./document.js";
import { agentRouter } from "./agent.js";

export const healthRouter = router({
  ping: publicProcedure.query(() => ({ ok: true, timestamp: new Date().toISOString() })),
});

export const appRouter = router({
  health: healthRouter,
  quiz: quizRouter,
  material: materialRouter,
  essay: essayRouter,
  document: documentRouter,
  agent: agentRouter,
});

export type AppRouter = typeof appRouter;
