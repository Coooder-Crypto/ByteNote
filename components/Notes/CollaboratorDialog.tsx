"use client";

import { useMemo, useState } from "react";
import { Loader2, UserPlus, X } from "lucide-react";

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

type CollaboratorDialogProps = {
  noteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CollaboratorDialog({ noteId, open, onOpenChange }: CollaboratorDialogProps) {
  const utils = trpc.useUtils();
  const listQuery = trpc.collaborator.list.useQuery({ noteId }, { enabled: open });
  const searchQuery = trpc.user.search.useQuery(
    { keyword: "" },
    { enabled: false },
  );
  const addMutation = trpc.collaborator.add.useMutation({
    onSuccess: () => {
      utils.collaborator.list.invalidate({ noteId });
      setEmail("");
      setSearchResults([]);
    },
  });
  const removeMutation = trpc.collaborator.remove.useMutation({
    onSuccess: () => utils.collaborator.list.invalidate({ noteId }),
  });

  const [email, setEmail] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string | null; email: string | null; avatarUrl: string | null }[]
  >([]);
  const [searching, setSearching] = useState(false);

  const collaborators = useMemo(
    () => listQuery.data ?? [],
    [listQuery.data],
  );

  const handleSearch = async () => {
    if (!email.trim()) return;
    setSearching(true);
    try {
      const data = await searchQuery.refetch({ throwOnError: false, cancelRefetch: false });
      const results =
        data.data?.filter(
          (u) =>
            u.email?.toLowerCase().includes(email.toLowerCase()) ||
            (u.name ?? "").toLowerCase().includes(email.toLowerCase()),
        ) ?? [];
      setSearchResults(results.slice(0, 5));
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = (userId: string) => {
    addMutation.mutate({ noteId, userId, role: "editor" });
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
              placeholder="输入协作者邮箱或姓名"
            />
            <Button onClick={handleSearch} disabled={searching} className="gap-2">
              {searching ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              查找
            </Button>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-2 rounded-lg border border-border/60 bg-card/60 p-3">
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{user.name ?? user.email}</p>
                    <p className="text-muted-foreground text-xs">{user.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={addMutation.isPending}
                    onClick={() => handleInvite(user.id)}
                  >
                    邀请
                  </Button>
                </div>
              ))}
            </div>
          )}
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
