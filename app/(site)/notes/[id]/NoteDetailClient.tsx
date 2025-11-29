"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { NoteTags } from "@/components/NoteTags";
import { CollaborativeEditor } from "@/components/Notes/CollaborativeEditor";
import { TagInput } from "@/components/TagInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";

type EditorState = {
  title: string;
  markdown: string;
  isFavorite: boolean;
  folderId: string | null;
  tags: string[];
  version: number;
};

const emptyState: EditorState = {
  title: "",
  markdown: "",
  isFavorite: false,
  folderId: null,
  tags: [],
  version: 1,
};

export default function NoteDetailClient({ noteId }: { noteId: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const noteQuery = trpc.note.detail.useQuery(
    { id: noteId },
    { enabled: Boolean(noteId) },
  );
  const meQuery = trpc.auth.me.useQuery();
  const foldersQuery = trpc.folder.list.useQuery(undefined, {
    enabled: Boolean(meQuery.data),
  });

  const [state, setState] = useState<EditorState>(emptyState);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!noteQuery.data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({
      title: noteQuery.data.title,
      markdown: noteQuery.data.markdown,
      isFavorite: noteQuery.data.isFavorite,
      folderId: noteQuery.data.folderId,
      version: noteQuery.data.version,
      tags: (() => {
        try {
          const parsed = JSON.parse(noteQuery.data.tags);
          return Array.isArray(parsed)
            ? parsed.filter(
                (tag): tag is string =>
                  typeof tag === "string" && tag.trim().length > 0,
              )
            : [];
        } catch {
          return [];
        }
      })(),
    });
    setIsDirty(false);
  }, [noteQuery.data]);

  const isOwner = useMemo(
    () => Boolean(noteQuery.data && meQuery.data?.id === noteQuery.data.userId),
    [noteQuery.data, meQuery.data?.id],
  );

  const updateMutation = trpc.note.update.useMutation({
    onSuccess: () => {
      setIsDirty(false);
      utils.note.detail.invalidate({ id: noteId });
      utils.note.list.invalidate();
    },
  });

  const deleteMutation = trpc.note.remove.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate();
      router.push("/");
    },
  });

  const restoreMutation = trpc.note.restore.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate();
      utils.note.detail.invalidate({ id: noteId });
    },
  });

  const destroyMutation = trpc.note.destroy.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate();
      router.push("/");
    },
  });

  const favoriteMutation = trpc.note.setFavorite.useMutation({
    onSuccess: (_, variables) => {
      setState((prev) => ({ ...prev, isFavorite: variables.isFavorite }));
      utils.note.detail.invalidate({ id: noteId });
      utils.note.list.invalidate();
    },
  });

  const setFolderMutation = trpc.note.setFolder.useMutation({
    onSuccess: (_, variables) => {
      setState((prev) => ({ ...prev, folderId: variables.folderId ?? null }));
      utils.note.detail.invalidate({ id: noteId });
      utils.note.list.invalidate();
    },
  });

  const isSaving = updateMutation.isPending;
  const isTrashed = Boolean(noteQuery.data?.deletedAt);

  const handleSave = useCallback(() => {
    if (!isOwner || !isDirty || isSaving || isTrashed) return;
    updateMutation.mutate({
      id: noteId,
      title: state.title || "未命名笔记",
      markdown: state.markdown,
      folderId: state.folderId,
      tags: state.tags,
      version: state.version,
    });
  }, [
    isDirty,
    isOwner,
    isSaving,
    isTrashed,
    noteId,
    state.version,
    state.folderId,
    state.markdown,
    state.tags,
    state.title,
    updateMutation,
  ]);

  // Auto save every 10s if dirty
  useEffect(() => {
    if (!isOwner || !isDirty || isSaving || isTrashed) return;
    const timer = window.setTimeout(() => {
      handleSave();
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [handleSave, isDirty, isOwner, isSaving, isTrashed]);

  // Cmd/Ctrl + S shortcut
  useEffect(() => {
    if (!isOwner || isTrashed) return;
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [handleSave, isOwner, isTrashed]);

  if (noteQuery.isLoading) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">加载中...</p>
      </section>
    );
  }

  if (!noteQuery.data) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">未找到笔记</p>
      </section>
    );
  }

  const currentUser = meQuery.data
    ? {
        id: meQuery.data.id,
        name: meQuery.data.name ?? meQuery.data.email,
        avatar: meQuery.data.avatarUrl ?? undefined,
      }
    : null;

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            {state.title || "笔记详情"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isTrashed
              ? "笔记已在回收站中"
              : isOwner
                ? "你可以编辑这篇笔记"
                : "此笔记为只读"}
          </p>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            {!isTrashed ? (
              <>
                <Button
                  variant={state.isFavorite ? "secondary" : "outline"}
                  onClick={() =>
                    favoriteMutation.mutate({
                      id: noteId,
                      isFavorite: !state.isFavorite,
                    })
                  }
                  disabled={favoriteMutation.isPending}
                >
                  {favoriteMutation.isPending
                    ? "更新中..."
                    : state.isFavorite
                      ? "取消收藏"
                      : "收藏"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "保存中..." : "保存"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate({ id: noteId })}
                  disabled={deleteMutation.isPending}
                >
                  移至回收站
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => restoreMutation.mutate({ id: noteId })}
                  disabled={restoreMutation.isPending}
                >
                  {restoreMutation.isPending ? "恢复中..." : "恢复笔记"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => destroyMutation.mutate({ id: noteId })}
                  disabled={destroyMutation.isPending}
                >
                  {destroyMutation.isPending ? "删除中..." : "彻底删除"}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {isTrashed && (
        <p className="border-border/60 bg-amber-50 text-amber-700 rounded-lg border px-4 py-3 text-sm">
          该笔记已在回收站，恢复后才能编辑。
        </p>
      )}

      {isOwner ? (
        <div className="space-y-4">
          <Input
            value={state.title}
            onChange={(event) => {
              setIsDirty(true);
              setState((prev) => ({ ...prev, title: event.target.value }));
            }}
            placeholder="输入标题"
          />
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1 space-y-2 lg:max-w-2xl">
              <p className="text-muted-foreground text-xs">
                标签（可输入或选择）
              </p>
              <TagInput
                value={state.tags}
                onChange={(tags) => {
                  setIsDirty(true);
                  setState((prev) => ({
                    ...prev,
                    tags,
                  }));
                }}
                placeholder="输入标签或从列表选择"
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground text-xs">分组</p>
              <Select
                value={state.folderId ?? "none"}
                onValueChange={(value) => {
                  const nextFolderId = value === "none" ? null : value;
                  setIsDirty(true);
                  setState((prev) => ({ ...prev, folderId: nextFolderId }));
                  setFolderMutation.mutate({
                    id: noteId,
                    folderId: nextFolderId,
                  });
                }}
                disabled={
                  foldersQuery.isLoading ||
                  setFolderMutation.isPending ||
                  isTrashed
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="选择分组" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未分组</SelectItem>
                  {foldersQuery.data?.folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <CollaborativeEditor
            noteId={noteId}
            initialContent={state.markdown}
            user={currentUser}
            version={state.version}
            onDirtyChange={(dirty) => setIsDirty(dirty)}
            onRemoteUpdate={() => {
              utils.note.detail.invalidate({ id: noteId });
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <NoteTags tags={state.tags} />
          <div className="border-border/60 bg-card h-[70vh] overflow-auto rounded-xl border p-4 shadow-sm">
            <p className="text-muted-foreground text-sm">仅作者可编辑</p>
            <div className="mt-3 whitespace-pre-wrap text-sm">{state.markdown}</div>
          </div>
        </div>
      )}
    </section>
  );
}
