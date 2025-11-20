 "use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

export default function NotesPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery();
  const enabled = Boolean(meQuery.data);
  const publicNotesQuery = trpc.note.list.useQuery(
    { publicOnly: true },
    { enabled },
  );
  const myNotesQuery = trpc.note.list.useQuery(undefined, {
    enabled,
  });
  const createMutation = trpc.note.create.useMutation({
    onSuccess: (note) => {
      router.push(`/notes/${note.id}`);
    },
  });
  const deleteMutation = trpc.note.remove.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate();
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
    <section className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-6 py-12 lg:grid-cols-2">
      <div className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">公开笔记</h2>
            <p className="text-sm text-muted-foreground">
              浏览被标记为 Public 的笔记。
            </p>
          </div>
        </header>
        <div className="space-y-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          {!enabled && (
            <p className="text-sm text-muted-foreground">
              请先<Link href="/auth" className="text-primary underline">
                登录
              </Link>
              ，即可查看公共笔记。
            </p>
          )}
          {enabled && publicNotesQuery.isLoading && (
            <p className="text-sm text-muted-foreground">加载中...</p>
          )}
          {enabled && publicNotesQuery.data?.map((note) => (
            <article
              key={note.id}
              className="rounded-lg border border-border/60 px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{note.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(note.updatedAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/notes/${note.id}`)}
                >
                  查看
                </Button>
              </div>
            </article>
          ))}
          {enabled && publicNotesQuery.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">暂无公开笔记</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">我的笔记</h2>
            <p className="text-sm text-muted-foreground">
              在这里管理自己的 Markdown 笔记。
            </p>
          </div>
          <Button onClick={handleCreate} disabled={!enabled || createMutation.isPending}>
            新建笔记
          </Button>
        </header>
        <div className="space-y-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          {!enabled && (
            <p className="text-sm text-muted-foreground">
              请登录后查看自己的笔记。
            </p>
          )}
          {enabled && myNotesQuery.isLoading && (
            <p className="text-sm text-muted-foreground">加载中...</p>
          )}
          {enabled && myNotesQuery.data?.map((note) => (
            <article
              key={note.id}
              className="rounded-lg border border-border/60 px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{note.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(note.updatedAt).toLocaleString()}
                  </p>
                </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/notes/${note.id}`)}
                    >
                      编辑
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate({ id: note.id })}
                      disabled={deleteMutation.isPending}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          {enabled && myNotesQuery.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">尚无笔记</p>
          )}
        </div>
      </div>
    </section>
  );
}
