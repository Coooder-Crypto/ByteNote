import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { pusherServer } from "@/lib/pusher/server";
import { protectedProcedure, router } from "@/server/api/trpc";

const noteInput = z.object({
  title: z.string().min(1).max(120),
  contentJson: z.any(),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
  folderId: z.string().uuid().optional().nullable(),
  version: z.number().optional(),
  isCollaborative: z.boolean().optional(),
});

export const noteRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          filter: z.enum(["all", "favorite", "trash", "collab"]).optional(),
          folderId: z.string().uuid().optional(),
          collaborativeOnly: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const filter = input?.filter ?? "all";
      const where: Prisma.NoteWhereInput = {
        OR: [
          { userId: ctx.session!.user.id },
          { collaborators: { some: { userId: ctx.session!.user.id } } },
        ],
      };

      if (filter === "trash") {
        where.deletedAt = { not: null };
      } else {
        where.deletedAt = null;
      }

      if (filter === "favorite") {
        where.isFavorite = true;
      }

      if (filter === "collab") {
        where.isCollaborative = true;
      }

      if (input?.folderId) {
        where.folderId = input.folderId;
      }
      if (input?.collaborativeOnly) {
        where.isCollaborative = true;
      }

      const searchTerm = input?.search?.trim();
      if (searchTerm) {
        if (!Array.isArray(where.AND)) {
          where.AND = where.AND ? [where.AND] : [];
        }
        where.AND.push({
          title: {
            contains: searchTerm,
            mode: "insensitive",
          },
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
          contentJson: true,
          isFavorite: true,
          isCollaborative: true,
          deletedAt: true,
          folderId: true,
          tags: true,
          userId: true,
          version: true,
          collaborators: {
            select: { userId: true, role: true },
          },
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
          OR: [
            { userId: ctx.session!.user.id },
            { collaborators: { some: { userId: ctx.session!.user.id } } },
          ],
        },
        select: {
          id: true,
          title: true,
          contentJson: true,
          summary: true,
          tags: true,
          folderId: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          version: true,
          isFavorite: true,
          deletedAt: true,
          isCollaborative: true,
          collaborators: {
            select: { userId: true, role: true },
          },
        },
      });

      return note;
    }),
  create: protectedProcedure
    .input(noteInput)
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.prisma.note.create({
        data: {
          title: input.title,
          contentJson: input.contentJson ?? {},
          summary: input.summary ?? "",
          isFavorite: false,
          isCollaborative: input.isCollaborative ?? false,
          tags: JSON.stringify(input.tags ?? []),
          folderId: input.folderId ?? null,
          deletedAt: null,
          userId: ctx.session!.user.id,
        },
      });
      if (note.isCollaborative) {
        await ctx.prisma.noteCollaborator.upsert({
          where: {
            noteId_userId: { noteId: note.id, userId: ctx.session!.user.id },
          },
          update: { role: "owner" },
          create: {
            noteId: note.id,
            userId: ctx.session!.user.id,
            role: "owner",
          },
        });
      }
      return note;
    }),
  update: protectedProcedure
    .input(
      noteInput.extend({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const result = await ctx.prisma.$transaction(async (tx) => {
        const updated = await tx.note.updateMany({
          where: {
            id,
            OR: [
              { userId: ctx.session!.user.id },
              { collaborators: { some: { userId: ctx.session!.user.id } } },
            ],
            deletedAt: null,
            ...(typeof rest.version === "number"
              ? { version: rest.version }
              : {}),
          },
          data: {
            title: rest.title,
            contentJson: rest.contentJson ?? {},
            summary: rest.summary ?? "",
            tags: JSON.stringify(rest.tags ?? []),
            folderId: rest.folderId ?? null,
            isCollaborative: rest.isCollaborative ?? false,
            version: { increment: 1 },
          },
        });

        if (!updated.count) {
          return null;
        }

        if (rest.isCollaborative) {
          await tx.noteCollaborator.upsert({
            where: {
              noteId_userId: { noteId: id, userId: ctx.session!.user.id },
            },
            update: { role: "owner" },
            create: { noteId: id, userId: ctx.session!.user.id, role: "owner" },
          });
        } else {
          await tx.noteCollaborator.deleteMany({
            where: { noteId: id },
          });
        }

        return tx.note.findUnique({
          where: { id },
          select: {
            id: true,
            title: true,
            contentJson: true,
            tags: true,
            folderId: true,
            version: true,
            updatedAt: true,
            createdAt: true,
            isCollaborative: true,
          },
        });
      });

      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      try {
        if (pusherServer && result.isCollaborative) {
          await pusherServer.trigger(
            `presence-note-${id}`,
            "server-note-saved",
            {
              noteId: id,
              title: result.title,
              contentJson: result.contentJson,
              updatedAt: result.updatedAt,
              version: result.version,
            },
          );
        }
      } catch (error) {
        console.warn("[pusher] broadcast note update failed", error);
      }

      return result;
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
