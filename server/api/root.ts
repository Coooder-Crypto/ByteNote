import { authRouter } from "@/server/api/routers/auth";
import { noteRouter } from "@/server/api/routers/note";
import { router } from "@/server/api/trpc";

export const appRouter = router({
  auth: authRouter,
  note: noteRouter,
});

export type AppRouter = typeof appRouter;
