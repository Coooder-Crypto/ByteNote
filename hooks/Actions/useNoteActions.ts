"use client";

import type { inferRouterOutputs } from "@trpc/server";
import { useRouter } from "next/navigation";

import { trpc } from "@/lib/trpc/client";
import type { AppRouter } from "@/server/api/root";
import { isLocalId } from "@/lib/offline/ids";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type NoteUpdateResult = RouterOutputs["note"]["update"];
type NoteCreateResult = RouterOutputs["note"]["create"];

type Params<T extends { title?: string; markdown?: string; version?: number }> = {
  noteId?: string;
  onStateChange?: (updater: (prev: T) => T) => void;
  onDirtyChange?: (dirty: boolean) => void;
  withQueries?: boolean;
};

export default function useNoteActions<
  T extends { title?: string; markdown?: string; version?: number },
>({
  noteId,
  onStateChange,
  onDirtyChange,
  withQueries = false,
}: Params<T>) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const meQuery = withQueries ? trpc.auth.me.useQuery() : undefined;
  const noteQuery =
    withQueries && noteId
      ? trpc.note.detail.useQuery(
          { id: noteId },
          { enabled: Boolean(noteId) && !isLocalId(noteId) },
        )
      : undefined;

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

  const setNoteDetailCache = (
    id: string,
    updater: Parameters<(typeof utils)["note"]["detail"]["setData"]>[1],
  ) => utils.note.detail.setData({ id }, updater);

  const updateNote = (payload: Parameters<typeof updateMutation.mutate>[0]) =>
    updateMutation.mutate(payload);
  const updateNoteAsync = (
    payload: Parameters<typeof updateMutation.mutate>[0],
  ) => updateMutation.mutateAsync(payload);
  const createNoteAsync = (
    payload: Parameters<typeof createMutation.mutate>[0],
  ) => createMutation.mutateAsync(payload) as Promise<NoteCreateResult>;

  const deleteNote = () => noteId && deleteMutation.mutate({ id: noteId });
  const restoreNote = () => noteId && restoreMutation.mutate({ id: noteId });
  const destroyNote = () => noteId && destroyMutation.mutate({ id: noteId });
  const toggleFavorite = (isFavorite: boolean) =>
    noteId && favoriteMutation.mutate({ id: noteId, isFavorite });
  const changeFolder = (folderId: string | null) =>
    noteId && setFolderMutation.mutate({ id: noteId, folderId });

  return {
    meQuery,
    noteQuery,
    createNote,
    createNoteAsync,
    updateNote,
    deleteNote,
    restoreNote,
    destroyNote,
    toggleFavorite,
    changeFolder,
    setNoteDetailCache,
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
