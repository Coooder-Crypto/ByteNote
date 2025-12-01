"use client";

import { useEffect } from "react";

import { createPusherClient } from "@/lib/pusher/client";

import useNoteActions from "../Actions/useNoteActions";
import useNoteStore from "../Store/useNoteStore";

type UseNoteSyncOptions = {
  noteId: string;
  canEdit: boolean;
  isTrashed: boolean;
};

export default function useNoteSync({
  noteId,
  canEdit,
  isTrashed,
}: UseNoteSyncOptions) {
  const { state, isDirty, setDirty, updateState } = useNoteStore();

  const { updateNote, updatePending } = useNoteActions({
    noteId,
    onStateChange: updateState,
    onDirtyChange: setDirty,
  });

  // Auto save
  useEffect(() => {
    if (!canEdit || !isDirty || updatePending || isTrashed) return;
    const timer = window.setTimeout(() => {
      updateNote({
        id: noteId,
        title: state.title || "未命名笔记",
        markdown: state.markdown,
        folderId: state.folderId,
        tags: state.tags,
        version: state.version,
        isCollaborative: state.isCollaborative,
      });
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [
    canEdit,
    isDirty,
    updatePending,
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

  // Cmd/Ctrl+S
  useEffect(() => {
    if (!canEdit || isTrashed) return;
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        updateNote({
          id: noteId,
          title: state.title || "未命名笔记",
          markdown: state.markdown,
          folderId: state.folderId,
          tags: state.tags,
          version: state.version,
          isCollaborative: state.isCollaborative,
        });
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [
    canEdit,
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

  // Listen to server-saved updates (fallback when Yjs not in sync)
  useEffect(() => {
    if (!state.isCollaborative) return;
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
  }, [noteId, setDirty, state.isCollaborative, updateState]);

  return {
    isSaving: updatePending,
  };
}
