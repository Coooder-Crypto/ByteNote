"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { NoteList, NotesHeader } from "@/components/note";
import { Button } from "@/components/ui";
import { useNetworkStatus, useNoteList } from "@/hooks";
import { trpc } from "@/lib/trpc/client";

const CreateNoteDialog = dynamic(() => import("./CreateNoteDialog"), {
  loading: () => null,
});

type NoteBoardProps = {
  onSelectNote: (id: string | null) => void;
};

export default function NotesBoard({ onSelectNote }: NoteBoardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const meQuery = trpc.auth.me.useQuery();
  const enabled = Boolean(meQuery.data);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [sortKey, setSortKey] = useState<"updatedAt" | "createdAt">(
    "updatedAt",
  );

  const filter = useMemo<"all" | "favorite" | "trash" | "collab">(() => {
    const raw = searchParams?.get("filter");
    if (raw === "favorite" || raw === "trash" || raw === "collab") return raw;
    return "all";
  }, [searchParams]);

  const collaborativeOnly = filter === "collab";
  const folderId = useMemo(
    () => searchParams?.get("folderId") ?? undefined,
    [searchParams],
  );

  const currentPath = useMemo(() => {
    const query = searchParams?.toString() ?? "";
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  const authUrl = useMemo(
    () => `/auth?callbackUrl=${encodeURIComponent(currentPath || "/")}`,
    [currentPath],
  );

  const notesQuery = useNoteList({
    filter,
    folderId,
    search: searchQuery || undefined,
    collaborativeOnly: collaborativeOnly || undefined,
    enabled,
    selectedTags,
    sortKey,
    searchQuery,
  });

  const {
    notes,
    filteredNotes,
    availableTags,
    refetch: refetchServer,
    hasMore,
    loadMore,
    loadingMore,
    isLoading,
  } = notesQuery;
  const { online } = useNetworkStatus();
  const handleRefresh = () => {
    void refetchServer?.();
    // 本地缓存刷新由 hook 内 requestIdleCallback 启动，服务器数据 refetch 即可
  };

  const handleCreate = () => {
    if (!meQuery.data) {
      router.push(authUrl);
      return;
    }
    setCreateOpen(true);
  };

  const setSelectedNote = (id: string | null) => {
    const params = new URLSearchParams(searchParams ?? undefined);
    if (id) {
      params.set("noteId", id);
    } else {
      params.delete("noteId");
    }
    router.replace(`/notes${params.toString() ? `?${params.toString()}` : ""}`);
    onSelectNote(id);
  };

  return (
    <>
      <div className="border-border/60 bg-background/90 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-20 -mx-6 mb-6 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5">
          <NotesHeader
            total={notes.length}
            onCreate={handleCreate}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            tags={availableTags}
            selectedTags={selectedTags}
            onToggleTag={(tag) =>
              setSelectedTags((prev) =>
                prev.includes(tag)
                  ? prev.filter((item) => item !== tag)
                  : [...prev, tag],
              )
            }
            sortKey={sortKey}
            onSortChange={setSortKey}
            onClearTags={() => setSelectedTags([])}
            activeFilter={filter}
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      <NoteList
        notes={filteredNotes}
        sortKey={sortKey}
        emptyMessage={isLoading ? "加载中..." : "暂无符合条件的笔记"}
        onSelect={(id) => {
          if (!online) {
            setSelectedNote(id);
          } else {
            setSelectedNote(id);
          }
        }}
        onEndReached={() => {
          if (hasMore && !loadingMore) {
            void loadMore?.();
          }
        }}
        hasMore={hasMore}
        loadingMore={loadingMore}
        loading={isLoading}
      />

      {createOpen ? (
        <CreateNoteDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onUnauthorized={() => router.push(authUrl)}
          onCreated={(id) => setSelectedNote(id)}
          onCreatedLocal={(id) => setSelectedNote(id)}
        />
      ) : null}
    </>
  );
}
