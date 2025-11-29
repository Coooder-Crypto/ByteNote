import { authRouter } from "@/server/api/routers/auth";
import { collaboratorRouter } from "@/server/api/routers/collaborator";
import { folderRouter } from "@/server/api/routers/folder";
import { noteRouter } from "@/server/api/routers/note";
import { userRouter } from "@/server/api/routers/user";
import { router } from "@/server/api/trpc";

export const appRouter = router({
  auth: authRouter,
  collaborator: collaboratorRouter,
  folder: folderRouter,
  note: noteRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
