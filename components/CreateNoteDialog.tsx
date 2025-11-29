"use client";

import { useEffect, useMemo, useState } from "react";

import { TagInput } from "@/components/TagInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NOTE_TAGS } from "@/lib/tags";
import { trpc } from "@/lib/trpc/client";

const DEFAULT_MARKDOWN = "# 新笔记\n\n这里是初始内容。";

type CreateNoteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (noteId: string) => void;
  onUnauthorized?: () => void;
};

export function CreateNoteDialog({
  open,
  onOpenChange,
  onCreated,
  onUnauthorized,
}: CreateNoteDialogProps) {
  const utils = trpc.useUtils();
  const foldersQuery = trpc.folder.list.useQuery(undefined, { enabled: open });
  const createMutation = trpc.note.create.useMutation({
    onSuccess: (note) => {
      utils.note.list.invalidate();
      onCreated(note.id);
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        onUnauthorized?.();
        onOpenChange(false);
      }
    },
  });

  const [title, setTitle] = useState("全新笔记");
  const [tags, setTags] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [isCollaborative, setIsCollaborative] = useState(false);

  const suggestedTags = useMemo(() => NOTE_TAGS.map((tag) => tag.value), []);

  const resetForm = () => {
    setTitle("全新笔记");
    setTags([]);
    setFolderId(null);
    setIsCollaborative(false);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleCreate = () => {
    if (!title.trim() || createMutation.isPending) return;
    createMutation.mutate({
      title: title.trim(),
      markdown: DEFAULT_MARKDOWN,
      tags,
      folderId: folderId ?? undefined,
      isCollaborative,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建笔记</DialogTitle>
          <DialogDescription>
            填写基础信息后创建笔记并进入编辑页。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs">标题</p>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="输入标题"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs">标签</p>
            <TagInput
              value={tags}
              onChange={setTags}
              suggestions={suggestedTags}
              placeholder="输入或选择标签"
            />
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs">分组</p>
            <Select
              value={folderId ?? "none"}
              onValueChange={(value) =>
                setFolderId(value === "none" ? null : value)
              }
              disabled={foldersQuery.isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择分组" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不分组</SelectItem>
                {foldersQuery.data?.folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="create-collab"
              type="checkbox"
              checked={isCollaborative}
              onChange={(e) => setIsCollaborative(e.target.checked)}
            />
            <label
              htmlFor="create-collab"
              className="text-muted-foreground text-sm"
            >
              创建为协作笔记
            </label>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            取消
          </Button>
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? "创建中..." : "创建并前往编辑"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
