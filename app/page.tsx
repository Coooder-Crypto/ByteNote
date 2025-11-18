"use client";

import { useState } from "react";

import { AvatarUploader } from "@/components/avatar-uploader";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const mutation = trpc.user.create.useMutation();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({ email, password });
  };

  return (
    <main className="bg-background text-foreground flex min-h-svh flex-col items-center gap-10 px-6 py-12">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-border p-6 text-left"
      >
        <div>
          <h1 className="text-xl font-semibold">创建测试用户</h1>
          <p className="text-sm text-muted-foreground">
            提交后会调用 tRPC mutation 写入 Postgres。
          </p>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium">
          邮箱
          <input
            className="rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          密码
          <input
            className="rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="至少 6 位"
            type="password"
            minLength={6}
            required
          />
        </label>
        <Button type="submit" size="lg" disabled={mutation.isPending}>
          {mutation.isPending ? "创建中..." : "添加用户"}
        </Button>
        {mutation.isSuccess && (
          <p className="text-sm text-emerald-600">
            创建成功：{mutation.data.email}
          </p>
        )}
        {mutation.error && (
          <p className="text-sm text-destructive">{mutation.error.message}</p>
        )}
      </form>

      <AvatarUploader />
    </main>
  );
}
