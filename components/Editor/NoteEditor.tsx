"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { Descendant } from "slate";
import { toSharedType } from "slate-yjs";
import { toast } from "sonner";
import type { Doc } from "yjs";

import {
  CollaboratorDialog,
  EditorHeader,
  SlateEditor,
} from "@/components/Editor";
import { toPlainText } from "@/components/Editor/slate/normalize";
import {
  useEditor,
  useNetworkStatus,
  useNoteActions,
  useUserStore,
} from "@/hooks";
import { DEFAULT_VALUE } from "@/lib/constants/editor";
import { trpc } from "@/lib/trpc/client";
import type { AiMeta, EditorContent } from "@/types/editor";

export default function NoteEditor({ noteId }: { noteId: string }) {
  const [collabOpen, setCollabOpen] = useState(false);
  const [collabEnabled, setCollabEnabled] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUserStore();
  const { online } = useNetworkStatus();
  const { setWsUrl, setWsPending } = useNoteActions({});
  const utils = trpc.useUtils();
  const {
    note,
    saving,
    sharedType,
    collabStatus,
    flushCollabToServer,
    handleTitleChange,
    handleTagsChange,
    handleContentChange,
    handleSave,
    setCollabWs,
    setCollaborative,
    applyServerUpdate,
  } = useEditor(noteId, { collabEnabled });

  const { canEdit, isTrashed } = note.access;
  const titlePlaceholder = useMemo(
    () => (note.access.canEdit ? "Untitled note" : "无权限编辑"),
    [note.access.canEdit],
  );

  const value: EditorContent = useMemo(() => {
    if (Array.isArray(note.contentJson) && note.contentJson.length > 0) {
      return note.contentJson as EditorContent;
    }
    return DEFAULT_VALUE;
  }, [note.contentJson]);

  const valueKey = useMemo(
    () => `${noteId}-${note.version}`,
    [noteId, note.version],
  );

  const charCount = useMemo(() => toPlainText(value).length, [value]);

  const syncSharedContent = useCallback(
    (nextContent: Descendant[]) => {
      if (!collabEnabled || !sharedType) return;
      const yDoc = (sharedType as unknown as { doc?: Doc }).doc;
      if (!yDoc) return;
      try {
        yDoc.transact(() => {
          sharedType.delete(0, sharedType.length);
          toSharedType(sharedType, nextContent);
        });
      } catch (err) {
        console.warn("[ai] 同步协作内容失败", err);
      }
    },
    [collabEnabled, sharedType],
  );

  type AiResultPayload = {
    contentJson?: Descendant[] | null;
    summary?: string | null;
    aiMeta?: AiMeta;
    version?: number | null;
  };

  const handleAiResult = useCallback(
    (data?: AiResultPayload | null) => {
      if (!data) return;
      const nextContent = data.contentJson ?? undefined;
      const nextSummary =
        typeof data.summary === "string" ? data.summary : undefined;
      const nextVersion =
        typeof data.version === "number" ? data.version : undefined;

      applyServerUpdate({
        contentJson: nextContent ?? note.contentJson,
        summary: nextSummary ?? note.summary,
        aiMeta: data.aiMeta,
        version: nextVersion,
      });
      if (nextContent) {
        syncSharedContent(nextContent);
      }
    },
    [applyServerUpdate, note.contentJson, note.summary, syncSharedContent],
  );

  const aiSummarize = trpc.note.aiSummarize.useMutation({
    onSuccess: (data) => {
      handleAiResult({
        contentJson: Array.isArray(data?.contentJson)
          ? (data.contentJson as Descendant[])
          : null,
        summary: typeof data?.summary === "string" ? data.summary : null,
        aiMeta:
          data?.aiMeta && typeof data.aiMeta === "object"
            ? (data.aiMeta as AiMeta)
            : undefined,
        version: typeof data?.version === "number" ? data.version : undefined,
      });
      void utils.note.detail.invalidate({ id: noteId });
      void utils.note.list.invalidate();
      toast.success("已生成摘要");
    },
    onError: (err) => {
      toast.error(err?.message ?? "生成摘要失败");
    },
  });

  const triggerSummary = useCallback(() => {
    if (!canEdit || isTrashed) return;
    if (!online) {
      toast.error("当前离线，无法使用 AI");
      return;
    }
    aiSummarize.mutate({ id: noteId });
  }, [aiSummarize, canEdit, isTrashed, noteId, online]);

  const collaboratorsQuery = trpc.collaborator.list.useQuery(
    { noteId },
    { enabled: note.isCollaborative },
  );

  const collaboratorAvatars = useMemo(
    () =>
      (collaboratorsQuery.data ?? [])
        .filter((c) => c.user?.id !== user?.id)
        .map((c) => ({
          name: c.user?.name ?? c.user?.email ?? "协作者",
          avatarUrl: c.user?.avatarUrl ?? null,
        })),
    [collaboratorsQuery.data, user?.id],
  );

  return (
    <div className="bg-background flex h-full min-h-screen flex-col overflow-hidden">
      <EditorHeader
        isCollaborative={note.isCollaborative}
        collabEnabled={collabEnabled}
        collabStatus={collabStatus}
        isTrashed={isTrashed}
        canEdit={canEdit}
        charCount={charCount}
        saving={saving}
        folderLabel="Notes"
        currentUser={{
          name: user?.name ?? user?.email ?? "我",
          avatarUrl: user?.avatarUrl,
        }}
        collaborators={collaboratorAvatars}
        onSave={handleSave}
        onManageCollaborators={() => setCollabOpen(true)}
        onToggleCollab={async () => {
          if (!note.isCollaborative) return;
          if (collabEnabled) {
            await flushCollabToServer?.();
            setCollabEnabled(false);
          } else {
            setCollabEnabled(true);
          }
        }}
        onBack={() => {
          const params = new URLSearchParams(searchParams ?? undefined);
          params.delete("noteId");
          router.replace(
            `/notes${params.toString() ? `?${params.toString()}` : ""}`,
          );
        }}
      />

      {collabEnabled ? (
        sharedType ? (
          <SlateEditor
            valueKey={`collab-${noteId}`}
            value={value}
            onChange={(val) => handleContentChange(val as Descendant[])}
            title={note.title}
            onTitleChange={handleTitleChange}
            titlePlaceholder={titlePlaceholder}
            tags={note.tags}
            onTagsChange={handleTagsChange}
            tagPlaceholder="添加标签"
            summary={note.summary ?? ""}
            summarizing={aiSummarize.isPending}
            onGenerateSummary={triggerSummary}
            readOnly={!canEdit || isTrashed}
            placeholder="Start writing..."
            sharedType={sharedType}
          />
        ) : (
          <div className="text-muted-foreground text-sm">协作连接中...</div>
        )
      ) : (
        <SlateEditor
          valueKey={`local-${valueKey}`}
          value={value}
          onChange={(val) => handleContentChange(val as Descendant[])}
          title={note.title}
          onTitleChange={handleTitleChange}
          titlePlaceholder={titlePlaceholder}
          tags={note.tags}
          onTagsChange={handleTagsChange}
          tagPlaceholder="添加标签"
          summary={note.summary ?? ""}
          summarizing={aiSummarize.isPending}
          onGenerateSummary={triggerSummary}
          readOnly={!canEdit || isTrashed}
          placeholder="Start writing..."
          sharedType={null}
        />
      )}

      <CollaboratorDialog
        noteId={noteId}
        open={collabOpen}
        onOpenChange={setCollabOpen}
        onUpdateWs={(ws) => {
          setCollabWs(ws);
          setWsUrl({ noteId, collabWsUrl: ws });
        }}
        wsUrl={typeof note.collabWsUrl === "string" ? note.collabWsUrl : ""}
        wsUpdating={setWsPending}
        isCollaborative={note.isCollaborative}
        onToggleCollaborative={(next) => {
          setCollaborative(next);
          setCollabEnabled((prev) => (next ? prev : false));
        }}
      />
    </div>
  );
}
