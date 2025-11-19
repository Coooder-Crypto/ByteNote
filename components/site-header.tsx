"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

export function SiteHeader() {
  const meQuery = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 30,
  });

  return (
    <header className="border-border/60 bg-background/80 border-b px-6 py-4 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <div className="text-muted-foreground flex items-center gap-6 text-sm">
          <Link href="/" className="text-foreground text-lg font-semibold">
            Byte Note
          </Link>
          <nav className="hidden gap-4 md:flex">
            <Link href="/notes" className="hover:text-foreground">
              笔记广场
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {meQuery.data ? (
            <Link href="/profile" className="hover:opacity-80">
              {meQuery.data.avatarUrl ? (
                <Image
                  src={meQuery.data.avatarUrl}
                  alt="Avatar"
                  width={36}
                  height={36}
                  className="border-border h-9 w-9 rounded-full border object-cover"
                />
              ) : (
                <div className="bg-muted h-9 w-9 rounded-full" />
              )}
            </Link>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth">登录 / 注册</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
