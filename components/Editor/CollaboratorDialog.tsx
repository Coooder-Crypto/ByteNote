"use client";

import { Loader2, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import type { BnUser } from "@/types";

type CollaboratorDialogProps = {
  noteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCollaborative?: boolean;
  onToggleCollaborative?: (next: boolean) => void;
  wsUrl?: string;
  wsUpdating?: boolean;
  onUpdateWs?: (ws: string) => void;
};

export default function CollaboratorDialog({
  noteId,
  open,
  onOpenChange,
  isCollaborative = false,
  onToggleCollaborative,
  wsUrl = "",
  wsUpdating = false,
  onUpdateWs,
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
  const requestId = useRef(0);
  const [wsInput, setWsInput] = useState<string>(wsUrl);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setWsInput(wsUrl ?? "");
  }, [wsUrl, open]);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setSearchResults([]);
      setSearching(false);
      return;
    }
  }, [open]);

  const collaborators = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    const current = ++requestId.current;
    setSearching(true);
    try {
      const results = await searchUsers(term.trim());
      if (current === requestId.current) {
        setSearchResults(results.slice(0, 5));
      }
    } finally {
      if (current === requestId.current) setSearching(false);
    }
  };

  const debouncedSearch = (term: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!term.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    debounceTimer.current = setTimeout(() => {
      void handleSearch(term);
    }, 300);
  };

  const handleInvite = (userId: string) => {
    addCollaborator(userId, "editor");
    setEmail("");
    setSearchResults([]);
  };

  const handleSaveWs = () => {
    const trimmed = wsInput.trim();
    if (!trimmed) {
      toast.error("请先填写协同服务器的 WS 地址");
      return;
    }
    if (!trimmed.startsWith("ws://") && !trimmed.startsWith("wss://")) {
      toast.error("WS 地址格式不正确");
      return;
    }
    onUpdateWs?.(trimmed);
    toast.success("协作服务器已保存");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>协作者管理</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3 rounded-lg border border-dashed p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">开启协作模式</p>
              </div>
              <input
                type="checkbox"
                className="accent-primary h-5 w-9 cursor-pointer"
                checked={isCollaborative}
                onChange={(e) => onToggleCollaborative?.(e.target.checked)}
                aria-label="开启协作模式"
              />
            </div>

            {isCollaborative && (
              <>
                <div className="mt-4 flex items-center gap-2">
                  <Input
                    value={email}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEmail(val);
                      debouncedSearch(val);
                    }}
                    placeholder="输入协作者邮箱或姓名"
                    aria-label="协作者邮箱或姓名"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleSearch(email);
                      }
                    }}
                  />
                  <Button
                    onClick={() => void handleSearch(email)}
                    disabled={searching || !email.trim()}
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
                <div
                  className="border-border/60 bg-card/60 space-y-2 rounded-lg border p-3"
                  style={{ minHeight: "156px" }}
                >
                  {!searching &&
                    searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {user.name ?? user.email}
                          </p>
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
                          添加
                        </Button>
                      </div>
                    ))}
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs">已有协作者</p>
                  <div className="space-y-2">
                    {collaborators.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        暂无协作者
                      </p>
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
                          {item.role !== "owner" && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removeCollaborator(item.user.id)}
                              disabled={removePending}
                            >
                              <X className="size-4" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-dashed p-3">
                  <p className="text-sm font-medium">协作服务器</p>
                  <p className="text-muted-foreground text-xs">
                    填写协同 WS 地址。 查看 Docker 自建指南：
                    <a
                      href="https://github.com/Coooder-Crypto/ByteNote/tree/main/service"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      service/README
                    </a>
                    。
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={wsInput}
                      onChange={(e) => setWsInput(e.target.value)}
                      placeholder="例如 ws://localhost:1234"
                      disabled={wsUpdating}
                      aria-label="协作服务地址"
                    />
                    <Button
                      variant="outline"
                      onClick={handleSaveWs}
                      disabled={wsUpdating}
                    >
                      保存
                    </Button>
                  </div>
                </div>
              </>
            )}
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
