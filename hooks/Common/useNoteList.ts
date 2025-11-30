"use client";

import { trpc } from "@/lib/trpc/client";

type NoteListParams = {
  filter: "all" | "favorite" | "trash" | "collab";
  folderId?: string;
  search?: string;
  collaborativeOnly?: boolean;
  enabled?: boolean;
};

export default function useNoteList({
  filter,
  folderId,
  search,
  collaborativeOnly,
  enabled = true,
}: NoteListParams) {
  const query = trpc.note.list.useQuery(
    {
      filter,
      folderId,
      search: search || undefined,
      collaborativeOnly: collaborativeOnly || undefined,
    },
    { enabled },
  );

  return {
    ...query,
    notes: query.data ?? [],
  };
}
