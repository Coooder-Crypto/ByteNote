"use client";

import { useMemo, useState } from "react";
import { UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";

type CollaboratorDialogProps = {
  noteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CollaboratorDialog({ noteId, open, onOpenChange }: CollaboratorDialogProps) {
  const utils = trpc.useUtils();
  const listQuery = trpc.collaborator.list.useQuery({ noteId }, { enabled: open });
  const addMutation = trpc.collaborator.add.useMutation({
    onSuccess: () => {
      utils.collaborator.list.invalidate({ noteId });
      setEmail("");
    },
  });
  const removeMutation = trpc.collaborator.remove.useMutation({
    onSuccess: () => utils.collaborator.list.invalidate({ noteId }),
  });

  const [email, setEmail] = useState("");

  const collaborators = useMemo(
    () => listQuery.data ?? [],
    [listQuery.data],
  );

  const handleInvite = () => {
    if (!email.trim()) return;
    // TODO: lookup userId by email via backend; placeholder rejects for now.
    alert("请实现按邮箱查找用户后调用 add API");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>协作者管理</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="输入协作者邮箱"
            />
            <Button onClick={handleInvite} disabled={addMutation.isPending} className="gap-2">
              <UserPlus className="size-4" />
              邀请
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs">已有协作者</p>
            <div className="space-y-2">
              {collaborators.length === 0 ? (
                <p className="text-muted-foreground text-sm">暂无协作者</p>
              ) : (
                collaborators.map((item) => (
                  <div
                    key={item.id}
                    className="border-border/60 bg-card flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{item.user.name ?? item.user.email}</p>
                      <p className="text-muted-foreground text-xs">{item.user.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        removeMutation.mutate({ noteId, userId: item.user.id })
                      }
                      disabled={removeMutation.isPending}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
