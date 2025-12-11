"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { parseStoredTags } from "@/lib/constants/tags";
import { localManager } from "@/lib/manager/LocalManager";
import type { BnNote, LocalNoteRecord } from "@/types";

import { useNetworkStatus } from "../network";
import useNoteActions from "./useNoteActions";

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
  const { useNoteListInfinite } = useNoteActions({});
  const { status } = useSession();
  const loggedIn = status === "authenticated";
  const queryEnabled = enabled && canUseNetwork() && loggedIn;
  const query = useNoteListInfinite(
    {
      filter,
      folderId,
      search: search || undefined,
      collaborativeOnly: collaborativeOnly || undefined,
      limit: 20,
    },
    {
      enabled: queryEnabled,
      staleTime: 60000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );
  const [localNotes, setLocalNotes] = useState<LocalNoteRecord[]>([]);
  const [localRefreshing, setLocalRefreshing] = useState(false);
  const [localLoadedOnce, setLocalLoadedOnce] = useState(false);

  const refreshLocal = useCallback(async () => {
    if (localRefreshing) return;
    setLocalRefreshing(true);
    try {
      const cached = await localManager.listAll();
      setLocalNotes(cached);
    } finally {
      setLocalRefreshing(false);
    }
  }, [localRefreshing]);

  useEffect(() => {
    let cancelled = false;

    if (!cancelled && !localLoadedOnce) {
      void (async () => {
        await refreshLocal();
        setLocalLoadedOnce(true);
      })();
    }

    const load = () => {
      if (cancelled) return;
      void refreshLocal();
    };
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (
        window as typeof window & { requestIdleCallback?: IdleRequestCallback }
      ).requestIdleCallback?.(() => load());
    } else {
      setTimeout(load, 0);
    }
    return () => {
      cancelled = true;
    };
  }, [localLoadedOnce, refreshLocal]);

  const notes: BnNote[] = useMemo(() => {
    const extractText = (contentJson: any): string => {
      const walk = (node: any): string => {
        if (!node) return "";
        if (typeof node.text === "string") return node.text;
        if (Array.isArray(node.children)) {
          return node.children.map(walk).join("");
        }
        if (Array.isArray(node)) {
          return node.map(walk).join("\n");
        }
        return "";
      };
      return Array.isArray(contentJson)
        ? contentJson.map(walk).join("\n")
        : walk(contentJson);
    };

    const mapLocal = (note: LocalNoteRecord): BnNote => {
      const contentJson = note.contentJson as any;
      const text = extractText(contentJson);
      return {
        id: note.id,
        title: note.title ?? "未命名笔记",
        content: text,
        contentJson,
        summary: note.summary ?? undefined,
        aiMeta: note.aiMeta,
        createdAt: new Date(note.updatedAt).toISOString(),
        updatedAt: new Date(note.updatedAt).toISOString(),
        deletedAt: null,
        isFavorite: false,
        folderId: note.folderId ?? null,
        tags: note.tags ?? [],
        isCollaborative: note.isCollaborative ?? false,
      };
    };

    if (queryEnabled && Array.isArray(query.data?.pages)) {
      const remoteNotes = query.data.pages.flatMap((page) => page.items ?? []);
      return remoteNotes.map((note) => {
        const contentJson = (note as any).contentJson as any;
        const text = extractText(contentJson);
        return {
          id: note.id,
          title: note.title,
          content: text,
          contentJson,
          summary: (note as any).summary ?? undefined,
          aiMeta: (note as any).aiMeta,
          createdAt: note.createdAt as Date | string,
          updatedAt: note.updatedAt as Date | string,
          deletedAt: (note.deletedAt ?? null) as Date | string | null,
          isFavorite: note.isFavorite,
          folderId: note.folderId ?? null,
          tags: parseStoredTags(note.tags),
          isCollaborative: note.isCollaborative,
        };
      });
    }

    return localNotes.map(mapLocal);
  }, [localNotes, query.data, queryEnabled]);

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
        (note.summary ?? "").toLowerCase().includes(lower) ||
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
    hasMore: queryEnabled
      ? Boolean(query.data?.pages?.[query.data.pages.length - 1]?.nextCursor)
      : false,
    loadMore: queryEnabled ? () => query.fetchNextPage?.() : undefined,
    loadingMore: queryEnabled ? query.isFetchingNextPage : false,
    loading: queryEnabled ? query.isLoading : !localLoadedOnce && localRefreshing,
  };
}
