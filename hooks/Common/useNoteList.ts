"use client";

import { useMemo } from "react";

import { trpc } from "@/lib/trpc/client";
import { parseStoredTags } from "@/lib/tags";
import type { BnNote } from "@/types/entities";

type NoteListParams = {
  filter: "all" | "favorite" | "trash" | "collab";
  folderId?: string;
  search?: string;
  collaborativeOnly?: boolean;
  enabled?: boolean;
  selectedTags?: string[];
  sortKey?: "updatedAt" | "createdAt";
  searchQuery?: string;
};

export default function useNoteList({
  filter,
  folderId,
  search,
  collaborativeOnly,
  enabled = true,
  selectedTags = [],
  sortKey = "updatedAt",
  searchQuery = "",
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

  const notes: BnNote[] = useMemo(() => {
    return (
      query.data?.map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content ?? note.markdown,
        markdown: note.markdown,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        deletedAt: note.deletedAt,
        isFavorite: note.isFavorite,
        folderId: note.folderId,
        tags: parseStoredTags(note.tags),
        isCollaborative: note.isCollaborative,
      })) ?? []
    );
  }, [query.data]);

  const availableTags = useMemo(() => {
    const base = new Set<string>();
    notes.forEach((note) => note.tags.forEach((tag) => base.add(tag)));
    return Array.from(base).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const lower = searchQuery.trim().toLowerCase();
    const filtered = notes.filter((note) => {
      const matchesText =
        lower.length === 0 ||
        note.title.toLowerCase().includes(lower) ||
        (note.content ?? "").toLowerCase().includes(lower) ||
        note.tags.some((tag) => tag.toLowerCase().includes(lower));
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => note.tags.includes(tag));
      return matchesText && matchesTags;
    });
    return filtered.sort((a, b) => {
      const aTime = new Date(String(a[sortKey])).getTime();
      const bTime = new Date(String(b[sortKey])).getTime();
      return bTime - aTime;
    });
  }, [notes, searchQuery, selectedTags, sortKey]);

  return {
    ...query,
    notes,
    filteredNotes,
    availableTags,
  };
}
