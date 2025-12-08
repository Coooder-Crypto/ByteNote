"use client";

import { useMemo, useState } from "react";
import type { Descendant } from "slate";

import { CollaboratorDialog, SlateEditor } from "@/components/Editor";
import EditorHeader from "@/components/Editor/EditorHeader";
import { useUserStore } from "@/hooks";
import useEditor from "@/hooks/Editor/useEditor";
import { useNoteActions } from "@/hooks/Note";
import { trpc } from "@/lib/trpc/client";

const EMPTY_VALUE: Descendant[] = [
  { type: "paragraph", children: [{ text: "" }] } as unknown as Descendant,
];

export default function NoteEditor({ noteId }: { noteId: string }) {
  const [collabOpen, setCollabOpen] = useState(false);
  const [collabEnabled, setCollabEnabled] = useState(false);
  const { user } = useUserStore();
  const { setWsUrl, setWsPending } = useNoteActions({});
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
  } = useEditor(noteId, { collabEnabled });

  const { canEdit, isTrashed } = note.access;
  const titlePlaceholder = useMemo(
    () => (note.access.canEdit ? "Untitled note" : "无权限编辑"),
    [note.access.canEdit],
  );

  const value = useMemo(() => {
    const content = (note.contentJson as Descendant[]) ?? [];
    if (Array.isArray(content) && content.length > 0) return content;
    return EMPTY_VALUE;
  }, [note.contentJson]);

  const valueKey = useMemo(() => {
    try {
      return `${noteId}-${note.version}-${JSON.stringify(value).length}`;
    } catch {
      return `${noteId}-${note.version}-na`;
    }
  }, [noteId, note.version, value]);

  const charCount = useMemo(() => {
    const walk = (node: any): string => {
      if (!node) return "";
      if (typeof node.text === "string") return node.text;
      if (Array.isArray(node.children)) return node.children.map(walk).join("");
      if (Array.isArray(node)) return node.map(walk).join("");
      return "";
    };
    return walk(value).length;
  }, [value]);

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
    <div className="bg-background flex h-full flex-col">
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
            tagPlaceholder="添加标签，如 #design"
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
          tagPlaceholder="添加标签，如 #design"
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
          // 切换协作模式仅更新字段，不自动连接/断开 WS
          setCollabEnabled((prev) => (next ? prev : false));
        }}
      />
    </div>
  );
}
