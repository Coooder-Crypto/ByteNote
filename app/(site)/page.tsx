"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { CreateNoteDialog } from "@/components/CreateNoteDialog";
import { NoteList, NotesHeader } from "@/components/Notes";
import { NOTE_TAGS, parseStoredTags } from "@/lib/tags";
import { trpc } from "@/lib/trpc/client";

const parseTags = (raw: string | null | undefined) =>
  parseStoredTags(raw).filter((tag): tag is string => typeof tag === "string");

export default function NotesHomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const meQuery = trpc.auth.me.useQuery();
  const enabled = Boolean(meQuery.data);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [sortKey, setSortKey] = useState<"updatedAt" | "createdAt">("updatedAt");
  const filter = useMemo<"all" | "favorite" | "trash" | "collab">(() => {
    const raw = searchParams.get("filter");
    if (raw === "favorite" || raw === "trash" || raw === "collab") return raw;
    return "all";
  }, [searchParams]);
  const collaborativeOnly = filter === "collab";
  const folderId = useMemo(
    () => searchParams.get("folderId") ?? undefined,
    [searchParams],
  );
  const currentPath = useMemo(() => {
    const query = searchParams.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);
  const authUrl = useMemo(
    () => `/auth?callbackUrl=${encodeURIComponent(currentPath || "/")}`,
    [currentPath],
  );

  const notesQuery = trpc.note.list.useQuery(
    {
      filter,
      folderId,
      search: searchQuery || undefined,
      collaborativeOnly: collaborativeOnly || undefined,
    },
    { enabled },
  );

  const notes = useMemo(() => {
    return (notesQuery.data ?? []).map((note) => ({
      id: note.id,
      title: note.title,
      content: note.content ?? note.markdown,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      deletedAt: note.deletedAt,
      isFavorite: note.isFavorite,
      folderId: note.folderId,
      tags: parseTags(note.tags),
    }));
  }, [notesQuery.data]);

  const availableTags = useMemo(() => {
    const base = new Set<string>(NOTE_TAGS.map((tag) => tag.value));
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
      const aTime = new Date(a[sortKey] as string).getTime();
      const bTime = new Date(b[sortKey] as string).getTime();
      return bTime - aTime;
    });
  }, [notes, searchQuery, selectedTags, sortKey]);

  const handleCreate = () => {
    if (!meQuery.data) {
      router.push(authUrl);
      return;
    }
    setCreateOpen(true);
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-12">
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
          />
        </div>
      </div>

      <NoteList
        notes={filteredNotes}
        sortKey={sortKey}
        emptyMessage={notesQuery.isLoading ? "加载中..." : "暂无符合条件的笔记"}
      />
      <CreateNoteDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onUnauthorized={() => router.push(authUrl)}
        onCreated={(id) => router.push(`/notes/${id}`)}
      />
    </section>
  );
}
