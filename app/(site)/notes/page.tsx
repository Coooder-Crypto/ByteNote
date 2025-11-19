"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import rehypeSanitize from "rehype-sanitize";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type EditorState = {
  title: string;
  markdown: string;
  isPublic: boolean;
};

const emptyState: EditorState = {
  title: "",
  markdown: "# 新笔记\n\n开始记录你的内容……",
  isPublic: false,
};

export default function NotesPage() {
  const utils = trpc.useUtils();
  const notesQuery = trpc.note.list.useQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const detailQuery = trpc.note.detail.useQuery(
    { id: selectedId ?? "" },
    { enabled: Boolean(selectedId) },
  );

  const [editorState, setEditorState] = useState<EditorState>(emptyState);

  useEffect(() => {
    if (detailQuery.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditorState({
        title: detailQuery.data.title,
        markdown: detailQuery.data.markdown,
        isPublic: detailQuery.data.isPublic,
      });
    }
  }, [detailQuery.data]);

  useEffect(() => {
    const noteId = searchParams.get("noteId");
    if (noteId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(noteId);
    }
  }, [searchParams]);

  const createMutation = trpc.note.create.useMutation({
    onSuccess: (note) => {
      utils.note.list.invalidate();
      setSelectedId(note.id);
    },
  });

  const updateMutation = trpc.note.update.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate();
      if (selectedId) {
        utils.note.detail.invalidate({ id: selectedId });
      }
    },
  });

  const deleteMutation = trpc.note.remove.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate();
      if (selectedId) {
        utils.note.detail.invalidate({ id: selectedId });
      }
      setSelectedId(null);
      setEditorState(emptyState);
    },
  });

  const isLoading = useMemo(
    () =>
      notesQuery.isLoading ||
      detailQuery.isLoading ||
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
    [
      notesQuery.isLoading,
      detailQuery.isLoading,
      createMutation.isPending,
      updateMutation.isPending,
      deleteMutation.isPending,
    ],
  );

  const handleCreate = () => {
    createMutation.mutate({
      title: editorState.title || "未命名笔记",
      markdown: editorState.markdown,
      isPublic: editorState.isPublic,
    });
  };

  const handleUpdate = () => {
    if (!selectedId) return;
    updateMutation.mutate({
      id: selectedId,
      title: editorState.title || "未命名笔记",
      markdown: editorState.markdown,
      isPublic: editorState.isPublic,
    });
  };

  const handleDelete = () => {
    if (!selectedId) return;
    deleteMutation.mutate({ id: selectedId });
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Markdown 笔记</p>
          <h1 className="text-2xl font-semibold">
            {selectedId ? "编辑笔记" : "创建新笔记"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedId(null);
              setEditorState(emptyState);
            }}
          >
            新建
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "保存中…" : "保存为新笔记"}
          </Button>
          <Button
            size="sm"
            onClick={handleUpdate}
            disabled={!selectedId || updateMutation.isPending}
          >
            {updateMutation.isPending ? "更新中…" : "更新笔记"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={!selectedId || deleteMutation.isPending}
          >
            删除
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
        <aside className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-muted-foreground">
            我的笔记
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            {notesQuery.data?.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => setSelectedId(note.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left ${
                  selectedId === note.id
                    ? "border-primary bg-primary/10"
                    : "border-border/60 hover:border-border"
                }`}
              >
                <p className="font-medium">{note.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(note.updatedAt).toLocaleString()}
                </p>
              </button>
            ))}
            {notesQuery.data?.length === 0 && (
              <p className="text-xs text-muted-foreground">暂无笔记</p>
            )}
          </div>
        </aside>

        <div className="space-y-4">
          <input
            className="w-full rounded-lg border border-border/60 bg-card px-3 py-2 text-lg font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            placeholder="输入笔记标题"
            value={editorState.title}
            onChange={(event) =>
              setEditorState((prev) => ({
                ...prev,
                title: event.target.value,
              }))
            }
            disabled={isLoading}
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={editorState.isPublic}
              onChange={(event) =>
                setEditorState((prev) => ({
                  ...prev,
                  isPublic: event.target.checked,
                }))
              }
              disabled={isLoading}
            />
            公开笔记（将出现在笔记广场）
          </label>
          <div className="rounded-xl border border-border/60 bg-card p-2 shadow-sm">
            <MDEditor
              value={editorState.markdown}
              onChange={(value) =>
                setEditorState((prev) => ({
                  ...prev,
                  markdown: value ?? "",
                }))
              }
              previewOptions={{
                rehypePlugins: [[rehypeSanitize]],
              }}
              height={500}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
