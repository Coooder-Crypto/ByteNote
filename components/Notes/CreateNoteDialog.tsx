"use client";

import { useCallback, useMemo, useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useFolderActions, useNoteActions } from "@/hooks";
import { localManager } from "@/lib/offline/LocalManager";
import { NOTE_TAGS } from "@/lib/tags";

import { TagInput } from "../TagInput";

type CreateNoteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (noteId: string) => void;
  onUnauthorized?: () => void;
  onCreatedLocal?: (noteId: string) => void;
};

export default function CreateNoteDialog({
  open,
  onOpenChange,
  onCreated,
  onUnauthorized,
  onCreatedLocal,
}: CreateNoteDialogProps) {
  const { folders, isLoading: foldersLoading } = useFolderActions(open);
  const { createNote, createPending } = useNoteActions({});

  const [title, setTitle] = useState("全新笔记");
  const [tags, setTags] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [isCollaborative, setIsCollaborative] = useState(false);

  const suggestedTags = useMemo(() => NOTE_TAGS.map((tag) => tag.value), []);

  const resetForm = useCallback(() => {
    setTitle("全新笔记");
    setTags([]);
    setFolderId(null);
    setIsCollaborative(false);
  }, []);

  const createLocal = useCallback(
    async (payload: {
      title: string;
      contentJson: any;
      tags: string[];
      folderId?: string;
      isCollaborative: boolean;
    }) => {
      const localId = await localManager.createLocal({
        title: payload.title,
        contentJson: payload.contentJson,
        tags: payload.tags,
        folderId: payload.folderId ?? null,
        isCollaborative: payload.isCollaborative,
      });
      if (onCreatedLocal) {
        onCreatedLocal(localId);
      } else {
        onCreated(localId);
      }
      resetForm();
      onOpenChange(false);
    },
    [onCreated, onCreatedLocal, onOpenChange, resetForm],
  );

  const handleCreate = () => {
    if (!title.trim() || createPending) return;
    const payload = {
      title: title.trim(),
      contentJson: { type: "doc", content: [] },
      tags,
      folderId: folderId ?? undefined,
      isCollaborative,
    };
    const isOnline = typeof navigator === "undefined" || navigator.onLine;
    if (!isOnline) {
      void createLocal(payload);
      return;
    }
    createNote(payload as any, {
      onSuccess: (note) => {
        onCreated(note.id);
        resetForm();
        onOpenChange(false);
      },
      onError: (error) => {
        if (error?.data?.code === "UNAUTHORIZED") {
          onUnauthorized?.();
          onOpenChange(false);
          return;
        }
        // 网络异常等错误时，回退为本地创建
        createLocal(payload);
      },
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
              disabled={foldersLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择分组" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不分组</SelectItem>
                {folders.map((folder) => (
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
            disabled={createPending}
          >
            取消
          </Button>
          <Button onClick={handleCreate} disabled={createPending}>
            {createPending ? "创建中..." : "创建并前往编辑"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
