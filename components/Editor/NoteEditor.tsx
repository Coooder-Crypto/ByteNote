"use client";

import { useMemo, useState } from "react";
import type { Descendant } from "slate";

import { NoteTags } from "@/components/Common";
import { CollaboratorDialog, SlateEditor } from "@/components/Editor";
import { TagInput } from "@/components/TagInput";
import { Button } from "@/components/ui";
import useEditor from "@/hooks/Editor/useEditor";
import { useNoteActions } from "@/hooks/Note";

const EMPTY_VALUE: Descendant[] = [
  { type: "paragraph", children: [{ text: "" }] } as unknown as Descendant,
];

export default function NoteEditor({ noteId }: { noteId: string }) {
  const [collabOpen, setCollabOpen] = useState(false);
  const [collabEnabled, setCollabEnabled] = useState(false);
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
  } = useEditor(noteId, { collabEnabled });

  const { canEdit, isTrashed } = note.access;
  const titlePlaceholder = useMemo(
    () => (note.access.canEdit ? "输入标题" : "无权限编辑"),
    [note.access.canEdit],
  );

  const collabIndicator = useMemo(() => {
    if (!collabEnabled) return "idle";
    if (collabStatus === "connected") return "connected";
    if (collabStatus === "error") return "error";
    // connecting 或初始 idle 时展示连接中
    return "connecting";
  }, [collabEnabled, collabStatus]);

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

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          {canEdit ? (
            <input
              className="bg-card text-lg font-semibold outline-none"
              value={note.title}
              placeholder={titlePlaceholder}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={!canEdit || isTrashed}
            />
          ) : (
            <h2 className="text-lg font-semibold">{note.title || "笔记"}</h2>
          )}
          <div className="text-muted-foreground text-xs">
            {isTrashed
              ? "该笔记已在回收站，恢复后才能编辑。"
              : canEdit
                ? "可编辑"
                : "仅作者或协作者可编辑"}
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={!canEdit || isTrashed || saving}
            >
              {saving ? "保存中..." : "保存"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCollabOpen(true)}
              disabled={isTrashed}
            >
              管理协作者
            </Button>
            {note.isCollaborative && (
              <Button
                size="sm"
                variant={collabEnabled ? "outline" : "default"}
                onClick={async () => {
                  if (collabEnabled) {
                    await flushCollabToServer();
                    setCollabEnabled(false);
                  } else {
                    setCollabEnabled(true);
                  }
                }}
                disabled={isTrashed}
              >
                <span
                  className={`mr-2 inline-block h-2 w-2 rounded-full ${
                    collabIndicator === "connected"
                      ? "bg-emerald-500"
                      : collabIndicator === "connecting"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                  }`}
                />
                {collabEnabled ? "断开协作" : "连接协作"}
              </Button>
            )}
          </div>
        )}
      </div>

      <div>
        {canEdit ? (
          <TagInput
            value={note.tags}
            onChange={handleTagsChange}
            placeholder="添加标签"
            className="w-full"
          />
        ) : (
          <NoteTags tags={note.tags} />
        )}
      </div>

      <div className="border-border/60 bg-card/80 rounded-xl border shadow-sm">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-muted-foreground text-xs">
            {canEdit ? "实时编辑" : "内容"}
          </span>
        </div>
        <div className="px-3 py-3">
          {collabEnabled ? (
            sharedType ? (
              <SlateEditor
                valueKey={`collab-${noteId}`}
                value={value}
                onChange={(val) => handleContentChange(val as Descendant[])}
                readOnly={!canEdit || isTrashed}
                placeholder="开始输入..."
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
              readOnly={!canEdit || isTrashed}
              placeholder="开始输入..."
              sharedType={null}
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
      />
    </div>
  );
}
