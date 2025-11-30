"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
import { useUserActions } from "@/hooks";
import { cn } from "@/lib/utils";
import type { BnUser } from "@/types/entities";

import AvatarUploader from "./AvatarUploader";

type ProfileSettingsDialogProps = {
  user: BnUser;
  onUpdated?: () => void;
  className?: string;
};

export default function ProfileSettingsDialog({
  user,
  onUpdated,
  className,
}: ProfileSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user.avatarUrl ?? null,
  );
  const { updateProfile, updateProfilePending, updateProfileError } =
    useUserActions();

  useEffect(() => {
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
        <button
          type="button"
          className={cn(
            "text-muted-foreground hover:text-foreground transition",
            className,
          )}
          aria-label="编辑资料"
        >
          <Settings className="size-4" />
        </button>
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
