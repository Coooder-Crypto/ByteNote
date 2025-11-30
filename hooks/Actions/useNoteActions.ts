"use client";

import { useRouter } from "next/navigation";

import { trpc } from "@/lib/trpc/client";

type Params<T> = {
  noteId: string;
  onStateChange: (updater: (prev: T) => T) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

export default function useNoteActions<T>({
  noteId,
  onStateChange,
  onDirtyChange,
}: Params<T>) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const updateMutation = trpc.note.update.useMutation({
    onSuccess: () => {
      onDirtyChange?.(false);
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
      onStateChange((prev) => ({ ...prev, isFavorite: variables.isFavorite }));
      utils.note.detail.invalidate({ id: noteId });
      utils.note.list.invalidate();
    },
  });

  const setFolderMutation = trpc.note.setFolder.useMutation({
    onSuccess: (_, variables) => {
      onStateChange((prev) => ({
        ...prev,
        folderId: variables.folderId ?? null,
      }));
      utils.note.detail.invalidate({ id: noteId });
      utils.note.list.invalidate();
    },
  });

  const updateNote = (payload: Parameters<typeof updateMutation.mutate>[0]) =>
    updateMutation.mutate(payload);

  const deleteNote = () => deleteMutation.mutate({ id: noteId });
  const restoreNote = () => restoreMutation.mutate({ id: noteId });
  const destroyNote = () => destroyMutation.mutate({ id: noteId });
  const toggleFavorite = (isFavorite: boolean) =>
    favoriteMutation.mutate({ id: noteId, isFavorite });
  const changeFolder = (folderId: string | null) =>
    setFolderMutation.mutate({ id: noteId, folderId });

  return {
    updateNote,
    deleteNote,
    restoreNote,
    destroyNote,
    toggleFavorite,
    changeFolder,
    updatePending: updateMutation.isPending,
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
