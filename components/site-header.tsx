"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { AvatarUploader } from "@/components/avatar-uploader";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

type SiteHeaderProps = {
  showAvatarUploader?: boolean;
};

export function SiteHeader({ showAvatarUploader = false }: SiteHeaderProps) {
  const meQuery = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 30,
  });
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => meQuery.refetch(),
  });

  const userAvatar = useMemo(() => {
    if (!meQuery.data?.avatarUrl) return null;
    return (
      <Image
        src={meQuery.data.avatarUrl}
        alt="Avatar"
        width={36}
        height={36}
        className="border-border h-9 w-9 rounded-full border object-cover"
      />
    );
  }, [meQuery.data]);

  return (
    <header className="border-border/60 bg-background/80 border-b px-6 py-4 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <div className="text-muted-foreground flex items-center gap-6 text-sm">
          <Link href="/" className="text-foreground text-lg font-semibold">
            Byte Note
          </Link>
          <nav className="hidden gap-4 md:flex">
            <Link href="/auth" className="hover:text-foreground">
              账号中心
            </Link>
            <Link href="/dashboard" className="hover:text-foreground">
              控制台
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {meQuery.data ? (
            <>
              <div className="hidden text-right text-sm md:block">
                <p className="font-medium">
                  {meQuery.data.name ?? meQuery.data.email}
                </p>
              </div>
              {userAvatar ?? <div className="bg-muted h-9 w-9 rounded-full" />}
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "退出…" : "退出"}
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth">登录 / 注册</Link>
            </Button>
          )}
        </div>
      </div>
      {showAvatarUploader && meQuery.data && (
        <div className="border-border/60 bg-card mx-auto mt-4 max-w-6xl rounded-xl border p-4">
          <p className="text-muted-foreground text-sm font-medium">
            快速上传头像
          </p>
          <div className="mt-3">
            <AvatarUploader />
          </div>
        </div>
      )}
    </header>
  );
}
