"use client";

import { BarChart3, Moon, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui";
import { useNetworkStatus, useTheme, useUserStore } from "@/hooks";
import { cn } from "@/lib/utils";

import ProfileSettingsDialog from "./ProfileSettingsDialog";

type SideFooterProps = {
  onLogin: () => void;
  onLogout: () => void;
  onProfileUpdated?: () => void;
  collapsed?: boolean;
  currentPath?: string;
};

export default function SideFooter({
  onLogin,
  onLogout,
  onProfileUpdated,
  collapsed = false,
  currentPath = "",
}: SideFooterProps) {
  const { user } = useUserStore();
  const { theme, toggleTheme } = useTheme();
  const { online } = useNetworkStatus();
  const [mounted, setMounted] = useState(false);

  const avatar = user ? (
    user.avatarUrl ? (
      <Image
        src={user.avatarUrl}
        alt="avatar"
        width={40}
        height={40}
        className="h-full w-full object-cover"
        unoptimized
      />
    ) : (
      <div className="bg-primary/10 text-primary flex h-full w-full items-center justify-center text-sm font-semibold">
        {user.name?.[0] ?? user.email?.[0] ?? "?"}
      </div>
    )
  ) : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="border-border/60 border-t px-4 py-4">
      {user && (
        <Link
          href="/notes/stats"
          className={cn(
            "mb-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
            collapsed ? "justify-center" : "",
            currentPath.startsWith("/notes/stats")
              ? "bg-primary/10 text-primary border-primary/30 border shadow-sm"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-transparent",
          )}
          title="统计数据"
        >
          <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
            <BarChart3 className="size-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span>统计数据</span>
              <span className="text-muted-foreground text-xs">
                笔记概览与趋势
              </span>
            </div>
          )}
        </Link>
      )}
      {!collapsed && (
        <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
          <span
            className={cn(
              "inline-block h-2.5 w-2.5 rounded-full",
              online ? "bg-emerald-500" : "bg-rose-500",
            )}
          />
          <span>{online ? "在线" : "离线"}</span>
        </div>
      )}
      {user ? (
        <div className="space-y-3">
          {collapsed ? (
            <div className="flex justify-center">
              <ProfileSettingsDialog
                user={user}
                onUpdated={onProfileUpdated}
                onLogout={onLogout}
                trigger={
                  <button
                    type="button"
                    className="border-border/60 focus-visible:ring-ring flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    aria-label="打开设置"
                  >
                    {avatar}
                  </button>
                }
              />
            </div>
          ) : (
            <div className="bg-muted/60 flex items-center gap-3 rounded-xl px-3 py-2">
              <div className="border-border/60 h-10 w-10 min-w-[2.5rem] shrink-0 overflow-hidden rounded-full border">
                {avatar}
              </div>
              <div className="flex-1">
                <p className="text-foreground overflow-hidden text-sm font-medium">
                  {user.name ?? "未命名"}
                </p>
              </div>
              <ProfileSettingsDialog
                user={user}
                onUpdated={onProfileUpdated}
                onLogout={onLogout}
              />
            </div>
          )}
        </div>
      ) : (
        !collapsed && (
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
        )
      )}
    </div>
  );
}
