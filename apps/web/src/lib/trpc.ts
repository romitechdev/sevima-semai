import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@formatiflive/server/src/routes/index.js";

export const trpc = createTRPCReact<AppRouter>();
