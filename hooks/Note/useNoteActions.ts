"use client";

import type { inferRouterOutputs } from "@trpc/server";
import { useRouter } from "next/navigation";

import { trpc } from "@/lib/trpc/client";
import { isLocalId } from "@/lib/utils/offline/ids";
import type { AppRouter } from "@/server/api/root";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type NoteUpdateResult = RouterOutputs["note"]["update"];
type NoteCreateResult = RouterOutputs["note"]["create"];
type NoteListInput = Parameters<(typeof trpc.note.list)["useQuery"]>[0];
type NoteDetailResult = RouterOutputs["note"]["detail"];
type SetWsResult = RouterOutputs["note"]["setCollabWsUrl"];

type Params<T extends { title?: string; contentJson?: any; version?: number }> =
  {
    noteId?: string;
    onStateChange?: (updater: (prev: T) => T) => void;
    onDirtyChange?: (dirty: boolean) => void;
    withQueries?: boolean;
  };

export default function useNoteActions<
  T extends { title?: string; contentJson?: any; version?: number },
>({ noteId, onStateChange, onDirtyChange, withQueries = false }: Params<T>) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: withQueries,
  });
  const noteQuery = trpc.note.detail.useQuery(
    { id: noteId as string },
    { enabled: withQueries && Boolean(noteId) && !isLocalId(noteId ?? "") },
  );

  const updateMutation = trpc.note.update.useMutation({
    onSuccess: (data: NoteUpdateResult | null) => {
      onDirtyChange?.(false);
      if (data && onStateChange) {
        onStateChange((prev) => ({
          ...prev,
          title: data.title ?? prev.title,
          contentJson: (data as any).contentJson ?? prev.contentJson,
          summary: (data as any).summary ?? (prev as any).summary,
          aiMeta: (data as any).aiMeta ?? (prev as any).aiMeta,
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

  const setWsMutation = trpc.note.setCollabWsUrl.useMutation({
    onSuccess: (data: SetWsResult) => {
      if (data?.collabWsUrl && onStateChange) {
        onStateChange((prev) => ({
          ...prev,
          collabWsUrl: data.collabWsUrl ?? (prev as any).collabWsUrl,
        }));
      }
      utils.note.detail.invalidate({ id: noteId });
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

  const fetchNote = async (id: string): Promise<NoteDetailResult | null> => {
    try {
      return await utils.note.detail.fetch({ id });
    } catch {
      return null;
    }
  };

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

  const useNoteListQuery = (
    input: NoteListInput,
    options?: Parameters<(typeof trpc.note.list)["useQuery"]>[1],
  ) => trpc.note.list.useQuery(input, options);

  const setWsUrl = (payload: { noteId: string; collabWsUrl: string }) =>
    setWsMutation.mutate(payload);

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
    fetchNote,
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
    useNoteListQuery,
    setWsUrl,
    setWsPending: setWsMutation.isPending,
    setWsError: setWsMutation.error,
  };
}
