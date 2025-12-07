"use client";

import { LogOut, Moon, Sun } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useNetworkStatus, useTheme, useUserStore } from "@/hooks";
import { cn } from "@/lib/utils";

import ProfileSettingsDialog from "./ProfileSettingsDialog";

type SideFooterProps = {
  onLogin: () => void;
  onLogout: () => void;
  onProfileUpdated?: () => void;
};

export default function SideFooter({
  onLogin,
  onLogout,
  onProfileUpdated,
}: SideFooterProps) {
  const { user } = useUserStore();
  const { theme, toggleTheme } = useTheme();
  const { online } = useNetworkStatus();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <div className="border-border/60 border-t px-4 py-4">
      <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
        <span
          className={cn(
            "inline-block h-2.5 w-2.5 rounded-full",
            online ? "bg-emerald-500" : "bg-rose-500",
          )}
        />
        <span>{online ? "在线" : "离线"}</span>
      </div>
      {user ? (
        <div className="space-y-3">
          <div className="bg-muted/60 flex items-center gap-3 rounded-xl px-3 py-2">
            {user.avatarUrl ? (
              <div className="border-border/60 h-9 w-9 overflow-hidden rounded-full border">
                <Image
                  src={user.avatarUrl}
                  alt="avatar"
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                  //TODO: nextjs/image
                  unoptimized
                />
              </div>
            ) : (
              <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold">
                {user.name?.[0] ?? user.email?.[0] ?? "?"}
              </div>
            )}
            <div className="flex-1">
              <p className="text-foreground overflow-hidden text-sm font-medium">
                {user.name ?? "未命名"}
              </p>
            </div>
            <ProfileSettingsDialog user={user} onUpdated={onProfileUpdated} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Button
              variant="ghost"
              className="text-muted-foreground gap-1 rounded-lg"
              onClick={toggleTheme}
              aria-label="切换主题"
            >
              {mounted ? (
                theme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )
              ) : (
                <Sun className="size-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={onLogout}
              className="text-destructive hover:text-destructive gap-1 rounded-lg"
            >
              <LogOut className="size-3.5" />
              退出
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">欢迎体验 Byte Note</p>
          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={onLogin}
          >
            登录 / 注册
          </Button>
          <Button
            variant="ghost"
            className="text-muted-foreground w-full gap-2 rounded-lg"
            onClick={toggleTheme}
            aria-label="切换主题"
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )
            ) : (
              <Sun className="size-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
