"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { SessionProvider } from "next-auth/react";
import { signOut } from "next-auth/react";
import { ReactNode, useRef, useState } from "react";
import { Toaster } from "sonner";
import superjson from "superjson";

import { ThemeProvider } from "@/components/common";
import { trpc } from "@/lib/trpc/client";

export function Providers({ children }: { children: ReactNode }) {
  const handledUnauthorizedRef = useRef(false);

  const handleUnauthorized = (error: unknown) => {
    const code =
      (error as { data?: { code?: string } })?.data?.code ??
      (error as { shape?: { code?: string } })?.shape?.code;
    const httpStatus = (error as { data?: { httpStatus?: number } })?.data
      ?.httpStatus;
    if (code === "UNAUTHORIZED" || httpStatus === 401) {
      if (!handledUnauthorizedRef.current) {
        handledUnauthorizedRef.current = true;
        void signOut({ redirect: true, callbackUrl: "/auth" });
      }
    }
  };

  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: handleUnauthorized,
        }),
        mutationCache: new MutationCache({
          onError: handleUnauthorized,
        }),
      }),
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: "include",
            });
          },
        }),
      ],
    }),
  );

  return (
    <SessionProvider>
      <ThemeProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            {children}
            <Toaster position="bottom-right" richColors />
          </QueryClientProvider>
        </trpc.Provider>
      </ThemeProvider>
    </SessionProvider>
  );
}
