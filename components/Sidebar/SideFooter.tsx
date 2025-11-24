import { LogOut, Moon } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/Button";

import { ProfileSettingsDialog } from "./ProfileSettingsDialog";

type SideFooterProps = {
  user?: {
    name: string | null;
    email: string;
    id: string;
    avatarUrl: string | null;
  } | null;
  onLogin: () => void;
  onLogout: () => void;
  onProfileUpdated?: () => void;
};

export function SideFooter({
  user,
  onLogin,
  onLogout,
  onProfileUpdated,
}: SideFooterProps) {
  console.log(user);
  return (
    <div className="border-border/60 border-t px-4 py-4">
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
                {user.name?.[0] ?? user.email[0]}
              </div>
            )}
            <div className="flex-1">
              <p className="text-foreground text-sm font-medium">
                {user.name ?? "未命名"}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {user.email}
              </p>
            </div>
            <ProfileSettingsDialog user={user} onUpdated={onProfileUpdated} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Button
              variant="ghost"
              className="text-muted-foreground gap-1 rounded-lg"
            >
              <Moon className="size-3.5" />
              主题
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
        </div>
      )}
    </div>
  );
}
