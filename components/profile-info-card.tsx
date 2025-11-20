"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProfileInfoCardProps = {
  user?: {
    name: string | null;
    email: string;
    avatarUrl: string | null;
  } | null;
  onEdit: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
  className?: string;
};

export function ProfileInfoCard({
  user,
  onEdit,
  onLogout,
  isLoggingOut,
  className,
}: ProfileInfoCardProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center gap-3">
        {user?.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt="avatar"
            width={64}
            height={64}
            className="border-border h-14 w-14 rounded-full border object-cover"
          />
        ) : (
          <div className="border-border h-14 w-14 rounded-full border border-dashed" />
        )}
        <div>
          <CardTitle>{user?.name ?? "未登录"}</CardTitle>
          <p className="text-muted-foreground text-xs">
            {user?.email ?? "请先登录"}
          </p>
        </div>
      </CardHeader>
      <CardContent className="text-muted-foreground space-y-3 text-sm">
        <p>欢迎使用 Byte Note。</p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {user ? (
          <>
            <Button className="w-full" onClick={onEdit}>
              编辑资料
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={onLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "退出中..." : "退出登录"}
            </Button>
          </>
        ) : (
          <Button asChild className="w-full">
            <Link href="/auth">登录 / 注册</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
