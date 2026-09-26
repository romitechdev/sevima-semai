import { publicProcedure, router } from "../lib/trpc.js";
import { quizRouter } from "./quiz.js";

export const healthRouter = router({
  ping: publicProcedure.query(() => ({ ok: true, timestamp: new Date().toISOString() })),
});

export const appRouter = router({
  health: healthRouter,
  quiz: quizRouter,
});

export type AppRouter = typeof appRouter;
