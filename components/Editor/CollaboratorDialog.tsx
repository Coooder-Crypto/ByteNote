"use client";

import { Loader2, UserPlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@/components/ui";
import { useCollaboratorActions } from "@/hooks";
import { trpc } from "@/lib/trpc/client";
import { copyToClipboard } from "@/lib/utils";
import type { BnUser } from "@/types/entities";

type CollaboratorDialogProps = {
  noteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CollaboratorDialog({
  noteId,
  open,
  onOpenChange,
}: CollaboratorDialogProps) {
  const listQuery = trpc.collaborator.list.useQuery(
    { noteId },
    { enabled: open },
  );
  const {
    addCollaborator,
    searchUsers,
    removeCollaborator,
    addPending,
    removePending,
  } = useCollaboratorActions(noteId);

  const [email, setEmail] = useState("");
  const [searchResults, setSearchResults] = useState<BnUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [wsUrl, setWsUrl] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("byte-note-ws-url") ?? "";
  });

  const collaborators = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  const handleSearch = async () => {
    if (!email.trim()) return;
    setSearching(true);
    try {
      const results = await searchUsers(email.trim());
      setSearchResults(results.slice(0, 5));
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = (userId: string) => {
    addCollaborator(userId, "editor");
    setEmail("");
    setSearchResults([]);
  };

  const handleGenerateLink = () => {
    if (!wsUrl.trim()) {
      toast.error("请先填写协同服务器的 WS 地址");
      return;
    }
    try {
      const encodedWs = encodeURIComponent(wsUrl.trim());
      const link = `${window.location.origin}/notes/${noteId}?ws=${encodedWs}`;
      copyToClipboard(link);
      localStorage.setItem("byte-note-ws-url", wsUrl.trim());
      toast.success("协作链接已复制");
    } catch (error) {
      console.error(error);
      toast.error("生成协作链接失败");
    }
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
            <Button
              onClick={handleSearch}
              disabled={searching}
              className="gap-2"
            >
              {searching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
              查找
            </Button>
          </div>
          {searchResults.length > 0 && (
            <div className="border-border/60 bg-card/60 space-y-2 rounded-lg border p-3">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-medium">{user.name ?? user.email}</p>
                    <p className="text-muted-foreground text-xs">
                      {user.email}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={addPending}
                    onClick={() => handleInvite(user.id)}
                  >
                    邀请
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2 rounded-lg border border-dashed p-3">
            <p className="text-sm font-medium">协作分享</p>
            <p className="text-muted-foreground text-xs">
              填写自部署的协同 WS
              地址，生成包含该地址的分享链接。协作者需登录且在列表中才能协同编辑。
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="例如 ws://localhost:1234"
              />
              <Button variant="outline" onClick={handleGenerateLink}>
                生成并复制链接
              </Button>
            </div>
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
                      <p className="font-medium">
                        {item.user.name ?? item.user.email}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {item.user.email}
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        {item.role === "owner"
                          ? "所有者"
                          : item.role === "editor"
                            ? "可编辑"
                            : "只读"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeCollaborator(item.user.id)}
                      disabled={removePending || item.role === "owner"}
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
