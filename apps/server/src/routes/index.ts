import { publicProcedure, router } from "../lib/trpc.js";

export const healthRouter = router({
  ping: publicProcedure.query(() => ({ ok: true, timestamp: new Date().toISOString() })),
});

export const appRouter = router({
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
