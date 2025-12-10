import { initTRPC, TRPCError } from "@trpc/server";
import type { NextRequest } from "next/server";
import superjson from "superjson";

import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { BnUser } from "@/types";

type CreateContextOptions = {
  req: NextRequest;
};

export const createTRPCContext = async ({ req }: CreateContextOptions) => {
  let session: { user: BnUser } | null = null;

  const authUser = await getSessionUser(req);
  if (authUser?.id) {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    });

    if (user) {
      session = {
        user: {
          id: user.id,
          email: user.email ?? null,
          name: user.name ?? null,
          avatarUrl: user.avatarUrl ?? null,
        },
      };
    }
  }

  return {
    prisma,
    session,
  };
};

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({ ctx });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceAuth);
