"use client";

import { trpc } from "@/lib/trpc/client";

export default function useCollaboratorActions(noteId: string) {
  const utils = trpc.useUtils();

  const addMutation = trpc.collaborator.add.useMutation({
    onSuccess: () => {
      void utils.collaborator.list.invalidate({ noteId });
    },
  });

  const removeMutation = trpc.collaborator.remove.useMutation({
    onSuccess: () => {
      void utils.collaborator.list.invalidate({ noteId });
    },
  });

  const addCollaborator = (
    userId: string,
    role: "editor" | "viewer" = "editor",
  ) => addMutation.mutate({ noteId, userId, role });

  const removeCollaborator = (userId: string) =>
    removeMutation.mutate({ noteId, userId });

  const invalidateCollaborators = () =>
    utils.collaborator.list.invalidate({ noteId });

  const searchUsers = async (keyword: string) => {
    return (await utils.user.search.fetch({ keyword }).catch(() => [])) ?? [];
  };

  return {
    addCollaborator,
    removeCollaborator,
    invalidateCollaborators,
    searchUsers,
    addPending: addMutation.isPending,
    removePending: removeMutation.isPending,
    addError: addMutation.error,
    removeError: removeMutation.error,
  };
}
