"use client";

import { useState } from "react";

import { AvatarUploader } from "@/components/avatar-uploader";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

export default function AuthPage() {
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const meQuery = trpc.auth.me.useQuery();

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      meQuery.refetch();
      setRegisterPassword("");
    },
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      meQuery.refetch();
      setLoginPassword("");
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      meQuery.refetch();
    },
  });

  const user = meQuery.data;

  return (
    <main className="bg-background text-foreground flex min-h-svh flex-col">
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            registerMutation.mutate({
              email: registerEmail,
              password: registerPassword,
              name: registerName || undefined,
            });
          }}
          className="border-border/60 bg-card flex flex-col gap-4 rounded-xl border p-6 shadow-sm"
        >
          <div>
            <h2 className="text-xl font-semibold">注册账号</h2>
            <p className="text-muted-foreground text-sm">
              使用邮箱 + 密码，自动创建 session
            </p>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium">
            昵称（可选）
            <input
              className="border-input bg-background focus-visible:ring-ring/50 rounded-md border px-3 py-2 text-base outline-none focus-visible:ring-[3px]"
              value={registerName}
              onChange={(event) => setRegisterName(event.target.value)}
              placeholder="Byte Note 用户"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            邮箱
            <input
              className="border-input bg-background focus-visible:ring-ring/50 rounded-md border px-3 py-2 text-base outline-none focus-visible:ring-[3px]"
              value={registerEmail}
              onChange={(event) => setRegisterEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            密码
            <input
              className="border-input bg-background focus-visible:ring-ring/50 rounded-md border px-3 py-2 text-base outline-none focus-visible:ring-[3px]"
              value={registerPassword}
              onChange={(event) => setRegisterPassword(event.target.value)}
              placeholder="至少 6 位"
              type="password"
              minLength={6}
              required
            />
          </label>
          <Button type="submit" size="lg" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? "注册中..." : "注册"}
          </Button>
          {registerMutation.error && (
            <p className="text-destructive text-sm">
              {registerMutation.error.message}
            </p>
          )}
        </form>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            loginMutation.mutate({
              email: loginEmail,
              password: loginPassword,
            });
          }}
          className="border-border/60 bg-card flex flex-col gap-4 rounded-xl border p-6 shadow-sm"
        >
          <div>
            <h2 className="text-xl font-semibold">登录账号</h2>
            <p className="text-muted-foreground text-sm">
              成功后将返回用户信息与 cookie
            </p>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium">
            邮箱
            <input
              className="border-input bg-background focus-visible:ring-ring/50 rounded-md border px-3 py-2 text-base outline-none focus-visible:ring-[3px]"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            密码
            <input
              className="border-input bg-background focus-visible:ring-ring/50 rounded-md border px-3 py-2 text-base outline-none focus-visible:ring-[3px]"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              placeholder="至少 6 位"
              type="password"
              minLength={6}
              required
            />
          </label>
          <Button type="submit" size="lg" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "登录中..." : "登录"}
          </Button>
          {loginMutation.error && (
            <p className="text-destructive text-sm">
              {loginMutation.error.message}
            </p>
          )}
        </form>
      </section>

      <section className="border-border/60 bg-card mx-auto mb-12 w-full max-w-5xl rounded-xl border p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm">
              {user ? `当前登录：${user.name ?? user.email}` : "尚未登录"}
            </p>
            <p className="text-muted-foreground text-sm">
              登录后可直接上传头像，头像 URL 会写回数据库。
            </p>
          </div>
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "退出中..." : "退出登录"}
            </Button>
          )}
        </div>
        {user ? (
          <div className="mt-6 space-y-4">
            <AvatarUploader />
          </div>
        ) : (
          <p className="text-muted-foreground mt-6 text-sm">
            请先登录，再试试看 Vercel Blob 上传能力。
          </p>
        )}
      </section>
    </main>
  );
}
