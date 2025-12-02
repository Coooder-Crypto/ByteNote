"use client";

import type { inferRouterOutputs } from "@trpc/server";
import { useRouter } from "next/navigation";

import { trpc } from "@/lib/trpc/client";
import type { AppRouter } from "@/server/api/root";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type NoteUpdateResult = RouterOutputs["note"]["update"];

type Params<T extends { title?: string; markdown?: string; version?: number }> = {
  noteId?: string;
  onStateChange?: (updater: (prev: T) => T) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

export default function useNoteActions<
  T extends { title?: string; markdown?: string; version?: number },
>({
  noteId,
  onStateChange,
  onDirtyChange,
}: Params<T>) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const updateMutation = trpc.note.update.useMutation({
    onSuccess: (data: NoteUpdateResult | null) => {
      onDirtyChange?.(false);
      if (data && onStateChange) {
        onStateChange((prev) => ({
          ...prev,
          title: data.title ?? prev.title,
          markdown: data.markdown ?? prev.markdown,
          version:
            typeof data.version === "number" ? data.version : prev.version,
        }));
      }
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
      onStateChange?.((prev) => ({
        ...prev,
        isFavorite: variables.isFavorite,
      }));
      utils.note.detail.invalidate({ id: noteId });
      utils.note.list.invalidate();
    },
  });

  const setFolderMutation = trpc.note.setFolder.useMutation({
    onSuccess: (_, variables) => {
      onStateChange?.((prev) => ({
        ...prev,
        folderId: variables.folderId ?? null,
      }));
      utils.note.detail.invalidate({ id: noteId });
      utils.note.list.invalidate();
    },
  });

  const createMutation = trpc.note.create.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate();
    },
  });

  const createNote = (
    payload: Parameters<typeof createMutation.mutate>[0],
    options?: Parameters<typeof createMutation.mutate>[1],
  ) => createMutation.mutate(payload, options);

  const updateNote = (payload: Parameters<typeof updateMutation.mutate>[0]) =>
    updateMutation.mutate(payload);
  const updateNoteAsync = (
    payload: Parameters<typeof updateMutation.mutate>[0],
  ) => updateMutation.mutateAsync(payload);

  const deleteNote = () => noteId && deleteMutation.mutate({ id: noteId });
  const restoreNote = () => noteId && restoreMutation.mutate({ id: noteId });
  const destroyNote = () => noteId && destroyMutation.mutate({ id: noteId });
  const toggleFavorite = (isFavorite: boolean) =>
    noteId && favoriteMutation.mutate({ id: noteId, isFavorite });
  const changeFolder = (folderId: string | null) =>
    noteId && setFolderMutation.mutate({ id: noteId, folderId });

  return {
    createNote,
    updateNote,
    deleteNote,
    restoreNote,
    destroyNote,
    toggleFavorite,
    changeFolder,
    createPending: createMutation.isPending,
    createError: createMutation.error,
    updatePending: updateMutation.isPending,
    updateNoteAsync,
    updateError: updateMutation.error,
    deletePending: deleteMutation.isPending,
    deleteError: deleteMutation.error,
    restorePending: restoreMutation.isPending,
    restoreError: restoreMutation.error,
    destroyPending: destroyMutation.isPending,
    destroyError: destroyMutation.error,
    favoritePending: favoriteMutation.isPending,
    favoriteError: favoriteMutation.error,
    setFolderPending: setFolderMutation.isPending,
    setFolderError: setFolderMutation.error,
  };
}
