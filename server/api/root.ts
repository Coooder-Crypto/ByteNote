import { authRouter } from "@/server/api/routers/auth";
import { router } from "@/server/api/trpc";

export const appRouter = router({
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
