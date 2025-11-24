"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { trpc } from "@/lib/trpc/client";

import type { DraftState } from "./useNoteDraft";

type UseNoteSyncOptions = {
  noteId: string;
  state: DraftState;
  isDirty: boolean;
  isOwner: boolean;
  isOnline: boolean;
  onSynced: () => void;
  onDeleted?: () => void;
};

export function useNoteSync({
  noteId,
  state,
  isDirty,
  isOwner,
  isOnline,
  onSynced,
  onDeleted,
}: UseNoteSyncOptions) {
  const utils = trpc.useUtils();
  const router = useRouter();

  const updateMutation = trpc.note.update.useMutation({
    onSuccess: () => {
      onSynced();
      utils.note.detail.invalidate({ id: noteId });
      utils.note.list.invalidate();
    },
  });

  const deleteMutation = trpc.note.remove.useMutation({
    onSuccess: () => {
      onDeleted?.();
      utils.note.list.invalidate();
      router.push("/notes");
    },
  });

  const save = useCallback(() => {
    if (!isOwner || !isDirty || updateMutation.isPending || !isOnline) return;
    updateMutation.mutate({
      id: noteId,
      title: state.title || "未命名笔记",
      markdown: state.markdown,
      isPublic: state.isPublic,
      tags: state.tags,
    });
  }, [
    isDirty,
    isOnline,
    isOwner,
    noteId,
    state.isPublic,
    state.markdown,
    state.tags,
    state.title,
    updateMutation,
  ]);

  useEffect(() => {
    if (!isOwner) return;
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [isOwner, save]);

  useEffect(() => {
    if (!isOwner || !isDirty || updateMutation.isPending || !isOnline) return;
    const timer = window.setTimeout(() => {
      save();
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [isDirty, isOnline, isOwner, save, updateMutation.isPending]);

  useEffect(() => {
    if (!isOwner || !isDirty || !isOnline) return;
    save();
  }, [isDirty, isOnline, isOwner, save]);

  return {
    save,
    deleteMutation,
    isSaving: updateMutation.isPending,
  };
}
