"use client";

import { Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AvatarUploader } from "@/components/AvatarUploader";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

type ProfileSettingsDialogProps = {
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  onUpdated?: () => void;
  className?: string;
};

export function ProfileSettingsDialog({
  user,
  onUpdated,
  className,
}: ProfileSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user.avatarUrl ?? null,
  );

  useEffect(() => {
    if (open) {
      setName(user.name ?? "");
      setAvatarUrl(user.avatarUrl ?? null);
    }
  }, [open, user.avatarUrl, user.name]);

  const utils = trpc.useUtils();
  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      void utils.auth.me.invalidate();
      onUpdated?.();
      setOpen(false);
    },
  });

  const canSubmit = useMemo(() => {
    return (
      (name ?? "") !== (user.name ?? "") ||
      (avatarUrl ?? null) !== (user.avatarUrl ?? null)
    );
  }, [avatarUrl, name, user.avatarUrl, user.name]);

  const handleSave = () => {
    if (!canSubmit || updateProfile.isPending) return;
    updateProfile.mutate({
      name,
      avatarUrl: avatarUrl ?? undefined,
    });
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
          {updateProfile.error && (
            <p className="text-destructive text-sm">
              {updateProfile.error.message}
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
            disabled={!canSubmit || updateProfile.isPending}
            onClick={handleSave}
          >
            {updateProfile.isPending ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
