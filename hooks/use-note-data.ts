"use client";

import { trpc } from "@/lib/trpc/client";

export function useNoteData(noteId: string) {
  const noteQuery = trpc.note.detail.useQuery(
    { id: noteId },
    { enabled: Boolean(noteId) },
  );
  const meQuery = trpc.auth.me.useQuery();

  const isOwner =
    !!noteQuery.data && meQuery.data?.id === noteQuery.data.userId;

  return {
    noteQuery,
    meQuery,
    isOwner,
  };
}
