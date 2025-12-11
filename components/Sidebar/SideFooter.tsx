"use client";

import { BarChart3, Moon, Sun } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui";
import { useNetworkStatus, useTheme, useUserStore } from "@/hooks";
import { cn } from "@/lib/utils";

import NavItem from "./NavItem";
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
        <NavItem
          href="/notes/stats"
          label="统计数据"
          icon={BarChart3}
          active={currentPath.startsWith("/notes/stats")}
          collapsed={collapsed}
          className="mb-3"
        />
      )}
      <div
        className={cn(
          "text-muted-foreground mb-2 flex items-center gap-2 text-xs",
          collapsed ? "justify-center" : "",
        )}
      >
        <span
          className={cn(
            "inline-block h-2.5 w-2.5 rounded-full",
            online ? "bg-emerald-500" : "bg-rose-500",
          )}
        />
        <span
          className={cn(
            "whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out",
            collapsed ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100",
          )}
        >
          {online ? "在线" : "离线"}
        </span>
      </div>
      {user ? (
        <div className="space-y-3">
          {collapsed ? (
            <div className="flex justify-center">
              <ProfileSettingsDialog
                user={user}
                onUpdated={onProfileUpdated}
                onLogout={onLogout}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 overflow-hidden rounded-full"
                    aria-label="打开设置"
                  >
                    {avatar}
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="bg-muted/60 flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2">
              <div className="border-border/60 h-10 w-10 min-w-[2.5rem] shrink-0 overflow-hidden rounded-full border">
                {avatar}
              </div>
              <div className="flex-1 overflow-hidden">
                <p
                  className={`text-foreground text-sm font-medium whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out ${collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"}`}
                >
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
