"use client";

import { useCallback, useEffect } from "react";

import { CollaboratorDialog } from "@/components/Editor";
import NoteHeader from "@/components/Editor/EditorHeader";
import EditorSection from "@/components/Editor/EditorSection";
import NoteMetaForm from "@/components/Editor/InfoEditor";
import { useNoteStore } from "@/hooks";
import useFolderActions from "@/hooks/Actions/useFolderActions";
import useNoteActions from "@/hooks/Actions/useNoteActions";
import { createPusherClient } from "@/lib/pusher/client";
import { trpc } from "@/lib/trpc/client";

export default function EditorPage({ params }: { params: { id: string } }) {
  const noteId = params.id;
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
    setFromNote,
    setTitle,
    setTags,
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
    setFolders(folders);
  }, [folders, setFolders]);

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

  const handleSave = useCallback(() => {
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
  }, [
    isDirty,
    canEdit,
    isSaving,
    isTrashed,
    noteId,
    state.title,
    state.markdown,
    state.folderId,
    state.tags,
    state.version,
    state.isCollaborative,
    updateNote,
  ]);

  // Auto save
  useEffect(() => {
    if (!canEdit || !isDirty || isSaving || isTrashed) return;
    const timer = window.setTimeout(() => handleSave(), 10000);
    return () => window.clearTimeout(timer);
  }, [canEdit, handleSave, isDirty, isSaving, isTrashed]);

  // Cmd/Ctrl+S
  useEffect(() => {
    if (!canEdit || isTrashed) return;
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [canEdit, handleSave, isTrashed]);

  // Listen to server-saved updates (fallback when Yjs not in sync)
  useEffect(() => {
    if (!noteQuery.data?.isCollaborative) return;
    const pusher = createPusherClient();
    if (!pusher) return;
    const channel = pusher.subscribe(`presence-note-${noteId}`);
    const handler = (payload: {
      noteId: string;
      markdown?: string;
      title?: string;
      version?: number;
    }) => {
      if (payload?.noteId !== noteId) return;
      updateState((prev) => ({
        ...prev,
        markdown: payload.markdown ?? prev.markdown,
        title: payload.title ?? prev.title,
        version:
          typeof payload.version === "number" ? payload.version : prev.version,
      }));
      setDirty(false);
    };
    channel.bind("server-note-saved", handler);
    return () => {
      channel.unbind("server-note-saved", handler);
      pusher.unsubscribe(`presence-note-${noteId}`);
      pusher.disconnect();
    };
  }, [noteId, noteQuery.data?.isCollaborative, updateState]);

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
      <NoteHeader
        state={state}
        canEdit={canEdit}
        isOwner={isOwner}
        isTrashed={isTrashed}
        isSaving={isSaving}
        favoritePending={favoritePending}
        deletePending={deletePending}
        restorePending={restorePending}
        destroyPending={destroyPending}
        onFavorite={() => toggleFavorite(!state.isFavorite)}
        onSave={handleSave}
        onDelete={() => deleteNote()}
        onRestore={() => restoreNote()}
        onDestroy={() => destroyNote()}
        onOpenCollab={() => setCollabOpen(true)}
      />

      {isTrashed && (
        <p className="border-border/60 rounded-lg border bg-amber-50 px-4 py-3 text-sm text-amber-700">
          该笔记已在回收站，恢复后才能编辑。
        </p>
      )}
      <NoteMetaForm
        state={state}
        isOwner={isOwner}
        canEdit={canEdit}
        isTrashed={isTrashed}
        folders={folders}
        folderPending={folderPending}
        onTitleChange={setTitle}
        onTagsChange={setTags}
        onFolderChange={(folderId) => {
          setFolder(folderId);
          if (isOwner) {
            changeFolder(folderId);
          }
        }}
        onCollaborativeToggle={setCollaborative}
      />

      <EditorSection
        noteId={noteId}
        state={state}
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
