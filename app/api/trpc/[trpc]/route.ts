import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

export const runtime = "nodejs";

export const handler = (req: NextRequest) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () =>
      createTRPCContext({
        req,
      }),
    onError({ error, path }) {
      console.error("tRPC error on path", path, error);
    },
  });
};

export { handler as GET, handler as POST };
