"use client";

import { useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function AuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/notes";

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
                当前账号：{session.user.email ?? session.user.name}
              </p>
              <Button
                className="w-full"
                onClick={() => signOut({ callbackUrl })}
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
