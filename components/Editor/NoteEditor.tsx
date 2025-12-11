"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Descendant, Editor } from "slate";
import { createEditor } from "slate";
import { withHistory } from "slate-history";
import { withReact } from "slate-react";
import { toSharedType, withYjs } from "slate-yjs";
import type { Doc } from "yjs";

import EditorHeader from "@/components/editor/EditorHeader";
import { toPlainText } from "@/components/editor/slate/normalize";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useEditor,
  useNetworkStatus,
  useNoteActions,
  useShortcuts,
  useUserStore,
} from "@/hooks";
import {
  BLOCK_CONFIGS,
  DEFAULT_VALUE,
  MARK_KEYS,
} from "@/lib/constants/editor";
import { trpc } from "@/lib/trpc/client";
import type { AiMeta, EditorContent } from "@/types/editor";

import type { ToolbarActions } from "./slate/Toolbar";

const SlateEditor = dynamic(() => import("./SlateEditor"), {
  ssr: false,
  loading: () => null,
});

const CollaboratorDialog = dynamic(() => import("./CollaboratorDialog"), {
  ssr: false,
  loading: () => null,
});

export default function NoteEditor({ noteId }: { noteId: string }) {
  const [collabOpen, setCollabOpen] = useState(false);
  const [collabEnabled, setCollabEnabled] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUserStore();
  const { online } = useNetworkStatus();
  const { setWsUrl, setWsPending, deleteNote, deletePending } = useNoteActions({
    noteId,
  });
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

  const collaboratorsQuery = trpc.collaborator.list.useQuery(
    { noteId },
    { enabled: note.isCollaborative },
  );
  const canUseAi = canEdit && !isTrashed && online;
  const [previewMode, setPreviewMode] = useState(false);
  const isReadOnly = previewMode || !canEdit || isTrashed;

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

  const editor: Editor = useMemo(() => {
    if (sharedType) {
      const ed = withYjs(withReact(createEditor()), sharedType);
      (ed as Editor & { __collab?: boolean }).__collab = true;
      return withHistory(ed);
    }
    return withHistory(withReact(createEditor()));
  }, [sharedType, valueKey]);

  const {
    handleKeyDown,
    isMarkActive,
    isBlockActive,
    toggleMark,
    toggleBlock,
  } = useShortcuts(editor);

  const toolbarActions: ToolbarActions = useMemo(() => {
    const marks = MARK_KEYS.reduce(
      (acc, key) => ({
        ...acc,
        [key]: {
          active: isMarkActive(key),
          onClick: () => toggleMark(key),
        },
      }),
      {} as Record<
        (typeof MARK_KEYS)[number],
        { active: boolean; onClick: () => void }
      >,
    );

    const blocks = BLOCK_CONFIGS.reduce(
      (acc, item) => ({
        ...acc,
        [item.key]: {
          active: isBlockActive(item.type),
          onClick: () => toggleBlock(item.type),
        },
      }),
      {} as Record<
        (typeof BLOCK_CONFIGS)[number]["key"],
        { active: boolean; onClick: () => void }
      >,
    );

    return { ...marks, ...blocks };
  }, [isBlockActive, isMarkActive, toggleBlock, toggleMark]);

  const [wide, setWide] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("bn-editor-width");
    setTimeout(() => setWide(saved === "wide"), 0);
  }, []);

  const toggleWidth = () => {
    setWide((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "bn-editor-width",
          next ? "wide" : "default",
        );
      }
      return next;
    });
  };

  const editorPlaceholder = "Start writing...";
  const editorValueKey = collabEnabled
    ? `collab-${noteId}`
    : `local-${valueKey}`;
  const editorSharedType = collabEnabled ? sharedType : null;
  const handleEditorChange = useCallback(
    (val: Descendant[]) => handleContentChange(val as Descendant[]),
    [handleContentChange],
  );

  const togglePreview = () => setPreviewMode((prev) => !prev);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const handleConfirmDelete = () => {
    deleteNote();
    setConfirmDeleteOpen(false);
  };

  const headerProps = {
    isCollaborative: note.isCollaborative,
    collabEnabled,
    collabStatus,
    isTrashed,
    canEdit,
    charCount,
    saving,
    folderLabel: "Notes",
    currentUser: {
      name: user?.name ?? user?.email ?? "我",
      avatarUrl: user?.avatarUrl,
    },
    collaborators: collaboratorAvatars,
    onSave: handleSave,
    onManageCollaborators: () => setCollabOpen(true),
    onToggleCollab: async () => {
      if (!note.isCollaborative) return;
      if (collabEnabled) {
        await flushCollabToServer?.();
        setCollabEnabled(false);
      } else {
        setCollabEnabled(true);
      }
    },
    onBack: () => {
      const params = new URLSearchParams(searchParams ?? undefined);
      params.delete("noteId");
      router.replace(
        `/notes${params.toString() ? `?${params.toString()}` : ""}`,
      );
    },
    toolbarActions,
    wide,
    onToggleWidth: toggleWidth,
    previewMode,
    onTogglePreview: canEdit && !isTrashed ? togglePreview : undefined,
    onRequestDelete:
      canEdit && !isTrashed ? () => setConfirmDeleteOpen(true) : undefined,
    deleting: deletePending,
  };

  return (
    <div className="bg-card/40 flex h-screen flex-col overflow-hidden">
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-auto overscroll-contain">
        <div className="bg-background/95 sticky top-0 z-10 backdrop-blur">
          <EditorHeader {...headerProps} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {collabEnabled && !sharedType ? (
            <div className="text-muted-foreground text-sm">协作连接中...</div>
          ) : (
            <SlateEditor
              noteId={noteId}
              valueKey={editorValueKey}
              value={value}
              onChange={handleEditorChange}
              title={note.title}
              onTitleChange={handleTitleChange}
              titlePlaceholder={titlePlaceholder}
              tags={note.tags}
              onTagsChange={handleTagsChange}
              summary={note.summary}
              canUseAi={canUseAi}
              onAiResult={handleAiResult}
              readOnly={isReadOnly}
              placeholder={editorPlaceholder}
              sharedType={editorSharedType}
              editor={editor}
              handleKeyDown={handleKeyDown}
              wide={wide}
            />
          )}
        </div>
      </div>

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

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除笔记</DialogTitle>
            <DialogDescription>
              删除后可在回收站恢复，确认删除这条笔记吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={deletePending}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deletePending}
            >
              {deletePending ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
