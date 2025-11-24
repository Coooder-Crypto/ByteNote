import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "@/server/api/trpc";

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    return ctx.session?.user ?? null;
  }),
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().max(120).optional(),
        avatarUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data: {
        name?: string | null;
        avatarUrl?: string | null;
      } = {};

      if (input.name !== undefined) {
        data.name = input.name || null;
      }

      if (input.avatarUrl !== undefined) {
        data.avatarUrl = input.avatarUrl;
      }

      const updated = await ctx.prisma.user.update({
        where: { id: ctx.session!.user.id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      });
      return updated;
    }),
});
