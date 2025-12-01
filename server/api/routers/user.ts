import { z } from "zod";

import { protectedProcedure, router } from "@/server/api/trpc";

export const userRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.session?.user ?? null;
  }),
  search: protectedProcedure
    .input(z.object({ keyword: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const kw = input.keyword.trim();
      if (!kw) return [];
      return ctx.prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: kw, mode: "insensitive" } },
            { name: { contains: kw, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
        take: 10,
      });
    }),
});
