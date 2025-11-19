import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

export const runtime = "nodejs";

export const handler = (req: Request) => {
  const responseHeaders = new Headers();

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () =>
      createTRPCContext({
        headers: req.headers,
        resHeaders: responseHeaders,
      }),
    responseMeta() {
      const headers: Record<string, string> = {};
      responseHeaders.forEach((value, key) => {
        headers[key] = value;
      });
      return { headers };
    },
    onError({ error, path }) {
      console.error("tRPC error on path", path, error);
    },
  });
};

export { handler as GET, handler as POST };
