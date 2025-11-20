"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import rehypeSanitize from "rehype-sanitize";

import { NoteTags } from "@/components/note-tags";
import { TagInput } from "@/components/tag-input";
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
  tags: string[];
};

const emptyState: EditorState = {
  title: "",
  markdown: "",
  isPublic: false,
  tags: [],
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
            return Array.isArray(parsed)
              ? parsed.filter(
                  (tag): tag is string =>
                    typeof tag === "string" && tag.trim().length > 0,
                )
              : [];
          } catch {
            return [];
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
                  tags: state.tags,
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
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1 space-y-2 lg:max-w-2xl">
              <p className="text-xs text-muted-foreground">
                标签（可输入或选择）
              </p>
              <TagInput
                value={state.tags}
                onChange={(tags) =>
                  setState((prev) => ({
                    ...prev,
                    tags,
                  }))
                }
                placeholder="输入标签或从列表选择"
                className="w-full"
              />
            </div>
            <label className="flex h-[44px] items-center gap-2 rounded-lg border border-border/60 bg-card px-4 text-sm text-muted-foreground">
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
          </div>
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
          <NoteTags tags={state.tags} />
          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm h-[70vh] overflow-auto">
            <MarkdownPreview source={state.markdown} />
          </div>
        </div>
      )}
    </section>
  );
}
