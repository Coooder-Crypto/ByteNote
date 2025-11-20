"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { useMemo, useState } from "react";

import PublicNoteCard from "@/components/public-note-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NOTE_TAGS, parseStoredTags } from "@/lib/tags";
import { trpc } from "@/lib/trpc/client";

type PublicNote = ComponentProps<typeof PublicNoteCard>["note"];
type NoteListItem = PublicNote & {
  summary?: string | null;
  markdown?: string | null;
};

export default function NotesPage() {
  const router = useRouter();
  const meQuery = trpc.auth.me.useQuery();
  const enabled = Boolean(meQuery.data);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const publicNotesQuery = trpc.note.list.useQuery(
    { publicOnly: true, search: searchQuery || undefined },
    { enabled },
  );
  const visibleNotes = useMemo<NoteListItem[]>(
    () => filteredNotes(publicNotesQuery.data, activeTag),
    [publicNotesQuery.data, activeTag],
  );
  const createMutation = trpc.note.create.useMutation({
    onSuccess: (note) => {
      router.push(`/notes/${note.id}`);
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      title: "未命名笔记",
      markdown: "# 新笔记",
      isPublic: false,
      tags: [],
    });
  };


  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">笔记广场</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile">我的笔记</Link>
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!enabled || createMutation.isPending}
          >
            新建笔记
          </Button>
        </div>
      </header>
      {enabled && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeTag ? "outline" : "default"}
              size="sm"
              onClick={() => setActiveTag(null)}
            >
              全部
            </Button>
            {NOTE_TAGS.map((tag) => (
              <Button
                key={tag.value}
                variant={activeTag === tag.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTag(tag.value)}
              >
                {tag.label}
              </Button>
            ))}
          </div>
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="搜索标题或内容"
            className="md:w-64"
          />
        </div>
      )}
      <div className="space-y-3">
        {!enabled && (
          <p className="text-muted-foreground text-sm">
            请先
            <Link href="/auth" className="text-primary underline">
              登录
            </Link>
            ，即可查看公共笔记。
          </p>
        )}
        {enabled && publicNotesQuery.isLoading && (
          <p className="text-muted-foreground text-sm">加载中...</p>
        )}
        {enabled && (
          <>
            {publicNotesQuery.isLoading && (
              <p className="text-muted-foreground text-sm">加载中...</p>
            )}
            {!publicNotesQuery.isLoading &&
              visibleNotes.map((note) => (
                <PublicNoteCard
                  key={note.id}
                  note={note}
                  onView={(id) => router.push(`/notes/${id}`)}
                />
              ))}
            {!publicNotesQuery.isLoading && visibleNotes.length === 0 && (
              <p className="text-muted-foreground text-sm">
                当前标签下暂无公开笔记
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

const filteredNotes = (
  notes: NoteListItem[] | undefined,
  tag: string | null,
) => {
  if (!notes) {
    return [];
  }

  return notes.filter((note) => {
    const matchesTag = tag
      ? parseStoredTags(note.tags).includes(tag)
      : true;

    if (!matchesTag) {
      return false;
    }
    return true;
  });
};
