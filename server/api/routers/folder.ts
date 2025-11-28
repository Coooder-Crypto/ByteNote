import { z } from "zod";

import { protectedProcedure, router } from "@/server/api/trpc";

export const folderRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session!.user.id;
    const [folders, noteCounts] = await Promise.all([
      ctx.prisma.folder.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      ctx.prisma.note.groupBy({
        by: ["folderId"],
        where: {
          userId,
          deletedAt: null,
          folderId: { not: null },
        },
        _count: { _all: true },
      }),
    ]);

    const countMap = new Map<string, number>();
    noteCounts.forEach((item) => {
      if (item.folderId) {
        countMap.set(item.folderId, item._count._all);
      }
    });

    return folders.map((folder) => ({
      ...folder,
      noteCount: countMap.get(folder.id) ?? 0,
    }));
  }),
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(60) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id;
      const folder = await ctx.prisma.folder.create({
        data: {
          name: input.name,
          userId,
        },
      });
      return folder;
    }),
  rename: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(60),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id;
      await ctx.prisma.folder.update({
        where: {
          id: input.id,
          userId,
        },
        data: { name: input.name },
      });
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id;
      await ctx.prisma.$transaction([
        ctx.prisma.note.updateMany({
          where: { folderId: input.id, userId },
          data: { folderId: null },
        }),
        ctx.prisma.folder.delete({
          where: { id: input.id, userId },
        }),
      ]);
      return { success: true };
    }),
});
