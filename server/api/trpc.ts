import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

type CreateContextOptions = {
  req: Request;
};

export const createTRPCContext = async ({ req }: CreateContextOptions) => {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  let session: {
    user: {
      id: string;
      email: string;
      name: string | null;
      avatarUrl: string | null;
    };
  } | null = null;

  if (token?.id) {
    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
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
          email: user.email ?? "",
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

  return next({
    ctx,
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceAuth);
