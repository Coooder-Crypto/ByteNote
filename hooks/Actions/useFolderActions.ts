"use client";

import { trpc } from "@/lib/trpc/client";
import type { BnFolder } from "@/types/entities";

type FolderActionsResult = {
  folders: BnFolder[];
  totalCount: number;
  isLoading: boolean;
  refetch: () => Promise<void>;
  createFolder: (name: string) => void;
  createPending: boolean;
  createError: unknown;
};

export default function useFolderActions(enabled = true): FolderActionsResult {
  const query = trpc.folder.list.useQuery(undefined, {
    enabled,
  });

  const folders: BnFolder[] =
    query.data?.folders.map((folder: BnFolder) => ({
      id: folder.id,
      name: folder.name,
      noteCount: folder.noteCount,
    })) ?? [];

  const refetch = async () => {
    await query.refetch();
  };

  const createMutation = trpc.folder.create.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const createFolder = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || createMutation.isPending) return;
    createMutation.mutate({ name: trimmed });
  };

  return {
    folders,
    totalCount: query.data?.totalCount ?? 0,
    isLoading: query.isLoading,
    refetch,
    createFolder,
    createPending: createMutation.isPending,
    createError: createMutation.error,
  };
}
