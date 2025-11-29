import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "@/server/api/trpc";

const noteInput = z.object({
  title: z.string().min(1).max(120),
  markdown: z.string().min(1),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
  folderId: z.string().uuid().optional().nullable(),
});

export const noteRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          filter: z.enum(["all", "favorite", "trash"]).optional(),
          folderId: z.string().uuid().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const filter = input?.filter ?? "all";
      const where: Prisma.NoteWhereInput = {
        userId: ctx.session!.user.id,
      };

      if (filter === "trash") {
        where.deletedAt = { not: null };
      } else {
        where.deletedAt = null;
      }

      if (filter === "favorite") {
        where.isFavorite = true;
      }

      if (input?.folderId) {
        where.folderId = input.folderId;
      }

      const searchTerm = input?.search?.trim();

      if (searchTerm) {
        if (!Array.isArray(where.AND)) {
          where.AND = where.AND ? [where.AND] : [];
        }

        where.AND.push({
          OR: [
            {
              title: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
            {
              content: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
            {
              markdown: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          ],
        });
      }

      return ctx.prisma.note.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          summary: true,
          createdAt: true,
          updatedAt: true,
          markdown: true,
          content: true,
          isFavorite: true,
          deletedAt: true,
          folderId: true,
          tags: true,
          userId: true,
          user: {
            select: {
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });
    }),
  detail: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const note = await ctx.prisma.note.findFirst({
        where: {
          id: input.id,
          userId: ctx.session!.user.id,
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
          isFavorite: false,
          tags: JSON.stringify(input.tags ?? []),
          folderId: input.folderId ?? null,
          deletedAt: null,
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
      const updated = await ctx.prisma.note.updateMany({
        where: {
          id,
          userId: ctx.session!.user.id,
          deletedAt: null,
        },
        data: {
          title: rest.title,
          markdown: rest.markdown,
          content: rest.markdown,
          summary: rest.summary ?? "",
          tags: JSON.stringify(rest.tags ?? []),
          folderId: rest.folderId ?? null,
        },
      });

      if (!updated.count) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.note.findUnique({ where: { id } });
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.note.updateMany({
        where: {
          id: input.id,
          userId: ctx.session!.user.id,
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });
      if (!result.count) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return { success: true };
    }),
  restore: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.note.updateMany({
        where: {
          id: input.id,
          userId: ctx.session!.user.id,
        },
        data: { deletedAt: null },
      });
      if (!result.count) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return { success: true };
    }),
  destroy: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.note.deleteMany({
        where: {
          id: input.id,
          userId: ctx.session!.user.id,
          deletedAt: { not: null },
        },
      });
      if (!result.count) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return { success: true };
    }),
  setFavorite: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        isFavorite: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.note.updateMany({
        where: {
          id: input.id,
          userId: ctx.session!.user.id,
        },
        data: { isFavorite: input.isFavorite },
      });
      if (!result.count) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return { success: true };
    }),
  setFolder: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        folderId: z.string().uuid().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.note.updateMany({
        where: {
          id: input.id,
          userId: ctx.session!.user.id,
          deletedAt: null,
        },
        data: { folderId: input.folderId },
      });
      if (!result.count) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return { success: true };
    }),
});
