"use client";

import { useEffect, useMemo, useState } from "react";

import type { LocalNoteRecord } from "@/lib/offline/db";
import { localManager } from "@/lib/offline/local-manager";
import { parseStoredTags } from "@/lib/tags";
import { trpc } from "@/lib/trpc/client";
import type { BnNote } from "@/types/entities";

import { useNetworkStatus } from "../Store/useNetworkStore";

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
  const { canUseNetwork } = useNetworkStatus();
  const queryEnabled = enabled && canUseNetwork();
  const query = trpc.note.list.useQuery(
    {
      filter,
      folderId,
      search: search || undefined,
      collaborativeOnly: collaborativeOnly || undefined,
    },
    { enabled: queryEnabled },
  );
  const [localNotes, setLocalNotes] = useState<LocalNoteRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadLocal = async () => {
      const cached = await localManager.listAll();
      if (cancelled) return;
      setLocalNotes(cached);
    };
    void loadLocal();
    const tick = window.setInterval(() => void loadLocal(), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(tick);
    };
  }, []);

  const notes: BnNote[] = useMemo(() => {
    const toBnNote = (note: LocalNoteRecord): BnNote => ({
      id: note.id,
      title: note.title ?? "未命名笔记",
      content: note.markdown ?? "",
      markdown: note.markdown ?? "",
      createdAt: new Date(note.updatedAt).toISOString(),
      updatedAt: new Date(note.updatedAt).toISOString(),
      deletedAt: null,
      isFavorite: false,
      folderId: note.folderId ?? null,
      tags: note.tags ?? [],
      isCollaborative: note.isCollaborative ?? false,
    });

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
    const merged: BnNote[] = [...serverNotes];

    localNotes.forEach((ln) => {
      const localNote = toBnNote(ln);
      const index = merged.findIndex((n) => n.id === localNote.id);
      if (index >= 0) {
        merged[index] = {
          ...merged[index],
          ...localNote,
        };
      } else {
        merged.push(localNote);
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
