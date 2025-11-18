import { userRouter } from "@/server/api/routers/user";
import { router } from "@/server/api/trpc";

export const appRouter = router({
  user: userRouter,
});

export type AppRouter = typeof appRouter;
