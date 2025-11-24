"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { trpc } from "@/lib/trpc/client";

export default function AuthPage() {
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const router = useRouter();
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => router.push("/profile"),
  });
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => router.push("/profile"),
  });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold">账号中心</h2>
        <p className="text-muted-foreground text-sm">
          在这里完成注册或登录操作。
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>注册账号</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">昵称（可选）</Label>
              <Input
                value={registerName}
                onChange={(event) => setRegisterName(event.target.value)}
                placeholder="Byte Note 用户"
              />
            </div>
            <div>
              <Label className="text-xs">邮箱</Label>
              <Input
                type="email"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <Label className="text-xs">密码</Label>
              <Input
                type="password"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                placeholder="至少 6 位"
                minLength={6}
                required
              />
            </div>
            <Button
              className="w-full"
              onClick={() =>
                registerMutation.mutate({
                  email: registerEmail,
                  password: registerPassword,
                  name: registerName || undefined,
                })
              }
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "注册中..." : "注册"}
            </Button>
            {registerMutation.error && (
              <p className="text-destructive text-xs">
                {registerMutation.error.message}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>登录账号</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">邮箱</Label>
              <Input
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <Label className="text-xs">密码</Label>
              <Input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="至少 6 位"
                minLength={6}
                required
              />
            </div>
            <Button
              className="w-full"
              onClick={() =>
                loginMutation.mutate({
                  email: loginEmail,
                  password: loginPassword,
                })
              }
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "登录中..." : "登录"}
            </Button>
            {loginMutation.error && (
              <p className="text-destructive text-xs">
                {loginMutation.error.message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
