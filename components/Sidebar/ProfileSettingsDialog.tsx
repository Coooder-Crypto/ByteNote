"use client";

import { LogOut, Moon, Settings, Sun, Trash2 } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from "@/components/ui";
import { useTheme, useUserActions } from "@/hooks";
import { localManager } from "@/lib/manager/LocalManager";
import { cn } from "@/lib/utils";
import type { BnUser } from "@/types";

import AvatarUploader from "./AvatarUploader";

type ProfileSettingsDialogProps = {
  user: BnUser;
  onUpdated?: () => void;
  className?: string;
  onLogout?: () => void;
  trigger?: ReactNode;
};

export default function ProfileSettingsDialog({
  user,
  onUpdated,
  className,
  onLogout,
  trigger,
}: ProfileSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user.avatarUrl ?? null,
  );
  const { theme, toggleTheme } = useTheme();
  const { updateProfile, updateProfilePending, updateProfileError } =
    useUserActions();
  const [clearing, setClearing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (open) {
      setName(user.name ?? "");
      setAvatarUrl(user.avatarUrl ?? null);
    }
  }, [open, user.avatarUrl, user.name]);

  const canSubmit = useMemo(() => {
    return (
      (name ?? "") !== (user.name ?? "") ||
      (avatarUrl ?? null) !== (user.avatarUrl ?? null)
    );
  }, [avatarUrl, name, user.avatarUrl, user.name]);

  const handleSave = () => {
    if (!canSubmit || updateProfilePending) return;
    updateProfile(
      {
        name,
        avatarUrl: avatarUrl ?? undefined,
      },
      () => {
        onUpdated?.();
        setOpen(false);
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn("text-muted-foreground", className)}
            aria-label="编辑资料"
          >
            <Settings className="size-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑个人资料</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <AvatarUploader
            value={avatarUrl}
            onUploaded={(url) => setAvatarUrl(url)}
          />
          <div className="space-y-2">
            <Label htmlFor="profile-name">昵称</Label>
            <Input
              id="profile-name"
              placeholder="输入昵称"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          {updateProfileError && (
            <p className="text-destructive text-sm">
              {updateProfileError.message}
            </p>
          )}
          <div className="space-y-2 rounded-xl border p-3">
            <p className="text-sm font-semibold">通用设置</p>
            <div className="flex flex-col gap-2 text-sm">
              <Button
                variant="outline"
                size="sm"
                className="justify-between"
                onClick={toggleTheme}
              >
                <span className="flex items-center gap-2">
                  {mounted && theme === "dark" ? (
                    <Sun className="size-4" />
                  ) : (
                    <Moon className="size-4" />
                  )}
                  切换主题
                </span>
                <span className="text-muted-foreground text-xs uppercase">
                  {mounted && theme === "dark" ? "Dark" : "Light"}
                </span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="text-destructive justify-between"
                disabled={clearing}
                onClick={async () => {
                  setClearing(true);
                  try {
                    await localManager.clearAll();
                    window.location.reload();
                  } finally {
                    setClearing(false);
                  }
                }}
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="size-4" /> 清除本地缓存
                </span>
                <span className="text-xs">{clearing ? "..." : ""}</span>
              </Button>

              {onLogout && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive justify-start gap-2"
                  onClick={() => {
                    onLogout();
                    setOpen(false);
                  }}
                >
                  <LogOut className="size-4" /> 退出登录
                </Button>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={!canSubmit || updateProfilePending}
            onClick={handleSave}
          >
            {updateProfilePending ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
