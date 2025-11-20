"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import PublicNoteCard from "@/components/public-note-card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

export default function NotesPage() {
  const router = useRouter();
  const meQuery = trpc.auth.me.useQuery();
  const enabled = Boolean(meQuery.data);
  const publicNotesQuery = trpc.note.list.useQuery(
    { publicOnly: true },
    { enabled },
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
        {enabled &&
          publicNotesQuery.data?.map((note) => (
            <PublicNoteCard
              key={note.id}
              note={note}
              onView={(id) => router.push(`/notes/${id}`)}
            />
          ))}
        {enabled && publicNotesQuery.data?.length === 0 && (
          <p className="text-muted-foreground text-sm">暂无公开笔记</p>
        )}
      </div>
    </section>
  );
}
