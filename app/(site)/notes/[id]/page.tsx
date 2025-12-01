"use client";

import { use, useEffect, useMemo } from "react";

import { CollaboratorDialog, EditorSection } from "@/components/Editor";
import { NoteTags } from "@/components/NoteTags";
import { TagInput } from "@/components/TagInput";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useFolderActions, useNoteActions, useNoteStore } from "@/hooks";
import useNoteSync from "@/hooks/Common/useNoteSync";
import { trpc } from "@/lib/trpc/client";

export default function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: noteId } = use(params);
  const noteQuery = trpc.note.detail.useQuery(
    { id: noteId },
    { enabled: Boolean(noteId) },
  );
  const meQuery = trpc.auth.me.useQuery();
  const { folders, isLoading: foldersLoading } = useFolderActions(
    Boolean(meQuery.data),
  );

  const {
    state,
    isDirty,
    collabOpen,
    isOwner,
    canEdit,
    isTrashed,
    setTags,
    folders: storeFolders,
    setFromNote,
    setFolder,
    setCollaborative,
    setContent,
    setDirty,
    setCollabOpen,
    setFolders,
    updateState,
  } = useNoteStore();

  // Load note into local state
  useEffect(() => {
    if (!noteQuery.data) return;
    setFromNote(noteQuery.data, meQuery.data?.id);
  }, [meQuery.data?.id, noteQuery.data, setFromNote]);

  useEffect(() => {
    if (folders.length === 0) return;
    const same =
      storeFolders &&
      storeFolders.length === folders.length &&
      storeFolders.every((f, idx) => {
        const next = folders[idx];
        return (
          f.id === next.id &&
          f.name === next.name &&
          f.noteCount === next.noteCount
        );
      });
    if (same) return;
    setFolders(folders);
  }, [folders, setFolders, storeFolders]);

  const {
    updateNote,
    deleteNote,
    restoreNote,
    destroyNote,
    toggleFavorite,
    changeFolder,
    updatePending,
    deletePending,
    restorePending,
    destroyPending,
    favoritePending,
    setFolderPending,
  } = useNoteActions({
    noteId,
    onStateChange: updateState,
    onDirtyChange: setDirty,
  });

  const isSaving = updatePending;
  const folderPending = setFolderPending || foldersLoading;

  const handleSave = useMemo(
    () => () => {
      if (!canEdit || !isDirty || isSaving || isTrashed) return;
      updateNote({
        id: noteId,
        title: state.title || "未命名笔记",
        markdown: state.markdown,
        folderId: state.folderId,
        tags: state.tags,
        version: state.version,
        isCollaborative: state.isCollaborative,
      });
    },
    [
      canEdit,
      isDirty,
      isSaving,
      isTrashed,
      noteId,
      state.folderId,
      state.isCollaborative,
      state.markdown,
      state.tags,
      state.title,
      state.version,
      updateNote,
    ],
  );

  useNoteSync({ noteId, canEdit, isTrashed });

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
              : canEdit
                ? "你可以编辑这篇笔记"
                : "此笔记为只读"}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            {!isTrashed ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "保存中..." : "保存"}
                </Button>
                {isOwner && (
                  <>
                    <Button
                      variant={state.isFavorite ? "secondary" : "outline"}
                      onClick={() => toggleFavorite(!state.isFavorite)}
                      disabled={favoritePending}
                    >
                      {favoritePending
                        ? "更新中..."
                        : state.isFavorite
                          ? "取消收藏"
                          : "收藏"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteNote()}
                      disabled={deletePending}
                    >
                      移至回收站
                    </Button>
                    <Button variant="ghost" onClick={() => setCollabOpen(true)}>
                      协作者
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                {isOwner && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => restoreNote()}
                      disabled={restorePending}
                    >
                      {restorePending ? "恢复中..." : "恢复笔记"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => destroyNote()}
                      disabled={destroyPending}
                    >
                      {destroyPending ? "删除中..." : "彻底删除"}
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {isTrashed && (
        <p className="border-border/60 rounded-lg border bg-amber-50 px-4 py-3 text-sm text-amber-700">
          该笔记已在回收站，恢复后才能编辑。
        </p>
      )}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex-1 space-y-2 lg:max-w-2xl">
          {isOwner && canEdit ? (
            <TagInput
              value={state.tags}
              onChange={setTags}
              placeholder="输入标签或从列表选择"
              className="w-full"
            />
          ) : (
            <NoteTags tags={state.tags} />
          )}
        </div>
        {isOwner && (
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs">分组</p>
            <Select
              value={state.folderId ?? "none"}
              onValueChange={(value) => {
                const nextFolderId = value === "none" ? null : value;
                setFolder(nextFolderId);
                if (isOwner) {
                  changeFolder(nextFolderId);
                }
              }}
              disabled={folderPending || isTrashed || !canEdit}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="选择分组" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">未分组</SelectItem>
                {folders?.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <input
                id="collab"
                type="checkbox"
                checked={state.isCollaborative}
                onChange={(event) => setCollaborative(event.target.checked)}
                disabled={isTrashed || !isOwner}
              />
              <label htmlFor="collab" className="text-muted-foreground text-sm">
                协作笔记
              </label>
            </div>
          </div>
        )}
      </div>

      <EditorSection
        noteId={noteId}
        canEdit={canEdit}
        onContentChange={setContent}
        onDirtyChange={setDirty}
      />

      <CollaboratorDialog
        noteId={noteId}
        open={collabOpen}
        onOpenChange={setCollabOpen}
      />
    </section>
  );
}
