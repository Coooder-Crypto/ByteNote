"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AvatarUploader } from "@/components/avatar-uploader";
import { ProfileInfoCard } from "@/components/profile-info-card";
import { ProfileNoteList } from "@/components/profile-note-list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";

export default function ProfilePage() {
  const router = useRouter();
  const meQuery = trpc.auth.me.useQuery();
  const notesQuery = trpc.note.list.useQuery(undefined, {
    enabled: Boolean(meQuery.data),
  });
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => meQuery.refetch(),
  });
  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      meQuery.refetch();
      setEditOpen(false);
    },
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);

  const handleEditOpenChange = (open: boolean) => {
    setEditOpen(open);
    if (open) {
      setEditName(meQuery.data?.name ?? "");
      setPendingAvatar(meQuery.data?.avatarUrl ?? null);
    }
  };

  const user = meQuery.data;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-6">
        <div className="flex gap-6">
          <ProfileInfoCard
            user={user}
            onEdit={() => setEditOpen(true)}
            onLogout={() => logoutMutation.mutate()}
            isLoggingOut={logoutMutation.isPending}
          />
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            热力图功能开发中，敬请期待
          </div>
        </div>

        <div className="space-y-4">
          <ProfileNoteList
            user={user}
            notes={notesQuery.data ?? []}
            isLoading={notesQuery.isLoading}
            error={notesQuery.error ?? null}
            onEdit={(id) => router.push(`/notes/${id}`)}
          />
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={handleEditOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑个人资料</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <AvatarUploader
                value={pendingAvatar ?? user?.avatarUrl ?? null}
                onUploaded={(url) => setPendingAvatar(url)}
              />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">昵称</p>
              <Input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                placeholder="编辑昵称"
              />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">邮箱</p>
              <Input value={user?.email ?? ""} disabled />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                updateProfileMutation.mutate({
                  name: editName || undefined,
                  avatarUrl: pendingAvatar ?? undefined,
                })
              }
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "保存中..." : "保存更改"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
