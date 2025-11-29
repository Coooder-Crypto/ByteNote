import { z } from "zod";

import { protectedProcedure, router } from "@/server/api/trpc";

export const collaboratorRouter = router({
  list: protectedProcedure
    .input(z.object({ noteId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const note = await ctx.prisma.note.findFirst({
        where: { id: input.noteId, userId: ctx.session!.user.id },
        select: { id: true },
      });
      if (!note) {
        return [];
      }
      return ctx.prisma.noteCollaborator.findMany({
        where: { noteId: input.noteId },
        select: {
          id: true,
          role: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });
    }),
  add: protectedProcedure
    .input(
      z.object({
        noteId: z.string().uuid(),
        userId: z.string().uuid(),
        role: z.enum(["editor", "viewer"]).optional().default("editor"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.prisma.note.findFirst({
        where: { id: input.noteId, userId: ctx.session!.user.id },
        select: { id: true },
      });
      if (!note) {
        throw new Error("Forbidden");
      }
      const collaborator = await ctx.prisma.noteCollaborator.upsert({
        where: { noteId_userId: { noteId: input.noteId, userId: input.userId } },
        update: { role: input.role },
        create: {
          noteId: input.noteId,
          userId: input.userId,
          role: input.role,
        },
        select: {
          id: true,
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });
      return collaborator;
    }),
  remove: protectedProcedure
    .input(z.object({ noteId: z.string().uuid(), userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.prisma.note.findFirst({
        where: { id: input.noteId, userId: ctx.session!.user.id },
        select: { id: true },
      });
      if (!note) {
        throw new Error("Forbidden");
      }
      await ctx.prisma.noteCollaborator.deleteMany({
        where: { noteId: input.noteId, userId: input.userId },
      });
      return { success: true };
    }),
});
