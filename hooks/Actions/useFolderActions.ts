"use client";

import { trpc } from "@/lib/trpc/client";
import type { BnFolder } from "@/types/entities";
import useNetworkStatus from "../Common/useNetworkStatus";

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
  const { online, canUseNetwork } = useNetworkStatus();
  const query = trpc.folder.list.useQuery(undefined, {
    enabled: enabled && canUseNetwork(),
  });

  const folders: BnFolder[] =
    query.data?.folders.map((folder: BnFolder) => ({
      id: folder.id,
      name: folder.name,
      noteCount: folder.noteCount,
    })) ?? [];

  const refetch = async () => {
    if (!canUseNetwork()) return;
    await query.refetch();
  };

  const createMutation = trpc.folder.create.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const createFolder = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || createMutation.isPending || !canUseNetwork()) return;
    createMutation.mutate({ name: trimmed });
  };

  return {
    folders,
    totalCount: query.data?.totalCount ?? 0,
    isLoading: query.isLoading || !online,
    refetch,
    createFolder,
    createPending: createMutation.isPending,
    createError: createMutation.error,
  };
}
