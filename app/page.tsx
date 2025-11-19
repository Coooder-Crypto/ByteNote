"use client";

import { useState } from "react";

import { AvatarUploader } from "@/components/avatar-uploader";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

export default function HomePage() {
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

  const handleRegister = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    registerMutation.mutate({
      email: registerEmail,
      password: registerPassword,
      name: registerName || undefined,
    });
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.mutate({
      email: loginEmail,
      password: loginPassword,
    });
  };

  const user = meQuery.data;

  return (
    <main className="flex min-h-svh flex-col gap-8 bg-background px-6 py-12 text-foreground">
      <section className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleRegister}
          className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-6 shadow-sm"
        >
          <div>
            <h1 className="text-xl font-semibold">注册账号</h1>
            <p className="text-sm text-muted-foreground">
              直接通过 tRPC + Prisma 写库
            </p>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium">
            昵称（可选）
            <input
              className="rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={registerName}
              onChange={(event) => setRegisterName(event.target.value)}
              placeholder="Byte Note 用户"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            邮箱
            <input
              className="rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
              className="rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
            <p className="text-sm text-destructive">
              {registerMutation.error.message}
            </p>
          )}
        </form>

        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-6 shadow-sm"
        >
          <div>
            <h1 className="text-xl font-semibold">账号登录</h1>
            <p className="text-sm text-muted-foreground">
              登录成功后会设置 HttpOnly Cookie
            </p>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium">
            邮箱
            <input
              className="rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
              className="rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
            <p className="text-sm text-destructive">
              {loginMutation.error.message}
            </p>
          )}
        </form>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {user ? `当前登录：${user.name ?? user.email}` : "尚未登录"}
            </p>
            <p className="text-sm text-muted-foreground">
              注册/登录成功后可直接在下方上传头像
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? "退出中..." : "退出登录"}
          </Button>
        </div>
        {user ? (
          <div className="mt-6 space-y-4">
            <AvatarUploader />
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            登录后可上传头像（Vercel Blob）
          </p>
        )}
      </section>
    </main>
  );
}
