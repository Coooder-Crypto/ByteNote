"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserStore } from "@/hooks";

export default function AuthPageClient() {
  const { data: session, status } = useSession();
  const { user, setUser, clear } = useUserStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") ?? "/";

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      const nextUser = {
        id: session.user.id,
        name: session.user.name ?? session.user.email ?? null,
        email: session.user.email ?? null,
        avatarUrl: session.user.avatarUrl ?? null,
      };
      if (
        !user ||
        user.id !== nextUser.id ||
        user.name !== nextUser.name ||
        user.email !== nextUser.email ||
        user.avatarUrl !== nextUser.avatarUrl
      ) {
        setUser(nextUser);
      }
    }
    if (status === "unauthenticated") {
      clear();
    }
  }, [clear, session, setUser, status, user]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace(callbackUrl);
    }
  }, [callbackUrl, router, session, status]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>{session ? "已登录" : "使用 GitHub 登录"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {session ? (
            <>
              <p className="text-muted-foreground text-sm">
                当前账号：
                {session.user?.email ?? session.user?.name ?? "未命名"}
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  clear();
                  void signOut({ callbackUrl });
                }}
              >
                退出登录
              </Button>
            </>
          ) : (
            <Button
              className="w-full"
              onClick={() => signIn("github", { callbackUrl })}
            >
              GitHub 登录
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
