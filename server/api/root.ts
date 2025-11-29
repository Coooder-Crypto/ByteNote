import { authRouter } from "@/server/api/routers/auth";
import { folderRouter } from "@/server/api/routers/folder";
import { noteRouter } from "@/server/api/routers/note";
import { router } from "@/server/api/trpc";

export const appRouter = router({
  auth: authRouter,
  folder: folderRouter,
  note: noteRouter,
});

export type AppRouter = typeof appRouter;
