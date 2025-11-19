import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { hashPassword, verifyPassword } from "@/lib/auth";
import { createSession, deleteSession } from "@/lib/session";
import { protectedProcedure, publicProcedure, router } from "@/server/api/trpc";

const userPayload = (user: {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}) => user;

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "邮箱已被注册",
        });
      }

      const { hash, salt } = await hashPassword(input.password);
      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          name: input.name ?? null,
          passwordHash: hash,
          passwordSalt: salt,
        },
      });

      const session = await createSession(ctx.prisma, user.id);
      ctx.setSessionCookie(session.sessionToken, session.expiresAt);

      return userPayload({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl ?? null,
      });
    }),
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "邮箱或密码错误" });
      }

      const isValid = await verifyPassword(input.password, user.passwordHash);

      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "邮箱或密码错误" });
      }

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const session = await createSession(ctx.prisma, user.id);
      ctx.setSessionCookie(session.sessionToken, session.expiresAt);

      return userPayload({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl ?? null,
      });
    }),
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.session) {
      await deleteSession(ctx.prisma, ctx.session.token);
    }
    ctx.clearSessionCookie();
    return { success: true };
  }),
  me: publicProcedure.query(({ ctx }) => {
    return ctx.session?.user ?? null;
  }),
});
