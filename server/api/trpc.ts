import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie as buildClearSessionCookie,
  createSessionCookie,
  parseSessionToken,
} from "@/lib/session";

type CreateContextOptions = {
  headers: Headers;
  resHeaders: Headers;
};

export const createTRPCContext = async ({ headers, resHeaders }: CreateContextOptions) => {
  const cookieHeader = headers.get("cookie");
  const sessionToken = parseSessionToken(cookieHeader);
  let session:
    | {
        token: string;
        expiresAt: Date;
        user: {
          id: string;
          email: string;
          name: string | null;
          avatarUrl: string | null;
        };
      }
    | null = null;

  if (sessionToken) {
    const dbSession = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (dbSession && dbSession.expiresAt > new Date()) {
      session = {
        token: dbSession.sessionToken,
        expiresAt: dbSession.expiresAt,
        user: {
          id: dbSession.user.id,
          email: dbSession.user.email,
          name: dbSession.user.name ?? null,
          avatarUrl: dbSession.user.avatarUrl ?? null,
        },
      };
    } else if (dbSession) {
      await prisma.session.delete({
        where: { sessionToken },
      });
      resHeaders.append("Set-Cookie", buildClearSessionCookie());
    }
  }

  return {
    prisma,
    session,
    responseHeaders: resHeaders,
    setSessionCookie(token: string, expiresAt: Date) {
      resHeaders.append("Set-Cookie", createSessionCookie(token, expiresAt));
    },
    clearSessionCookie() {
      resHeaders.append("Set-Cookie", buildClearSessionCookie());
    },
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
