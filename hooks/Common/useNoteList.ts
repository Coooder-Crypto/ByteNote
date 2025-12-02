"use client";

import { useEffect, useMemo, useState } from "react";

import { isLocalId } from "@/lib/offline/ids";
import { listDrafts } from "@/lib/storage/drafts";
import { parseStoredTags } from "@/lib/tags";
import { trpc } from "@/lib/trpc/client";
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
  const [localNotes, setLocalNotes] = useState<BnNote[]>([]);

  useEffect(() => {
    const loadLocal = async () => {
      const drafts = await listDrafts();
      const locals = drafts
        .filter((d) => isLocalId(d.noteId))
        .map<BnNote>((d) => ({
          id: d.noteId,
          title: d.title,
          content: d.markdown,
          markdown: d.markdown,
          createdAt: new Date(d.updatedAt).toISOString(),
          updatedAt: new Date(d.updatedAt).toISOString(),
          deletedAt: null,
          isFavorite: false,
          folderId: d.folderId,
          tags: d.tags,
          isCollaborative: d.isCollaborative,
        }));
      setLocalNotes(locals);
    };
    void loadLocal();
  }, []);

  const notes: BnNote[] = useMemo(() => {
    const serverNotes: BnNote[] =
      query.data?.map((note) => ({
        id: note.id,
        title: note.title,
        content: (note.content ?? note.markdown ?? "") as string,
        markdown: (note.markdown ?? "") as string,
        createdAt: note.createdAt as Date | string,
        updatedAt: note.updatedAt as Date | string,
        deletedAt: (note.deletedAt ?? null) as Date | string | null,
        isFavorite: note.isFavorite,
        folderId: note.folderId ?? null,
        tags: parseStoredTags(note.tags),
        isCollaborative: note.isCollaborative,
      })) ?? [];
    const ids = new Set(serverNotes.map((n) => n.id));
    const merged: BnNote[] = [...serverNotes];
    localNotes.forEach((ln: BnNote) => {
      if (!ids.has(ln.id)) {
        merged.push({
          ...ln,
          content: ln.content ?? ln.markdown ?? "",
          markdown: ln.markdown ?? "",
          deletedAt: (ln.deletedAt ?? null) as Date | string | null,
          folderId: ln.folderId ?? null,
          createdAt: ln.createdAt,
          updatedAt: ln.updatedAt,
        });
      }
    });
    return merged;
  }, [localNotes, query.data]);

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
