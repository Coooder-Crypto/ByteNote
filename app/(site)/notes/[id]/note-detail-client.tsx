"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import rehypeSanitize from "rehype-sanitize";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
const MarkdownPreview = dynamic(
  () => import("@uiw/react-markdown-preview"),
  { ssr: false },
);

type EditorState = {
  title: string;
  markdown: string;
  isPublic: boolean;
  tags: string;
};

const emptyState: EditorState = {
  title: "",
  markdown: "",
  isPublic: false,
  tags: "",
};

export default function NoteDetailClient({ noteId }: { noteId: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const noteQuery = trpc.note.detail.useQuery(
    {
      id: noteId,
    },
    { enabled: Boolean(noteId) },
  );
  const meQuery = trpc.auth.me.useQuery();

  const [state, setState] = useState<EditorState>(emptyState);

  useEffect(() => {
    if (noteQuery.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({
        title: noteQuery.data.title,
        markdown: noteQuery.data.markdown,
        isPublic: noteQuery.data.isPublic,
        tags: (() => {
          try {
            const parsed = JSON.parse(noteQuery.data.tags);
            return Array.isArray(parsed) ? parsed.join(", ") : "";
          } catch {
            return "";
          }
        })(),
      });
    }
  }, [noteQuery.data]);

  const isOwner = useMemo(
    () => noteQuery.data && meQuery.data?.id === noteQuery.data.userId,
    [noteQuery.data, meQuery.data?.id],
  );

  const updateMutation = trpc.note.update.useMutation({
    onSuccess: () => {
      utils.note.detail.invalidate({ id: noteId });
      utils.note.list.invalidate();
    },
  });

  const deleteMutation = trpc.note.remove.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate();
      router.push("/notes");
    },
  });

  if (noteQuery.isLoading) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">加载中...</p>
      </section>
    );
  }

  if (!noteQuery.data) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">未找到笔记</p>
      </section>
    );
  }

  const parsedTags = state.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{state.title || "笔记详情"}</h2>
          <p className="text-sm text-muted-foreground">
            {isOwner ? "你可以编辑这篇笔记" : "此笔记为只读"}
          </p>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                updateMutation.mutate({
                  id: noteId,
                  title: state.title || "未命名笔记",
                  markdown: state.markdown,
                  isPublic: state.isPublic,
                  tags: parsedTags,
                })
              }
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "保存中..." : "保存"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate({ id: noteId })}
              disabled={deleteMutation.isPending}
            >
              删除
            </Button>
          </div>
        )}
      </div>

      {isOwner ? (
        <div className="space-y-4">
          <Input
            value={state.title}
            onChange={(event) =>
              setState((prev) => ({ ...prev, title: event.target.value }))
            }
            placeholder="输入标题"
          />
          <input
            className="w-full rounded-lg border border-border/60 bg-card px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            placeholder="输入标签，使用逗号分隔"
            value={state.tags}
            onChange={(event) =>
              setState((prev) => ({ ...prev, tags: event.target.value }))
            }
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={state.isPublic}
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  isPublic: event.target.checked,
                }))
              }
            />
            公开笔记
          </label>
          <div className="rounded-xl border border-border/60 bg-card p-2 shadow-sm h-[70vh]">
            <MDEditor
              value={state.markdown}
              onChange={(value) =>
                setState((prev) => ({ ...prev, markdown: value ?? "" }))
              }
              previewOptions={{
                rehypePlugins: [[rehypeSanitize]],
              }}
              height={550}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            标签：{parsedTags.join(", ") || "无"}
          </p>
          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm h-[70vh] overflow-auto">
            <MarkdownPreview source={state.markdown} />
          </div>
        </div>
      )}
    </section>
  );
}
