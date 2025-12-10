import { authRouter } from "@/server/api/routers/auth";
import { collaboratorRouter } from "@/server/api/routers/collaborator";
import { folderRouter } from "@/server/api/routers/folder";
import { noteRouter } from "@/server/api/routers/note";
import { statsRouter } from "@/server/api/routers/stats";
import { userRouter } from "@/server/api/routers/user";
import { publicProcedure, router } from "@/server/api/trpc";

export const appRouter = router({
  auth: authRouter,
  collaborator: collaboratorRouter,
  folder: folderRouter,
  note: noteRouter,
  stats: statsRouter,
  user: userRouter,
  health: publicProcedure.query(() => ({ ok: true })),
});

export type AppRouter = typeof appRouter;
