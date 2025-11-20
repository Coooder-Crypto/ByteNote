import { z } from "zod";

import { protectedProcedure, router } from "@/server/api/trpc";

const noteInput = z.object({
  title: z.string().min(1).max(120),
  markdown: z.string().min(1),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
});

export const noteRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          publicOnly: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const where = input?.publicOnly
        ? { isPublic: true }
        : { userId: ctx.session!.user.id };

      return ctx.prisma.note.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          summary: true,
          updatedAt: true,
          isPublic: true,
          tags: true,
          userId: true,
        },
      });
    }),
  detail: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const note = await ctx.prisma.note.findFirst({
        where: {
          id: input.id,
          OR: [
            { userId: ctx.session!.user.id },
            { isPublic: true },
          ],
        },
      });

      return note;
    }),
  create: protectedProcedure
    .input(noteInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.note.create({
        data: {
          title: input.title,
          markdown: input.markdown,
          content: input.markdown,
          summary: input.summary ?? "",
          isPublic: input.isPublic ?? false,
          tags: JSON.stringify(input.tags ?? []),
          userId: ctx.session!.user.id,
        },
      });
    }),
  update: protectedProcedure
    .input(
      noteInput.extend({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      return ctx.prisma.note.update({
        where: {
          id,
          userId: ctx.session!.user.id,
        },
        data: {
          title: rest.title,
          markdown: rest.markdown,
          content: rest.markdown,
          summary: rest.summary ?? "",
          isPublic: rest.isPublic ?? false,
          tags: JSON.stringify(rest.tags ?? []),
        },
      });
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.note.delete({
        where: {
          id: input.id,
          userId: ctx.session!.user.id,
        },
      });
      return { success: true };
    }),
});
