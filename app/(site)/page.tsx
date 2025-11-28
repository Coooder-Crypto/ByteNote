"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import {
  NoteList,
  PageHeader,
  SearchBar,
  TagsFilter,
} from "@/components/Dashboard";
import { CreateNoteDialog } from "@/components/CreateNoteDialog";
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
  const filter = useMemo(
    () => searchParams.get("filter") ?? "all",
    [searchParams],
  );
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
      filter: (["all", "favorite", "trash"] as const).includes(
        filter as "all" | "favorite" | "trash",
      )
        ? (filter as "all" | "favorite" | "trash")
        : "all",
      folderId,
      search: searchQuery || undefined,
    },
    { enabled },
  );

  const notes = useMemo(() => {
    return (notesQuery.data ?? []).map((note) => ({
      id: note.id,
      title: note.title,
      content: note.content ?? note.markdown,
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
    return notes.filter((note) => {
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
  }, [notes, searchQuery, selectedTags]);

  const handleCreate = () => {
    if (!meQuery.data) {
      router.push(authUrl);
      return;
    }
    setCreateOpen(true);
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
      <PageHeader total={notes.length} onCreate={handleCreate} />

      {!enabled ? (
        <p className="border-border/70 bg-card/80 text-muted-foreground rounded-2xl border border-dashed p-4 text-sm">
          请先
          <Link href={authUrl} className="text-primary underline">
            登录
          </Link>
          ，即可管理你的笔记。
        </p>
      ) : (
        <div className="space-y-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <TagsFilter
            tags={availableTags}
            selected={selectedTags}
            onToggle={(tag) =>
              setSelectedTags((prev) =>
                prev.includes(tag)
                  ? prev.filter((item) => item !== tag)
                  : [...prev, tag],
              )
            }
          />
        </div>
      )}

      <NoteList
        notes={filteredNotes}
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
