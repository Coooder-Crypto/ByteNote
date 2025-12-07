"use client";

import { useSession } from "next-auth/react";

import { trpc } from "@/lib/trpc/client";
import type { BnFolder } from "@/types";

import { useNetworkStatus } from "../Network";

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
  const { status } = useSession();
  const loggedIn = status === "authenticated";
  const query = trpc.folder.list.useQuery(undefined, {
    enabled: enabled && canUseNetwork() && loggedIn,
  });

  const folders: BnFolder[] =
    query.data?.folders.map((folder: BnFolder) => ({
      id: folder.id,
      name: folder.name,
      noteCount: folder.noteCount,
    })) ?? [];

  const refetch = async () => {
    if (!canUseNetwork() || !loggedIn) return;
    await query.refetch();
  };

  const createMutation = trpc.folder.create.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const createFolder = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || createMutation.isPending || !canUseNetwork() || !loggedIn)
      return;
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
